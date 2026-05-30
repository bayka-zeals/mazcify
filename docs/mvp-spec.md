# Mazcify — MVP Specification
> Brand Mascot Creator + AI Video Generator
> Hackathon build: tight deadline, MVP scope only.

---

## 1. Product Vision

**Mazcify** lets small and mid-sized business owners paste their website URL and walk away with:
1. A custom AI-generated brand mascot (chosen from 4 variations)
2. A character sheet (front / side / back views)
3. A 30-second+ branded introduction video — ready to share

**Tagline:** *Give your brand a face.*

---

## 2. Branding

| Attribute | Value |
|---|---|
| Name | Mazcify |
| Vibe | Bold, vibrant, energetic |
| Palette | To be defined — colorful gradients, high contrast, playful typography |
| Target user (MVP) | Small & mid-sized business owners |
| Target user (future) | Marketing agencies managing multiple brands |

---

## 3. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 14 (App Router) | SSR for scraping step, API routes keep keys server-side |
| Styling | Tailwind CSS + shadcn/ui | Fast, production-quality UI components |
| Auth | Firebase Auth (Google only) | Simple, reliable, hackathon-friendly |
| Database | Firestore | Flexible NoSQL, works well with Firebase Auth |
| File Storage | Firebase Storage | Store images, character sheets, final videos |
| Scraping + AI | OpenAI API (GPT-4o) | Web scraping summarization + prompt generation |
| Image & Video | PixVerse API | Text-to-image (mascot), image-to-video (character sheet → clips) |
| Video Stitching | FFmpeg (via API route or Cloud Function) | Stitch 5 clips into final 30s+ MP4 |
| Prompt Storage | Firestore (JSON with `{{placeholders}}`) | Simple string replacement at runtime, user-editable |
| Build tooling | TRAE + Claude | Scaffolding, automation, prompt engineering |

---

## 4. Firebase Data Model

```
users/{uid}
  ├── profile
  │     ├── displayName
  │     ├── email
  │     └── createdAt
  │
  └── brands/{brandId}
        ├── meta
        │     ├── companyName
        │     ├── websiteUrl
        │     ├── logoUrl          ← Firebase Storage URL
        │     ├── colors[]         ← extracted brand colors
        │     ├── tone             ← e.g. "friendly, playful"
        │     ├── taglines[]
        │     ├── productNames[]
        │     └── updatedAt
        │
        ├── brandbook              ← full scraped summary as markdown string
        │
        ├── mascot
        │     ├── chosenImageUrl   ← Firebase Storage URL
        │     ├── prompt           ← final prompt used
        │     └── discardedUrls[]  ← the 3 unused variations
        │
        ├── characterSheet
        │     ├── frontUrl
        │     ├── sideUrl
        │     ├── backUrl
        │     └── generatedAt
        │
        └── videos/{videoId}
              ├── templateId       ← e.g. "introduction_v1"
              ├── status           ← pending | processing | done | failed
              ├── clipUrls[]       ← 5 individual clip URLs
              ├── finalVideoUrl    ← stitched MP4 URL
              └── createdAt
```

---

## 5. User Flow (MVP)

### Step 1 — Login
- Google Sign-In via Firebase Auth
- Redirect to Dashboard on success

### Step 2 — Dashboard
- Lists existing brands (if any)
- **"Create Mascot"** CTA button
- Shows status of any in-progress video jobs

### Step 3 — Brand Setup
Inputs:
- Website URL *(required)*
- Logo upload *(required)*
- Company name
- Gender preference: Male / Female / Neutral
- Personality traits (multi-select tags: Friendly, Bold, Playful, Professional, etc.)
- Optional: custom character description

On submit:
1. Scrape website → extract colors, tone, taglines, products, metadata (OpenAI)
2. Analyze logo → extract visual brand essence (OpenAI vision)
3. Combine into a **brandbook** (markdown string) → save to Firestore
4. Generate mascot creation prompt from brandbook → display to user
5. User can **edit the prompt** before proceeding

### Step 4 — Mascot Generation
- Send prompt + logo reference to PixVerse API → generate **4 image variations**
- Display all 4 in a selection grid
- User picks one → save `chosenImageUrl` to Firestore, discard others

### Step 5 — Character Sheet Generation
- Use chosen mascot + prompt → send to PixVerse for 3 images (front / side / back)
- Display character sheet to user
- User can **download** the character sheet
- Save all 3 URLs to Firestore under `characterSheet`

### Step 6 — Video Generation
- User selects the **Introduction Video** template (only template in MVP)
- Behind the scenes:
  1. Load video prompt template from Firestore (with `{{placeholders}}`)
  2. Fill placeholders with brandbook data (company name, tone, tagline, etc.)
  3. Send character sheet images + 5 filled prompts to PixVerse → generate **5 clips (~6s each)**
  4. Stitch clips with FFmpeg → final MP4 (~30s+)
  5. Upload to Firebase Storage → save URL to Firestore
- Show progress indicator during generation
- Final screen: **preview + download video**

---

## 6. Prompt Architecture

### Storage Format
Prompts stored as JSON documents in Firestore under `promptTemplates/{templateId}`:

```json
{
  "id": "introduction_v1",
  "name": "Brand Introduction",
  "clips": [
    {
      "clipIndex": 1,
      "description": "Mascot entrance",
      "prompt": "{{mascotDescription}}, dynamic entrance, {{brandTone}} energy, {{brandColors}} color palette, cinematic, 4K"
    },
    {
      "clipIndex": 2,
      "description": "Product showcase",
      "prompt": "{{mascotDescription}} presenting {{primaryProduct}}, friendly gesture, brand setting, {{brandColors}}"
    },
    {
      "clipIndex": 3,
      "description": "Brand personality moment",
      "prompt": "{{mascotDescription}} in action, {{personalityTrait}} mood, expressive, vibrant background"
    },
    {
      "clipIndex": 4,
      "description": "Tagline delivery",
      "prompt": "{{mascotDescription}} confident pose, text overlay: {{tagline}}, {{brandColors}}, clean background"
    },
    {
      "clipIndex": 5,
      "description": "Sign-off / CTA",
      "prompt": "{{mascotDescription}} waving goodbye, logo reveal, {{companyName}}, upbeat, high energy"
    }
  ]
}
```

### Per-user Copies
When a user first generates a video, a **copy** of the default template is saved under:
`users/{uid}/brands/{brandId}/promptOverrides/{templateId}`

This allows users to edit their own prompts without affecting the default.

### Placeholder Reference
| Placeholder | Source |
|---|---|
| `{{mascotDescription}}` | Mascot prompt (saved in Firestore) |
| `{{brandColors}}` | Extracted from scrape + logo analysis |
| `{{brandTone}}` | Extracted from scrape |
| `{{tagline}}` | Extracted from scrape |
| `{{companyName}}` | User input |
| `{{primaryProduct}}` | Extracted from scrape |
| `{{personalityTrait}}` | User input (Step 3) |

---

## 7. Pages & Components

```
/                        → Landing / Login page
/dashboard               → Brand list + Create CTA
/brand/new               → Step 3: Brand setup form
/brand/[brandId]/mascot  → Step 4: Mascot selection
/brand/[brandId]/sheet   → Step 5: Character sheet
/brand/[brandId]/video   → Step 6: Video generation + preview
/brand/[brandId]         → Brand overview (assets, download, manage)
```

---

## 8. Asset Kit (Downloadable)
From the brand overview page, users can download:
- [ ] Chosen mascot image (PNG)
- [ ] Character sheet (3-panel PNG or PDF)
- [ ] Final introduction video (MP4)

---

## 9. MVP Scope Boundaries

### ✅ In Scope
- Google login
- Single brand per user (UI supports more, but no switching for MVP)
- Website URL scraping + logo analysis
- 4 mascot variations → pick 1
- Character sheet (front/side/back)
- 1 video template: Brand Introduction (5 clips, 30s+)
- Download mascot, sheet, video
- User-editable prompt overrides

### ❌ Out of Scope (Post-MVP)
- Email/password auth
- Multiple brands per user (data model ready, UI not)
- Additional video templates (Sales, Storytelling)
- Team / agency accounts
- Mascot animation loop
- Embedded video widget for external sites
- Payment / subscription tier

---

## 10. Hackathon Judging Alignment

| Criterion | Weight | How Mazcify Addresses It |
|---|---|---|
| Video Generation Quality | 40% | PixVerse used for both mascot images and all 5 video clips; character sheet ensures visual consistency across cuts |
| App/Web Completeness & Integration | 30% | Full end-to-end flow from URL → video; download asset kit adds real utility beyond playback |
| TRAE Depth & Efficiency Gain | 30% | TRAE used for scaffolding, prompt generation, API wiring, and workflow automation throughout build |

---

## 11. Open Questions (Resolve During Build)
- [ ] Confirm PixVerse API rate limits for image + video generation
- [ ] Decide FFmpeg hosting: API route (serverless) vs. Firebase Cloud Function
- [ ] Finalize character sheet prompt structure for consistent front/side/back output
- [ ] Confirm PixVerse image-to-video accepts character sheet images as reference

---

*Last updated: initial spec — pre-build*
