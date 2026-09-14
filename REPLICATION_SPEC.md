# Fundraiser Site Blueprint
### Replicating the Ushka charity page's architecture for a new cause

**Source:** katokdoescode/ushka-help
**Stack:** Astro 7, static output
**Host:** Cloudflare Pages
**Server runtime:** none — build-time only

---

## 00. Overview

The reference project is a single Astro page: no CMS, no database, no server runtime. A donation target and a collected amount are two numbers in the page's frontmatter; a pure function derives every percentage and formatted string from them at build time. The result is prerendered to plain HTML and served as static files.

Cloning it for a new cause means standing up the same shell and replacing the numbers, copy, images, and payment channels — not rebuilding anything structural.

**What stays identical:** file layout, build pipeline, the donation-math function, the clipboard/lightbox/toast script, and the Cloudflare Pages build settings. Only content and (optionally) the color tokens change.

---

## 01. Stack & constraints

| Layer | Choice | Why it matters for a clone |
|---|---|---|
| Framework | Astro `^7.2.0`, `output: 'static'` | No adapter, no SSR — `astro build` emits plain HTML/CSS/JS to `dist/`. Any static host works. |
| Markup | Semantic HTML5 in `.astro` components | Content and layout live together in frontmatter + template, per component. |
| Styling | Plain CSS3, custom properties, Flexbox/Grid, scroll-snap gallery | One global stylesheet, no preprocessor, no utility framework. |
| Interactivity | Vanilla ES6, one script file, bundled inline by Vite | No client framework hydration cost — the script is the only JS shipped. |
| Data | Two numeric constants + one pure function | No data file/CMS to wire up — "editing content" means editing `index.astro`. |
| Types | TypeScript via `@astrojs/check`, run in `npm run build` | Catches prop-shape mistakes in `.astro` components before deploy. No test suite otherwise. |
| Host | Cloudflare Pages, Git-connected | Build command `npm run build`, output dir `dist` — see §07. |

---

## 02. Project structure

Reproduce this tree exactly. Nothing here is cause-specific except the photo filenames.

```
.
├── public/
│   ├── _headers                  ← security headers + asset caching, copied into dist/
│   └── assets/
│       ├── photo-1.jpg
│       ├── photo-2.jpg
│       └── photo-3.jpg           ← replace with the new cause's gallery images
├── src/
│   ├── components/
│   │   └── RequisiteCard.astro   ← shared chrome for one donation channel; reuse as-is
│   ├── layouts/
│   │   └── Layout.astro          ← HTML shell, toast + lightbox overlays; reuse as-is
│   ├── lib/
│   │   └── donationProgress.js   ← pure math, no DOM; reuse as-is (see §05 for currency)
│   ├── pages/
│   │   └── index.astro           ← the one route; almost everything cause-specific lives here
│   ├── scripts/
│   │   └── interactivity.js      ← clipboard / lightbox / progress-bar animation; reuse as-is
│   └── styles/
│       └── global.css            ← design tokens + layout rules; edit only the :root palette
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── README.md
```

---

## 03. Scaffold from zero

There's no npm template to fork from — recreate the shell manually.

**1. Create the project and install dependencies** (no CSS/JS libraries beyond Astro's own tooling):
```bash
mkdir new-cause-help && cd new-cause-help
npm init -y
npm install astro@^7.2.0
npm install -D @astrojs/check typescript
```

**2. `astro.config.mjs`** — fully static output, no adapter:
```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
});
```

**3. `package.json` scripts:**
```json
"scripts": {
  "dev": "astro dev",
  "build": "astro check && astro build",
  "preview": "astro preview",
  "astro": "astro"
}
```

**4.** Recreate the directory tree from §02, then port each file per the component spec in §04 — copy the four "reuse as-is" files unchanged, and rewrite `index.astro` and `global.css`'s palette for the new cause.

---

## 04. Component spec

One entry per file. **[REUSE AS-IS]** = copy unmodified. **[EDIT]** = holds cause-specific content.

### `src/pages/index.astro` — **[EDIT]**
The single route. Everything a new cause changes lives in its frontmatter and template.
- Frontmatter constants `DONATION_TARGET` and `DONATION_COLLECTED` — the two numbers that drive the whole progress card via `calculateDonationProgress()`.
- `galleryItems` — a `{ src, alt }` array mapped over, not duplicated per `<img>`. Point `src` at new files under `public/assets/`.
- Header badge/title, story-section paragraphs, footer line — hand-written prose; rewrite in whatever language/tone the new cause needs (see §05's i18n note).
- One `<RequisiteCard>` per donation channel, each with its own body `<slot>` markup — add/remove channels here, not inside the component.

### `src/lib/donationProgress.js` — **[REUSE AS-IS*]**
Pure function, zero DOM/Astro dependency, called once from `index.astro`'s frontmatter at build time.
```js
export function calculateDonationProgress(target, collected) {
  // amountLeft, progressBarWidth (2-decimal %), rounded
  // percentageCollected/Left, ru-RU-formatted ₽ strings
}
```
- Not clamped to 100% — an overfunded target reports over-100 `percentageCollected`; the bar's `overflow:hidden` container visually caps it. Keep this behavior.
- **\*Edit only** the currency formatter if the new cause isn't Russian-ruble: `Intl.NumberFormat('ru-RU', …)` and the hardcoded `₽` suffix in `formatRub()` are the one non-parameterized piece of this file.

### `src/layouts/Layout.astro` — **[REUSE AS-IS]**
The HTML shell: `<head>` from `title`/`description` props, imports `global.css`, wraps `<slot />`, and owns the two app-wide overlays that aren't page-specific — the toast container (`#toastContainer`, `aria-live="polite"`) and the lightbox modal (`#lightbox`, `role="dialog"`).
- Loads `interactivity.js` via `<script>import '../scripts/interactivity.js';</script>` — Astro/Vite inlines it at build time.
- Only the `title`/`description` props and `html lang="ru"` are cause-specific — pass new values from `index.astro`, and change `lang` if the new site isn't in Russian.

### `src/components/RequisiteCard.astro` — **[REUSE AS-IS]**
Shared chrome for one donation channel: flag emoji, channel name, "click to copy" badge, copy button with inline SVG icon.
```ts
interface Props {
  flag: string; channelName: string; copyTarget: string;
  ariaLabel: string; buttonLabel: string;
}
```
- The card body (IBAN vs. card+phone vs. email vs. wallet address) is the caller's default `<slot />` — a new channel is a new `<RequisiteCard>` usage in `index.astro`, never an edit to this component.

### `src/scripts/interactivity.js` — **[REUSE AS-IS*]**
Plain vanilla JS, DOM APIs only. Three independent functions run on `DOMContentLoaded`:
- `initClipboard()` — event-delegated clicks on `.requisite-card`; each card's payload comes from its `data-copy-target` attribute. A nested element (e.g. a phone row) can override with its own `data-copy-target` + `e.stopPropagation()` to avoid double-triggering the parent. Uses `navigator.clipboard` in secure contexts, falling back to a hidden-textarea `execCommand('copy')`.
- `initLightbox()` — full-screen viewer driven by `data-full` on `.gallery-item`; closes via button, outside-click, or Escape; locks body scroll while open.
- `animateProgressBarOnLoad()` — zeroes `#progressBar`'s width then reapplies the inline target width after a 150ms timeout, to force the CSS transition on load instead of a static fill.
- **\*Edit only** the label-matching substrings inside `copyText()` (currently matches `card/карты`, `iban`, `email/paypal`, `адрес/wallet`, `телефон/phone`) if a new channel needs its own toast wording, and the toast strings themselves if the site isn't in Russian.

### `src/styles/global.css` — **[EDIT palette only]**
Plain CSS, not Astro-scoped, imported once from `Layout.astro`. Layout rules, spacing and component styles are structural — reuse them. The `:root` custom-property block at the top is the one part meant to change per cause; see §06.

---

## 05. Data & copy parameterization

There's no data file — content lives directly in `index.astro` and, for UI chrome, in `Layout.astro` and `interactivity.js`.

| What | Where | Notes |
|---|---|---|
| Fundraising target & collected amount | `index.astro` frontmatter | `DONATION_TARGET`, `DONATION_COLLECTED` — everything else in the progress card is derived. |
| Currency & locale | `donationProgress.js` | Hardcoded to `ru-RU` / `₽`. Change the `Intl.NumberFormat` locale and suffix in `formatRub()` for a different currency. |
| Gallery photos | `public/assets/*.jpg` + `galleryItems` in `index.astro` | Keep the same relative `assets/…` path convention so `public/_headers`' `/assets/*` cache rule still matches. |
| Story copy, header, badge, footer | `index.astro` template | Warm, direct, first-person narration in the reference site — tone doesn't need to match, just stay internally consistent. |
| Donation channels | One `<RequisiteCard>` per channel in `index.astro` | Bank/IBAN, card+phone, PayPal, crypto wallet are the four in the reference site — add/remove/swap freely. |
| Page `<title>`/description/`theme-color` | `Layout` props (from `index.astro`) + `Layout.astro` head | `theme-color` should match the new palette's background token. |

**Not parameterized — plan for it:** there is no i18n layer. UI strings (toast messages, aria-labels, "click to copy" badge, swipe hint, the transfer-reference note) are hardcoded Russian literals spread across `index.astro`, `Layout.astro`, and `interactivity.js`'s `copyText()`/`showToast()`. If the new cause isn't Russian-language, budget time to hand-edit strings in all three files, plus `html lang` in `Layout.astro` — not just one config value.

---

## 06. Design tokens

Everything visual keys off the custom properties at the top of `global.css`. Retint the palette there; leave radii, shadows and transitions unless the new cause wants a different feel entirely.

```css
--bg-color: #faf8f6;          /* page background */
--card-bg: #ffffff;           /* content containers */
--text-primary: #2c2a29;
--text-secondary: #5e5b58;
--accent: #d97736;            /* primary action color */
--accent-hover: #c56528;
--accent-light: #fdf5f0;      /* tint for backgrounds */
--progress-fill: #81b29a;     /* distinct from accent */
--progress-bg: #e8e4e0;
--border-color: #ece8e4;
--success: #52b788;           /* clipboard feedback */
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...;
```

Keep the same *roles* when retinting: one background, one card surface, two text weights, one action accent (+ hover/light variants), a progress-fill distinct from the accent, and a success color. `--font-sans` is the system stack on purpose — changing it is the only place a clone would add an external font request.

---

## 07. Deployment — Cloudflare Pages

Identical settings to the reference project; only the repository differs.

1. Push the new repo to GitHub (or GitLab).
2. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git** → authorize and select the new repo.
3. Build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
4. Save and deploy. `public/_headers` (security headers + 1-month cache on `/assets/*`) is served verbatim by Astro into `dist/_headers` and picked up automatically by Cloudflare Pages — no separate config needed.

---

## 08. Preserve these constraints

The architecture's simplicity is deliberate. Resist adding any of the following when cloning it, even if a new cause's requirements tempt you to:

- No CMS or external data source — the two donation numbers and all copy are meant to be edited directly in source and redeployed.
- No client-side framework or hydration — interactivity stays hand-written vanilla JS in one file.
- No CSS framework or preprocessor — the token-driven plain stylesheet is the whole styling layer.
- No icon font or external font request — SVGs are inlined, type is the system stack.
- No server runtime or adapter — `output: 'static'` stays static; the build produces files, not a deployed function.

---

## 09. Replication checklist

- [ ] Scaffold the project (§03): `package.json`, `astro.config.mjs`, `npm install`
- [ ] Recreate the directory tree (§02)
- [ ] Copy `donationProgress.js`, `Layout.astro`, `RequisiteCard.astro`, `interactivity.js` unchanged
- [ ] Write new `DONATION_TARGET` / `DONATION_COLLECTED` and check the currency formatter
- [ ] Drop new gallery photos into `public/assets/` and update `galleryItems`
- [ ] Rewrite header, story copy and footer in `index.astro`
- [ ] Add a `<RequisiteCard>` per real donation channel for the new cause
- [ ] Retint the `:root` palette in `global.css` (§06) and match `theme-color` in `Layout`
- [ ] If not Russian-language: edit UI strings in `index.astro`, `Layout.astro`, `interactivity.js`, and `html lang`
- [ ] `npm run build` locally, `npm run preview` to sanity-check the static output
- [ ] Connect the new repo on Cloudflare Pages with the same build settings (§07)
