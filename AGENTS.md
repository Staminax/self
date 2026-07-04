# AGENTS.md

Static personal portfolio for Gustavo B. Vanilla HTML/CSS/JS — **no framework, no build, no bundler, no tests, no lint, no typecheck, no package.json**. This is deliberate (see `README.md`); do not introduce frameworks, build tooling, or module systems unless explicitly asked.

## Running / verifying

- No dev server. Open `index.html` directly in a browser, or rely on the Cloudflare Pages preview on push.
- There is nothing to `npm run`/`lint`/`test`. Verify changes by loading the page and clicking through sections + language/theme toggles.
- Desktop (>768px) uses custom wheel/arrow-key snap scrolling (`scripts/script.js`); mobile (<=768px) uses native scroll. Test both breakpoints.

## Script architecture — globals + load order

Scripts are plain `<script>` tags loaded in a **specific order in `index.html`** (bottom of `<body>`). There is no module system: files communicate via globals on `window`.

- `i18n/translations.js` must load before `i18n/i18n.js` (defines the `translations` global the latter reads).
- `scripts/experience.js` self-initializes on `DOMContentLoaded` because `i18n/i18n.js` runs `changeLanguage('en')` *before* `experience.js` (and thus `updateExperienceTimeline`) is defined. `changeLanguage` guards with `typeof ... === 'function'`.
- **Adding a script = add a `<script>` tag in the right place in `index.html`.** Respects existing load order; don't assume `defer`/`type=module`.
- Shared globals you'll see referenced across files: `translations`, `catCardsData`, `experiencesData`, `updateExperienceTimeline`, `changeLanguage`, `sections`, `currentSectionIndex`.

## Data is inlined in JS, not fetched

No `fetch`/XHR anywhere. Stacks, experience, and cat cards are hardcoded arrays at the top of their respective `scripts/*.js` files.

- `data/cat-cards.json` is **stale/unused** — `scripts/cat-cards.js` holds the real `catCardsData` array. Don't "fix" things by wiring the JSON; the inline array is the source of truth.

## i18n

- `data-i18n="<key>"` attributes on elements; `i18n/translations.js` holds the `translations` object with `en`/`pt`/`zh`/`ja` keys.
- `changeLanguage(lang)` (`i18n/i18n.js`) swaps text and re-renders the skills list and experience timeline.
- **Adding a language**: add a `<button class="lang-btn" data-lang="XX">` in `index.html` and an `XX:` block in `translations.js`. Every key must exist in the new locale or text silently disappears (the swapper only sets `innerHTML` when the key exists).

## Theme

- `data-theme="light|dark"` on `<html>`, persisted in `localStorage` key `theme` (`scripts/theme.js`).
- The branch canvas in `scripts/script.js` reads CSS custom properties `--branch-base` and `--branch-hover` at draw time. **Theme ↔ canvas coupling flows through CSS variables, not JS constants** — change branch colors in CSS, not in `script.js`'s `config`.

## Dormant feature: the cat deck

The cat card modal (`#cat-modal`, `scripts/modal.js` + `scripts/card-3d.js`) opens on click of any `.cats-trigger` element. That trigger is **commented out** in the `#personal` section of `index.html`, so the deck is currently unreachable from the UI. Code, data, and assets still ship. Don't treat this as a bug to "fix" by deleting it; re-enable by uncommenting the `.cats-container` block in `index.html` if asked.

## Deploy

Cloudflare Pages serves the repo root as static files (no build command). `_headers` forces `Cache-Control: no-cache, no-store, must-revalidate` on everything. Push to `main` to deploy.

## Conventions

- Single `main` branch; casual commit messages (e.g. `meow`, `Update experience.js`) — no conventional-commits scheme.
- No `.gitignore`; assets are committed directly.
