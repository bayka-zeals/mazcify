# Mazcify

> **Give Your Brand a Face** — AI-powered brand mascot creator and video generator.

Paste your website URL, get a custom AI mascot and a 30-second branded video in minutes.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Firebase Auth (Google) |
| Database | Firestore |
| Storage | Firebase Storage |
| AI | OpenAI GPT-4o (scraping + prompts) |
| Media | PixVerse API (images + video) |
| Hosting | Vercel |

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/mazcify.git
cd mazcify
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all values. See the [Environment Variables](#environment-variables) section below.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

All required variables are documented in [`.env.example`](.env.example).

| Variable | Where to get it |
|----------|----------------|
| `NEXT_PUBLIC_FIREBASE_*` | [Firebase Console](https://console.firebase.google.com) → Project Settings → Your Apps |
| `OPENAI_API_KEY` | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `PIXVERSE_API_KEY` | [PixVerse Platform](https://platform.pixverse.ai) |

> ⚠️ Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Never add secrets with this prefix.

---

## Project Structure

```
mazcify/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout + providers
│   ├── page.tsx                # Landing page
│   ├── login/page.tsx          # Login / sign-up
│   └── dashboard/
│       ├── layout.tsx          # Dashboard shell (auth guard)
│       ├── page.tsx            # Dashboard home
│       ├── creation/page.tsx   # Mascot + video creation
│       └── settings/page.tsx   # Account settings
│
├── components/
│   ├── landing/                # Landing page sections
│   ├── layout/                 # Sidebar, Topbar
│   ├── dashboard/              # Stat cards, welcome banner
│   ├── creation/               # Mascot and video components
│   └── ui/                     # shadcn/ui primitives
│
├── config/
│   ├── constants.ts            # App-wide constants + plan limits
│   └── env.ts                  # Env var validation (Zod)
│
├── hooks/
│   └── useAuth.ts              # Auth hook
│
├── lib/
│   ├── firebase.ts             # Firebase init
│   ├── auth-context.tsx        # Auth provider
│   └── utils.ts                # cn() helper
│
├── types/
│   └── index.ts                # All shared TypeScript types
│
├── styles/
│   └── globals.css             # Global styles + design tokens
│
├── public/                     # Static assets (logo, favicon)
│
├── .env.example                # Environment variable template
├── .gitignore
├── vercel.json                 # Vercel deployment config
└── .github/workflows/ci.yml   # GitHub Actions CI
```

---

## Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix lint errors
npm run type-check    # TypeScript type check (no emit)
npm run format        # Format with Prettier
npm run format:check  # Check formatting without writing
```

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.example` in the Vercel dashboard
4. Deploy — Vercel auto-deploys on every push to `main`

> In Firebase Console, add your Vercel domain to **Authentication → Authorized Domains**.

---

## Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in method → **Google**
3. Enable **Firestore Database** (start in production mode)
4. Enable **Storage**
5. Add `localhost` and your Vercel domain to **Authorized Domains**

---

## Contributing

This project is built for the PixVerse Hackathon. PRs and issues welcome after the hackathon period.

---

## License

MIT
