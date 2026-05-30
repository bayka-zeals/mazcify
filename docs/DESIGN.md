---
created: 2026-05-29
type: design-context
---

# Mazcify — Design System

## Design Context

### Users
Small and mid-sized business owners who want a branded mascot and AI-generated video without hiring a designer. They are non-technical, time-pressed, and excited to see results fast. They arrive skeptical and leave delighted. Future: marketing agency teams managing multiple brand identities.

### Brand Personality
**Bold. Playful. Modern.**
Mazcify is the cool creative tool that takes your boring brand URL and spits out a character with soul. It's confident without being intimidating. It's fun without being childish. It commands attention the moment you land on it.

### Aesthetic Direction
- **Theme**: Dark-first. Near-black backgrounds (`#0A0A0A`, `#111111`) with rich depth.
- **Accent**: Vivid orange `#FF8C00` — used for CTAs, highlights, hover states, and key UI moments. Never diluted.
- **Reference**: Pink Bear site — large hero type that bleeds behind the mascot character, bold nav, high contrast. That energy, our colors.
- **Anti-reference**: Generic SaaS purple gradients on white. Flat, safe, forgettable design. No soft pastels.
- **Typography**:
  - Headlines: **Bebas Neue** or **Anton** — loud, display, all-caps energy for hero sections
  - Body / UI: **DM Sans** — clean, modern, highly legible on dark backgrounds
- **Motion**: Staggered entrance animations on load. Orange glow pulses on CTA. Subtle parallax on hero mascot. Hover states with orange underlines or border flashes.
- **Texture**: Subtle noise grain overlay on hero background. Dark radial gradient behind mascot to create depth. Orange gradient glow leaking from behind key elements.
- **Layout**: Grid-breaking hero with oversized type sitting behind/around a mascot illustration. Asymmetric sections. Generous negative space in dark areas.

### Color Tokens

```css
--color-bg:           #0A0A0A;   /* near-black base */
--color-surface:      #111111;   /* card / panel surface */
--color-surface-2:    #1A1A1A;   /* elevated surfaces */
--color-border:       #2A2A2A;   /* subtle borders */
--color-accent:       #FF8C00;   /* vivid orange — primary accent */
--color-accent-dim:   #FF8C0022; /* orange tint for backgrounds */
--color-accent-glow:  #FF8C0055; /* orange glow for shadows */
--color-text-primary: #F5F5F5;   /* near-white body text */
--color-text-muted:   #888888;   /* secondary / meta text */
--color-text-inverse: #0A0A0A;   /* dark text on orange bg */
```

### Typography Scale

```css
--font-display: 'Anton', 'Bebas Neue', sans-serif;   /* headlines */
--font-body:    'DM Sans', sans-serif;               /* UI + body */

--text-hero:   clamp(72px, 12vw, 160px);   /* massive hero type */
--text-h1:     clamp(40px, 6vw, 80px);
--text-h2:     clamp(28px, 4vw, 48px);
--text-h3:     24px;
--text-body:   16px;
--text-small:  14px;
```

### Component Patterns

- **CTA Button**: Orange fill, dark text, slight border-radius (6px), uppercase DM Sans medium. On hover: orange glow shadow + slight scale.
- **Secondary Button**: Transparent with orange border, orange text. On hover: fill orange.
- **Nav**: Dark background, logo left, links center, CTA right. Subtle bottom border. Sticky.
- **Cards**: `--color-surface` background, `--color-border` border, orange accent on hover (left border flash or top glow).
- **Input fields**: Dark surface, subtle border, orange focus ring.

### Design Principles

1. **Orange is sacred** — Every page has one clear orange moment. Don't scatter it; concentrate it where action lives.
2. **Type is a design element** — Headlines are oversized, display-weight, and bold enough to function as visual texture.
3. **Dark depth over flat black** — Use layered surfaces, grain, and glow to create atmosphere. Never just `#000`.
4. **Speed of delight** — Users should feel the personality within 2 seconds of landing. The mascot and the name carry the brand instantly.
5. **Bold but not loud** — Confidence comes from restraint in the right places. Not every element competes for attention.
