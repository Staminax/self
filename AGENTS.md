# AGENTS.md

Static personal portfolio for Gustavo B. Vanilla HTML/CSS/JS — **no framework, no build, no bundler, no tests, no lint, no typecheck, no package.json**. This is deliberate (see `README.md`); do not introduce frameworks, build tooling, or module systems unless explicitly asked.

## Running / verifying

- No dev server. Open `index.html` directly in a browser, or rely on the Cloudflare Pages preview on push.
- There is nothing to `npm run`/`lint`/`test`. Verify changes by loading the page and clicking through sections + language/theme toggles.
- Desktop (>768px) uses custom wheel/arrow-key snap scrolling (`scripts/script.js`); mobile (<=768px) uses native scroll. Test both breakpoints.
- A **cinematic intro** plays on first load (~4.5s) before the site is interactive. Branches start growing at 3.85s (synced with the overlay fade). Reduced-motion users skip the intro entirely.

## Stylesheet architecture

CSS is split across 6 files loaded in order in `index.html` `<head>`:

1. `styles/main.css` — base layout, glass cards, typography, language switcher, cat card modal, user-select text overrides
2. `styles/cursor.css` — custom cursor elements (dot, eye, trail canvas); mobile hide rules
3. `styles/theme-toggle.css` — theme toggle button
4. `styles/navigation.css` — scroll-up button
5. `styles/experience.css` — timeline (career-chapters card layout)
6. `styles/boss.css` — **the aesthetic pass**: atmosphere (vignette, grain), cinematic intro, hero intro animation + content cascade (tagline/socials stagger), scroll-arrow bob, frosted glass upgrade, section progress dots, section flash, stacks hover descriptions, typewriter caret, Didact Gothic chrome (h2/dot labels), accessibility (focus-visible), card 3D tilt smoothing, touch sticky-hover resets (`@media (hover: none)`), short-viewport rules (`@media (max-height: 500px)`). Loads last so it overrides all prior rules.

**Adding CSS = add a `<link>` in `index.html` `<head>` after the existing ones.** `boss.css` must stay last.

### CSS custom properties (design tokens)

Defined in `:root` (dark theme) and `[data-theme="light"]` in `main.css` + `boss.css`:

- `--accent-1: #ffffff`, `--accent-2: #a0a0a0`, `--accent-3: #ff3b3b` — monochrome + red hint palette (`--accent-3` becomes `#c92020` in light theme; dots/numerals use the var)
- `--accent-grad` — silver gradient for hero name, section underlines, active lang button, job titles
- `--accent-glow: rgba(255, 59, 59, 0.22)` — red glow for hover effects (subtle)
- `--glass-tint` — glass card background tint (varies by theme)
- `--branch-base` / `--branch-hover` — branch canvas colors (read by JS at draw time)

Light theme inverts silver to dark grey and dims the red glow.

## Script architecture — globals + load order

Scripts are plain `<script>` tags loaded in a **specific order in `index.html`** (bottom of `<body>`). There is no module system: files communicate via globals on `window`.

Load order:
1. `i18n/translations.js` — defines `translations` global
2. `i18n/i18n.js` — defines `changeLanguage`, `typewriterTitles`; calls `changeLanguage('en')` on load
3. `scripts/theme.js` — theme toggle, persists to `localStorage`
4. `scripts/avatar-3d.js` — hides cursor dot/trail on avatar hover (tilt removed)
5. `scripts/script.js` — **the main engine**: branch canvas, sacred geometry seekers, atmosphere, cursor parallax, cinematic intro, section dots, scroll snap
6. `scripts/cursor.js` — custom cursor dot positioning + UI hover state (`.hovered`)
7. `scripts/cat-cards.js` — defines `catCardsData` (31 cards, inline)
8. `scripts/modal.js` — cat deck modal logic
9. `scripts/card-3d.js` — cat card 3D tilt (rAF-throttled, cached rect)
10. `scripts/stacks.js` — defines `stacksData` (with `desc` fields), renders stacks grid
11. `scripts/experience.js` — defines `experiencesData`, `updateExperienceTimeline`; self-initializes on `DOMContentLoaded`

- `i18n/i18n.js` runs `changeLanguage('en')` *before* `experience.js` loads. `changeLanguage` guards function calls with `typeof ... === 'function'`.
- `scripts/script.js` delays branch initialization via `initBranches()` until the intro completes (3.85s after load, or immediately for reduced-motion).
- **Adding a script = add a `<script>` tag in the right place in `index.html`.** Respects existing load order; don't assume `defer`/`type=module`.
- Shared globals: `translations`, `catCardsData`, `experiencesData`, `updateExperienceTimeline`, `changeLanguage`, `typewriterTitles`, `sections`, `currentSectionIndex`, `scrollToSection`, `initBranches`, `cachedBranchColors`, `getBranchColors`.

## The branch canvas system (`scripts/script.js`)

The `#choreographer` canvas is the visual centerpiece — a recursive branching network behind all content.

- **`BranchSegment` class**: stores start/end/control points, width, depth, animation timing. Draws with quadratic curves + `setLineDash` for the grow-in animation.
- **`generateAllBranches(targetIndex)`**: generates branches from random roots, avoiding glass cards (`isInsideCard`). Regenerated per section via `requestRegeneration(index)` (triggered by `IntersectionObserver`).
- **`getBranchColors()`**: reads `--branch-base` / `--branch-hover` CSS vars. **Cached** in `cachedBranchColors` — a `MutationObserver` on `data-theme` invalidates the cache on theme toggle. Don't call `getComputedStyle` per segment per frame.
- **Standing-still pulse**: when the cursor is still for 400ms+, hovered branches get +50% hover effect + a sine pulse (`lastMouseMoveTime` tracked in mousemove/touchmove).
- **Sacred geometry seekers** (`transientBranches`): transient pentagrams/hexagrams that form from existing branch endpoints, grow, flash, and dissolve. Capped at 6 concurrent, spawn every 2-3s. Each seeker: picks a center endpoint, finds 5-6 nearby endpoints sorted by angle, connects them with radial spokes + star edges (`{5/2}` pentagram or `{6/2}` hexagram). States: `grow` → `flash` → `dissolve`. Cleared on section regeneration.
- **Mouse parallax for orbs**: `orbEls` translate toward cursor (standalone `translate` property, composes with animated `transform`). rAF-throttled, disabled on mobile + reduced-motion.
- **Section progress dots**: 5 dots on the right edge (desktop only). Synced via observer, clickable via `scrollToSection`.
- **Section flash**: subtle 5% opacity pulse on section change (theme-aware via `--text-primary`).

## The cursor system (`scripts/cursor.js`)

- **`#cursor-dot`**: 23px circle at the tip, glows white (red on UI hover via `.hovered` class).
- **`#cursor-trail` canvas**: exists in the DOM but is hidden (`display: none`) — the trail was removed; the dot is the cursor.
- `card-3d.js` and `avatar-3d.js` hide the dot on hover (set opacity to '0', restore on leave).
- Mobile (≤768px) disables all custom cursor elements.

## Cinematic intro

- `#intro-overlay` in `index.html`: black full-screen overlay, z-index 99999.
- **`typeIntro(el, text, delay, speed)`** in `script.js`: JS typewriter for the intro text. Types "original does not mean" (subtitle) then "good" (large shimmer gradient name). Caret stays blinking (never removed).
- CSS animations handle the rest: `introFade` (overlay opacity + scale), `introContentOut` (text dissolves with blur + slide up), `introGlow` (pulsing drop-shadow on "good"), `introLine` (gradient line draws under the name).
- `initBranches()` is called at 3.85s (when the overlay starts fading) so branches begin growing as the site is revealed. `in-view` is added to `#home` at 4.15s (hero card reveals through fading overlay). Overlay `done` (display:none) at 4.55s.
- Reduced-motion: overlay hidden immediately, `in-view` added, `initBranches()` called.

## Typewriter effect

Two typewriter systems, both keep the caret blinking permanently (never removed — removing it causes text shift):

- **`typeIntro()`** in `script.js`: for the cinematic intro. Accepts `(el, text, delay, speed)`.
- **`typewriterTitles(scope)`** in `i18n/i18n.js`: for section titles. Called on `changeLanguage` (guarded by `document.readyState !== 'loading'` to skip initial load) and on first scroll-into-view via the observer (200ms delay). Accepts a scope selector like `'#stacks'` or `null` for all.
- Caret CSS: `.typewriter-caret` class with `caretBlink 0.7s step-end infinite` (use `step-end`, not `steps(2)` which stutters).

## Data is inlined in JS, not fetched

No `fetch`/XHR anywhere. Stacks (with `desc` fields), experience, and cat cards are hardcoded arrays at the top of their respective `scripts/*.js` files.

- `data/cat-cards.json` is **stale/unused** — `scripts/cat-cards.js` holds the real `catCardsData` array. Don't wire the JSON; the inline array is the source of truth.

## i18n

- `data-i18n="<key>"` attributes on elements; `i18n/translations.js` holds the `translations` object with `en`/`pt`/`zh`/`ja` keys.
- `changeLanguage(lang)` (`i18n/i18n.js`) swaps text, re-renders skills list and experience timeline, and triggers `typewriterTitles()` for all target sections.
- **Adding a language**: add a `<button class="lang-btn" data-lang="XX">` in `index.html` and an `XX:` block in `translations.js`. Every key must exist in the new locale or text silently disappears (the swapper only sets `innerHTML` when the key exists).
- The `catsText` translation contains the `.cats-trigger` element (the clickable cat deck opener).

## Theme

- `data-theme="light|dark"` on `<html>`, persisted in `localStorage` key `theme` (`scripts/theme.js`).
- The branch canvas reads `--branch-base` / `--branch-hover` via `getBranchColors()` — **cached**, auto-invalidated by `MutationObserver` on `data-theme`. **Theme ↔ canvas coupling flows through CSS variables, not JS constants.**
- Light theme has dedicated orb color overrides (darker greys + darker red) so orbs are visible on light backgrounds.

## The cat deck (re-enabled)

The cat card modal (`#cat-modal`, `scripts/modal.js` + `scripts/card-3d.js`) opens on click of any `.cats-trigger` element. The trigger is **live** in the `#personal` section of `index.html` (`.cats-container` block, uncommented). The trigger text is the `catsText` i18n key ("The Silly Cats Deck" in English). 31 Yu-Gi-Oh style cat cards with stats, descriptions, and 3D tilt. `card-3d.js` uses rAF-throttled tilt with cached `getBoundingClientRect()` for smooth performance.

## Atmosphere system (`styles/boss.css`)

Fixed layers around all content:

- **`#shader-bg`** (z-index 100000 during intro, then 0 via `.behind`): WebGL "Living Veins" shader (`scripts/shader-bg.js`), domain-warped fbm, cursor clearing/glow, DPR capped at 1.5.
- **`.vignette`** (z-index 500): radial gradient darkening screen edges.
- **`.grain`** (z-index 501): animated SVG noise texture (inset -25%), low opacity.

All `pointer-events: none`, `aria-hidden="true"`. Reduced-motion disables grain animation.

## Deploy

Cloudflare Pages serves the repo root as static files (no build command). `_headers` forces `Cache-Control: no-cache, no-store, must-revalidate` on everything. Push to `main` to deploy.

## Conventions

- Single `main` branch; casual commit messages (e.g. `meow`, `Update experience.js`) — no conventional-commits scheme.
- No `.gitignore`; assets are committed directly.
- Monochrome + subtle red accent is the design language. Don't introduce other accent colors.
- `cursor: none` is set globally — the custom cursor replaces the native one. Keep this.
- Mobile breakpoint is 768px. Test both desktop (snap scroll) and mobile (native scroll) for every change.

## Accessibility

- Viewport allows pinch-zoom (`user-scalable` removed). Don't re-add it.
- `*:focus-visible` provides keyboard focus outlines (theme-aware). Don't remove.
- `prefers-reduced-motion` disables: orbs, grain, intro (skipped entirely), hero card animation, typewriter caret blink. Branches still render (static).
