# Mazcify — Frontend Build Plan

> Framework: **Next.js 14 (App Router)** + Tailwind CSS + shadcn/ui
> Theme: Dark-first, vivid orange (#FF8C00) accent, Anton + DM Sans typography

---

## 1. Project Structure

```
mazcify/
├── app/
│   ├── layout.tsx                  # Root layout (font loading, providers)
│   ├── page.tsx                    # Landing page (public)
│   ├── login/
│   │   └── page.tsx                # Login / Sign-up page
│   └── dashboard/
│       ├── layout.tsx              # Dashboard shell (sidebar + topbar)
│       ├── page.tsx                # Home (default dashboard view)
│       ├── creation/
│       │   └── page.tsx            # Creation page (mascot + video)
│       └── settings/
│           └── page.tsx            # Settings page
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             # Left panel (20%), collapsible
│   │   ├── Topbar.tsx              # Top banner (logo + user icon)
│   │   └── DashboardShell.tsx      # Sidebar + Topbar wrapper
│   ├── landing/
│   │   ├── Hero.tsx                # Hero section (title, subtitle, CTA)
│   │   ├── HowItWorks.tsx          # 3-step section
│   │   ├── Features.tsx            # Feature cards grid
│   │   └── LandingNav.tsx          # Public nav (logo + login button)
│   ├── dashboard/
│   │   ├── StatsCard.tsx           # Metric card (mascots / videos / tokens)
│   │   └── WelcomeBanner.tsx       # Greeting + quick action
│   ├── creation/
│   │   ├── MascotSection.tsx       # Mascot card OR empty CTA
│   │   ├── MascotEmptyState.tsx    # "Create Mascot Now!" CTA
│   │   ├── MascotCard.tsx          # Displays existing mascot
│   │   └── VideoSection.tsx        # Video area (only if mascot exists)
│   └── ui/                         # shadcn/ui components live here
│
├── lib/
│   ├── firebase.ts                 # Firebase init (auth, db, storage)
│   └── auth-context.tsx            # Auth provider + useAuth hook
│
├── hooks/
│   └── useAuth.ts                  # Google sign-in / sign-out / user state
│
└── public/
    └── logo.svg                    # Mazcify logo (to be added)
```

---

## 2. Pages

### 2.1 Landing Page — `/`
**Purpose:** Convert visitors into sign-ups.

**Sections (top to bottom):**
1. **LandingNav** — Logo left, `Login / Sign Up` button top-right
2. **Hero** — Full-viewport section
   - Eyebrow tag: `AI-Powered Brand Mascot Creator`
   - Headline: Large display type, e.g. `GIVE YOUR BRAND A FACE`
   - Subheadline: 1–2 sentence value prop
   - CTA button: **`Mazcify It Now!`** → routes to `/login`
3. **HowItWorks** — 3-step strip (Drop URL → Pick Mascot → Get Video)
4. **Features** — 4-card grid (Brand DNA, Mascot Gen, Character Sheet, Video)
5. **Bottom CTA** — Repeat headline + `Mazcify It Now!` button
6. **Footer** — Logo + copyright

**Notes:**
- Fully public, no auth required
- No sidebar, no topbar — standalone layout
- Animation: staggered fade-up on scroll

---

### 2.2 Login / Sign-Up Page — `/login`
**Purpose:** Authenticate user via Google.

**Layout:** Centered card on dark background, no nav/sidebar.

**Content:**
- Mazcify logo + name
- Headline: `Welcome to Mazcify`
- Subline: `Sign in to start building your brand mascot`
- **Google Sign-In button** (Firebase Auth GoogleAuthProvider)
- Small terms of service note
- On success → redirect to `/dashboard`

**Notes:**
- If user is already authenticated → auto-redirect to `/dashboard`
- Use Firebase `onAuthStateChanged` to detect session

---

### 2.3 Dashboard Layout — `/dashboard/*`
**Purpose:** Persistent shell for all authenticated pages.

**Structure:**
```
┌─────────────────────────────────────────────┐
│              TOPBAR (full width)            │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ SIDEBAR  │         MAIN CONTENT             │
│  (20%)   │            (80%)                 │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

#### Topbar
- Left: **Mazcify logo** + wordmark
- Right: **User avatar** (Google profile photo) + display name + dropdown (Settings, Sign Out)

#### Sidebar (20% width, collapsible)
Nav items with icon + label:

| Icon | Label | Route |
|------|-------|-------|
| Home | Home | `/dashboard` |
| Wand | Creation | `/dashboard/creation` |
| Gear | Settings | `/dashboard/settings` |

- **Desktop**: Full icon + label (240px wide)
- **Collapsed**: Icon-only (64px wide), labels hidden, tooltips on hover
- Active state: Orange left border + orange icon tint
- Toggle button at bottom of sidebar

---

### 2.4 Dashboard Home — `/dashboard`
**Purpose:** Overview and quick stats.

**Layout (main area):**
```
┌─────────────────────────────────────────┐
│  Welcome back, [Name]                   │
│  Here's your brand overview             │
├─────────────┬─────────────┬─────────────┤
│  Mascots    │   Videos    │   Tokens    │
│  Created    │  Generated  │    Used     │
│   1 / 3     │      2      │  840 / 1000 │
├─────────────┴─────────────┴─────────────┤
│  Quick Action: [ + Create New Mascot ]  │
└─────────────────────────────────────────┘
```

**Stat cards (3 total):**
- **Mascots Created** — `X / 3` (MVP free limit)
- **Videos Generated** — total count
- **API Tokens Used** — `X / 1000` with orange progress bar

**Quick Action:** Orange CTA → links to `/dashboard/creation`

---

### 2.5 Creation Page — `/dashboard/creation`
**Purpose:** Core product flow — mascot management + video generation.

#### Section A — Mascot

| State | Display |
|-------|---------|
| No mascot | Empty state card, icon + copy + orange CTA `Create Mascot Now!` |
| Mascot exists | MascotCard: thumbnail, name, date, character sheet status, actions |

MascotCard actions: `View` · `Regenerate` · `Download`

#### Section B — Video *(only rendered if mascot exists)*
- Hidden/locked if no mascot exists
- Template selector (MVP: one template — `Brand Introduction`)
- Video list: cards with status badge (`Done` / `Processing` / `Failed`)
- CTA: **`Generate Video`**

---

### 2.6 Settings Page — `/dashboard/settings`

**Sections:**
- **Account** — name, email, photo (Google, read-only)
- **Brandbook** — view/edit scraped brand markdown
- **Danger Zone** — delete account / reset data

---

## 3. Key Components

### StatsCard
```
Props: title, value, subValue?, icon, progressValue?, progressMax?
```
Dark surface, orange icon tint, optional progress bar.

### Sidebar
```
Props: collapsed (boolean), onToggle
```
Width transitions: `240px ↔ 64px`. Uses `usePathname()` for active link detection.

### MascotCard
```
Props: { name, imageUrl, createdAt, characterSheetReady }
```
Thumbnail with hover overlay, status chip, 3 action buttons.

---

## 4. Auth & Route Protection

| Route | Access |
|-------|--------|
| `/` | Public |
| `/login` | Public (redirect to `/dashboard` if already authed) |
| `/dashboard/*` | Protected (redirect to `/login` if not authed) |

**Implementation:** `middleware.ts` checks Firebase session cookie on every `/dashboard/*` request.

---

## 5. Build Order (Hackathon Priority)

| # | Task | Priority |
|---|------|----------|
| 1 | Next.js scaffold + Tailwind + shadcn setup | Critical |
| 2 | Firebase auth lib + useAuth hook | Critical |
| 3 | Landing page (Hero + Nav + CTA) | Critical |
| 4 | Login page + Google auth flow | Critical |
| 5 | Dashboard shell (Sidebar + Topbar + layout) | Critical |
| 6 | Dashboard home (3 stat cards + welcome) | Important |
| 7 | Creation page — Mascot empty state + card | Important |
| 8 | Creation page — Video section | Important |
| 9 | Settings page | Nice to have |
| 10 | Sidebar collapse animation | Nice to have |

---

## 6. Design Tokens (from DESIGN.md)

```css
--bg:           #0A0A0A;
--surface:      #111111;
--surface-2:    #1A1A1A;
--border:       #2A2A2A;
--accent:       #FF8C00;
--text:         #F5F5F5;
--muted:        #888888;
--font-display: 'Anton', sans-serif;
--font-body:    'DM Sans', sans-serif;
```

---

*Last updated: frontend plan — pre-build*
