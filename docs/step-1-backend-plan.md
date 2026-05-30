# Step 1 — Backend Plan (Image Generation)

## Context

- Project: **Mazcify** — Next.js 14 (App Router) + Firebase + Tailwind
- Stack: TypeScript, Zod validation, Firebase client SDK (no Admin SDK), OpenAI GPT-4.1-mini, PixVerse REST API
- This plan covers everything server-side for the mascot image generation wizard.
- The matching frontend (wizard page + components) is already implemented.

---

## Architecture

```
Client Browser
  └─ Wizard page (Step1Form / PromptEditor / MascotVariations)
  └─ lib/firestore-client.ts  ──────────────────────────────▶  Cloud Firestore (client SDK)

Next.js API Routes
  └─ POST /api/scrape
       ├─ lib/scraper.ts (fetch + cheerio + pdf-parse)
       └─ lib/openai.ts  (2× GPT-4.1-mini)           ──────▶  OpenAI
  └─ POST /api/mascot
       └─ lib/pixverse.ts                             ──────▶  PixVerse REST API
  └─ PATCH /api/mascot
       └─ lib/pixverse.ts (upload + character sheet)  ──────▶  PixVerse REST API
```

Flow:
1. Frontend POSTs to `/api/scrape` → gets `{brandId, mascotId, brandbook, meta, imagePrompt}`
2. Frontend saves brand/mascot/prompt docs to Firestore (client SDK)
3. Frontend POSTs to `/api/mascot` → gets `{variations: [{id, imageUrl}]}`
4. User picks a variation → Frontend PATCHes `/api/mascot` → gets `{characterSheetUrl}`
5. Frontend saves chosen variation + character sheet to Firestore

---

## New Files

### API Routes
- `app/api/scrape/route.ts` — POST: scrape → brand analysis → prompt generation
- `app/api/mascot/route.ts` — POST (generate 3 images) + PATCH (choose variation, trigger character sheet)

### Libraries
- `lib/scraper.ts` — HTML fetch + cheerio parse + PDF text extraction
- `lib/openai.ts` — Two-call OpenAI pipeline (brand analysis + image prompt)
- `lib/pixverse.ts` — PixVerse REST API client (T2I generation + polling + upload + character sheet)
- `lib/firestore-client.ts` — Client-side Firestore write helpers (called from wizard page, NOT API routes)

### Tests
- `__tests__/lib/scraper.test.ts`
- `__tests__/lib/openai.test.ts`
- `__tests__/lib/pixverse.test.ts`
- `__tests__/api/scrape.test.ts`
- `__tests__/api/mascot.test.ts`
- `jest.config.ts`
- `jest.setup.ts`

### Modified Files
- `package.json` — Add runtime + dev dependencies; add `test` script
- `app/dashboard/creation/new/page.tsx` — Add calls to `lib/firestore-client.ts` after each API response
- `config/env.ts` — No changes needed (OPENAI_API_KEY and PIXVERSE_API_KEY already present)

---

## API Contracts

### POST `/api/scrape`

```typescript
// Request body (Zod-validated)
{
  userId: string
  url: string
  mascotName?: string
  description?: string
  gender: 'male' | 'female' | 'neutral'
  assetStorageUrls?: string[]      // Firebase Storage download URLs
  currentMascotCount: number       // frontend passes this for rate limit check
}

// Response
{
  brandId: string        // generated UUID (crypto.randomUUID())
  mascotId: string       // generated UUID
  brandbook: string      // markdown summary from OpenAI Call 1
  meta: BrandMeta        // companyName, colors[], tone, taglines[], productNames[], websiteUrl
  imagePrompt: string    // text-to-image prompt from OpenAI Call 2
}
```

**Processing pipeline:**
1. Zod validate → 400 on failure
2. Rate limit guard: reject if `currentMascotCount >= 3` → 429
3. Fetch HTML with native `fetch()` + 8s AbortController timeout; on error → empty string (graceful fallback)
4. Parse HTML with cheerio: extract title, meta description, h1–h3 headings, body text (truncated to 4 000 chars)
5. For each PDF in `assetStorageUrls`: fetch buffer → `pdf-parse` → first 3 000 chars of text; skip PNG/JPG
6. **OpenAI Call 1** (brand analysis): system prompt requests structured JSON → `{companyName, colors[], tone, taglines[], productNames[], brandbook}`
7. **OpenAI Call 2** (prompt generation): receives brand meta + form params → outputs single T2I prompt string
8. Generate `brandId` and `mascotId` with `crypto.randomUUID()`
9. Return response (no Firestore write — client saves)

**Fallback:** if website blocks scraping (empty/error HTML), both OpenAI calls still run using only form inputs + URL domain as company name hint.

---

### POST `/api/mascot`

```typescript
// Request body
{
  userId: string
  brandId: string
  mascotId: string
  imagePrompt: string
}

// Response
{
  variations: Array<{ id: string; imageUrl: string }>  // 3 items
}
```

**Processing pipeline:**
1. Zod validate → 400 on failure
2. Call `pixverse.generateImages(prompt, 3)` — 3 parallel T2I submissions, then poll all until complete
3. Return `variations` (IDs are PixVerse `image_id` values as strings)

**PixVerse T2I REST endpoint:**
- Submit: `POST https://app-api.pixverse.ai/openapi/v2/image/generate`
- Poll result: `GET https://app-api.pixverse.ai/openapi/v2/image/result/{image_id}`
- Auth headers: `API-KEY: <PIXVERSE_API_KEY>` + `Ai-trace-id: <fresh-uuid-per-request>`
- Model: `seedream-5.0-lite`, quality: `1080p`, aspect ratio: `1:1`

---

### PATCH `/api/mascot`

```typescript
// Request body
{
  userId: string
  brandId: string
  mascotId: string
  chosenVariationId: string    // PixVerse image_id of selected variation
  chosenImageUrl: string       // URL of selected variation image
  mascotName?: string
  gender: 'male' | 'female' | 'neutral'
  description?: string
}

// Response
{
  characterSheetUrl: string
  characterSheetImageId: string
}
```

**Processing pipeline:**
1. Zod validate → 400 on failure
2. Download `chosenImageUrl` as Buffer
3. Upload to PixVerse: `POST /openapi/v2/image/upload` (multipart form-data) → `img_id`
4. Build character sheet prompt:
   ```
   Ultra-high-detail 3D toon illustration. {mascotName} brand mascot character.
   {gender} cartoon character. {description}.
   Three-view character sheet layout: front full-body view, side full-body view,
   and back full-body view aligned in a row; enlarged head-and-face detail on
   the far left; clothing details strip below. Pure solid white (#FFFFFF)
   background, edge-to-edge. Clean, balanced, professional.
   ```
5. Submit I2I with `img_id` + prompt; model fallback chain: `gpt-image-2.0` → `gemini-3.1-flash` → `seedream-5.0-lite`; quality `1440p`, aspect ratio `16:9`
6. Poll until complete (`status === 1`); return `characterSheetUrl`

---

## Library Modules

### `lib/scraper.ts`

```typescript
interface ScrapedContent {
  title: string
  metaDescription: string
  headings: string[]
  bodyText: string        // truncated to 4 000 chars
}

export async function fetchAndParse(url: string): Promise<ScrapedContent>
// native fetch + AbortController (8s timeout)
// cheerio: title, meta[name=description], h1–h3, body text (strip script/style tags)
// On any error: returns empty ScrapedContent

export async function extractPdfText(url: string): Promise<string>
// fetch URL as ArrayBuffer → pdf-parse → return first 3 000 chars
// On error: return ''
```

### `lib/openai.ts`

```typescript
// Singleton OpenAI client using getServerEnv().OPENAI_API_KEY

export async function analyzeBrand(
  scraped: ScrapedContent,
  pdfTexts: string[],
  url: string,
): Promise<{ meta: Omit<BrandMeta, 'id' | 'updatedAt'>; brandbook: string }>
// model: gpt-4.1-mini
// system: "Analyze the provided website content and extract brand information as JSON"
// user: concatenated title + meta + headings + body + pdf texts + url
// response_format: json_object
// Falls back to URL domain as companyName if scrape was empty

export async function generateImagePrompt(
  meta: Omit<BrandMeta, 'id' | 'updatedAt'>,
  params: { gender: string; description?: string; mascotName?: string },
): Promise<string>
// model: gpt-4.1-mini
// Returns a single T2I prompt string
// Includes: subject (gender + name), brand colors, description/personality,
//           + fixed style anchor: "cartoon mascot, vector art, clean lines,
//             full body, white background, character design, centered, high quality, no text"
```

### `lib/pixverse.ts`

```typescript
const PIXVERSE_BASE = 'https://app-api.pixverse.ai/openapi/v2'

// Returns headers with API-KEY and a fresh Ai-trace-id UUID
function pixverseHeaders(): Record<string, string>

// POST /image/generate — submits T2I job, returns image_id
export async function submitImageGeneration(
  prompt: string,
  model: string = 'seedream-5.0-lite',
  imgId?: number,           // if provided, performs I2I
): Promise<number>

// GET /image/result/{id} — polls every 3s up to 120s; returns image URL on status=1
// Throws on status=8 (failed) or timeout
export async function pollImageResult(imageId: number): Promise<string>

// Runs submitImageGeneration × count in parallel, polls all, returns MascotVariation[]
export async function generateImages(prompt: string, count: number): Promise<MascotVariation[]>

// POST /image/upload (multipart) — returns img_id
export async function uploadImage(source: Buffer | string): Promise<number>

// Downloads chosenImageUrl → uploads → runs I2I character sheet with fallback chain
// Fallback chain: gpt-image-2.0 → gemini-3.1-flash → seedream-5.0-lite
export async function generateCharacterSheet(
  chosenImageUrl: string,
  params: { mascotName?: string; gender: string; description?: string },
): Promise<{ imageId: number; url: string }>
```

### `lib/firestore-client.ts`

```typescript
// All use client-side Firestore SDK from lib/firebase.ts
// Called from app/dashboard/creation/new/page.tsx — NOT from API routes

export async function saveBrand(
  uid: string,
  brandId: string,
  data: Omit<BrandMeta, 'id' | 'updatedAt'> & { brandbook: string },
): Promise<void>
// Writes to: users/{uid}/brands/{brandId}

export async function saveMascot(
  uid: string,
  brandId: string,
  mascotId: string,
  data: Partial<Mascot>,
): Promise<void>
// Writes to: users/{uid}/brands/{brandId}/mascots/{mascotId}

export async function savePromptVersion(
  uid: string,
  brandId: string,
  prompt: string,
): Promise<string>
// Writes to: users/{uid}/brands/{brandId}/prompts/{auto-id}
// Returns: generated promptId

export async function updateMascotChosen(
  uid: string,
  brandId: string,
  mascotId: string,
  chosenImageUrl: string,
  characterSheetUrl: string,
): Promise<void>
// Updates: users/{uid}/brands/{brandId}/mascots/{mascotId}
// Sets: chosenImageUrl, characterSheet.frontUrl (= characterSheetUrl), status = 'chosen'
```

---

## Firestore Data Model

```
users/{uid}/
  brands/{brandId}
    websiteUrl: string
    companyName: string
    colors: string[]
    tone: string
    taglines: string[]
    productNames: string[]
    brandbook: string         ← markdown from OpenAI
    createdAt: Timestamp
    updatedAt: Timestamp

    mascots/{mascotId}
      name: string
      gender: 'male' | 'female' | 'neutral'
      description: string
      imagePrompt: string     ← the T2I prompt (latest version used)
      status: 'generating' | 'selecting' | 'chosen'
      variations: Array<{ id: string; imageUrl: string }>
      chosenVariationId: string | null
      chosenImageUrl: string | null
      characterSheet: { frontUrl: string; generatedAt: string } | null
      createdAt: Timestamp
      updatedAt: Timestamp

    prompts/{promptId}        ← every Generate Prompt / Generate Mascot click saves one
      text: string
      createdAt: Timestamp
```

---

## Unit Tests

### `jest.config.ts`
```typescript
// ts-jest transformer, testEnvironment: 'node'
// testMatch: ['**/__tests__/**/*.test.ts']
// moduleNameMapper for @/ path alias
```

### `__tests__/lib/scraper.test.ts`
- `fetchAndParse`: returns correct title/meta/headings from mocked HTML response
- `fetchAndParse`: truncates body text to 4 000 chars
- `fetchAndParse`: returns empty `ScrapedContent` when fetch throws
- `fetchAndParse`: returns empty `ScrapedContent` on 403 response
- `extractPdfText`: returns extracted text from mocked PDF buffer
- `extractPdfText`: returns `''` on fetch error

### `__tests__/lib/openai.test.ts`
```typescript
jest.mock('openai')
```
- `analyzeBrand`: parses valid JSON response into correct `BrandMeta` shape
- `analyzeBrand`: handles malformed/non-JSON response (returns safe default with URL domain)
- `analyzeBrand`: includes pdf text in user message when pdfTexts provided
- `generateImagePrompt`: returned string contains gender, brand colors, and style keywords
- `generateImagePrompt`: works when optional fields (description, mascotName) are undefined

### `__tests__/lib/pixverse.test.ts`
```typescript
// global.fetch = jest.fn()
```
- `pollImageResult`: resolves on first poll when `status === 1`
- `pollImageResult`: retries and resolves on 3rd poll
- `pollImageResult`: throws `PixVerseError` when `status === 8` (failed)
- `pollImageResult`: throws timeout error after 120s (mock timers)
- `generateImages`: submits 3 parallel jobs and returns 3 `MascotVariation` items
- `uploadImage`: POSTs multipart form and returns `img_id` from response
- `generateCharacterSheet`: tries `gpt-image-2.0` first; on status=8 falls through to `gemini-3.1-flash`

### `__tests__/api/scrape.test.ts`
```typescript
jest.mock('@/lib/scraper')
jest.mock('@/lib/openai')
```
- Returns 400 when `url` is missing
- Returns 429 when `currentMascotCount >= 3`
- Returns 200 with `{brandId, mascotId, brandbook, meta, imagePrompt}` on happy path
- Returns 200 with fallback prompt when `fetchAndParse` returns empty content
- Returns 500 on unexpected OpenAI error

### `__tests__/api/mascot.test.ts`
```typescript
jest.mock('@/lib/pixverse')
```
- POST returns 400 for missing `imagePrompt`
- POST returns 200 with exactly 3 `variations` on happy path
- PATCH returns 400 for missing `chosenVariationId`
- PATCH returns 200 with `characterSheetUrl` on happy path
- PATCH returns 500 when character sheet generation exhausts all fallback models

---

## New Dependencies

```bash
# Runtime
npm install cheerio openai pdf-parse uuid

# Dev (testing)
npm install -D jest ts-jest @types/jest jest-environment-node @types/pdf-parse @types/uuid
```

## Updated `package.json` scripts

```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

## Environment Variables

No new vars needed — all already in `.env.local`:
- `OPENAI_API_KEY`
- `PIXVERSE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` (used by client SDK)

---

## To-Do Checklist

- [ ] `be-deps` — Install runtime + dev dependencies
- [ ] `be-jest-config` — Create `jest.config.ts` and `jest.setup.ts`
- [ ] `be-scraper` — Create `lib/scraper.ts`
- [ ] `be-openai` — Create `lib/openai.ts`
- [ ] `be-pixverse` — Create `lib/pixverse.ts`
- [ ] `be-firestore-client` — Create `lib/firestore-client.ts`
- [ ] `be-api-scrape` — Create `app/api/scrape/route.ts`
- [ ] `be-api-mascot` — Create `app/api/mascot/route.ts`
- [ ] `be-wire-firestore` — Update `app/dashboard/creation/new/page.tsx` with Firestore saves
- [ ] `be-tests-scraper` — Write `__tests__/lib/scraper.test.ts`
- [ ] `be-tests-openai` — Write `__tests__/lib/openai.test.ts`
- [ ] `be-tests-pixverse` — Write `__tests__/lib/pixverse.test.ts`
- [ ] `be-tests-api-scrape` — Write `__tests__/api/scrape.test.ts`
- [ ] `be-tests-api-mascot` — Write `__tests__/api/mascot.test.ts`
