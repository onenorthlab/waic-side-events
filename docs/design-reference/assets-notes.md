# WaytoAGI Asset Notes

Companion to `DESIGN.md`. All URLs verified live on 2026-07-07 via agent-browser.

## Logo

- Canonical SVG: `https://www.waytoagi.com/images/logo.svg` — downloaded to `docs/design-reference/waytoagi-logo.svg` (317×102 viewBox)
- Composition: gray `#ECEDEA` rounded square (rx=8) + concentric rainbow circles (`#FC4A55`, `#FFB045`, `#FFFA6D`, `#30FD2F`, `#3BA9FE`, `#965DED`) + black sparkle accents + black CJK wordmark "通往AGI之路" paths
- Header uses an *inline* SVG variant (same artwork, slightly different offsets), rendered at `h-14` (56px)
- Footer uses `<img src="/images/logo.svg">` at `h-14` (footer alt text is leftover "FlowBite Logo")

## Favicon

- `https://www.waytoagi.com/favicon.ico` (single `link rel=icon`; no apple-touch-icon / manifest icons observed)

## Image CDN (assets.waytoagi.com)

- All content imagery served from `https://assets.waytoagi.com/usercontent/<slug>_<hash>.<ext>`
- Resize via query param: `?image_process=resize,w_600` (only `w_600` observed, used on all card covers; icons/tabs load un-resized originals)
- Card covers: rendered 302×176 (`h-44`, object-cover) from w_600 sources
- App icons: 40×40 rendered, original PNGs (e.g. `codex_color_0f39068d30.png`)
- Tool-tab icons: small PNGs (e.g. `2_22e6189e56.png`)
- Carousel posters: original JPGs, no resize param (e.g. `_6d703c7f7e.jpg`), displayed max 560×320 rounded-3xl

## First-party static images (www.waytoagi.com/images/)

- `/images/logo.svg` — logo (downloaded)
- `/images/events-pinned-bg.png` — events hero carousel full-bleed illustrated background
- `/images/contact.png` — 94×125 mascot "联系我们" sticker (fixed bottom-right, links to Feishu wiki)
- `/images/weixin.png` — WeChat official-account QR in footer (rendered w-28)

## Icons

- No icon font / icon library detected; all icons are inline SVGs (16px arrows, clock, flame/sort, location pin), mostly `fill="currentColor"` — except some hardcoded `fill="#674DFF"` (brand purple baked into SVG markup on "了解更多" arrows and card corner buttons)

## Downloadable / reusable brand assets

- Only the logo SVG is cleanly reusable (vector, self-contained)
- Everything else is raster PNG/JPG from the CDN; no brand kit, webfonts (system stack only), or design-token files are exposed

## External brand touchpoints (from footer/header links)

- Feishu knowledge base: `waytoagi.feishu.cn/wiki/...` (canonical content home, linked from announcement ribbon and CTAs)
- Social: Bilibili `space.bilibili.com/259768893`, Xiaohongshu, Twitter `@WaytoAGI`
- Sister sites: `articles.waytoagi.com` (开源知识库), `learnopenclaw.waytoagi.com` (养虾白皮书)
