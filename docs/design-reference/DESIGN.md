# Design System: WaytoAGI (waytoagi.com)

> Reference document produced with the `website-to-design-md` skill (github.com/Paidax01/web-to-design-md), evidence extracted live via `agent-browser eval` on 2026-07-07 from:
> - https://www.waytoagi.com/zh (homepage)
> - https://www.waytoagi.com/zh/events (events listing)
>
> All values marked **[observed]** come from computed styles / stylesheet rules read in the running page. Values marked **[inferred]** are judgments. This is a *reference* for a redesign — the redesign will deliberately NOT reuse the purple palette, so treat colors as "what the original does", not "what we must do".

---

## 1. Visual Theme & Atmosphere

A bright, white-canvas, community-tech aesthetic. The site reads as a friendly Chinese AI knowledge hub, not a slick SaaS product: huge black display type for section titles, playful rainbow logo, emoji-prefixed filter tags, and dense card grids of real content. Chrome is minimal — almost no borders, no heavy nav bar, no dark hero. Color is applied surgically: one brand purple (#674DFF) for links/active states, one loud multi-color gradient for the announcement ribbon, and blue-violet text gradients inside headlines. Everything else is white, near-white gray, and black text.

- Overall feeling: light, energetic, utilitarian, community-driven; "content first, chrome last"
- Visual density: medium-high — 4-column card grids, tight 16px gaps, compact pills and badges
- Brand posture: approachable and slightly playful (emoji tags, rainbow-circles logo, mascot contact sticker fixed bottom-right)
- Signature motifs: giant `font-black` headlines with a blue→violet gradient span on the key word; rounded-2xl white/zinc cards floating on white or slate backgrounds; the tri-color announcement gradient bar at the very top of every page

### Key Characteristics

- Flat design, shadow only appears on hover (shadow-as-affordance, not shadow-as-depth) **[observed]**
- One accent color does all interactive work: brand purple `#674DFF` = links, active nav, icons, hover fills **[observed]**
- Section headers are typographic events: up to 80px, weight 900, centered, with gradient-clipped keyword **[observed]**
- No webfonts — pure system CJK/Latin stack, so text renders instantly and looks "native" **[observed]**
- Built with Next.js + Tailwind CSS + Flowbite components (carousel, pagination, footer are recognizably Flowbite) **[observed from class names / data-testid]**

## 2. Color Palette & Roles

| Role | Semantic Name | Value | Usage |
| --- | --- | --- | --- |
| Brand / Primary interactive | Brand Purple | `#674DFF` (rgb 103,77,255) | Links, active nav item, "了解更多" arrows, inline icons, hover fill of black CTA, focus borders. Defined as Tailwind custom color `primary-color` **[observed]** |
| Primary CTA surface | Ink Black | `#000000` | Solid CTA buttons ("查看活动详情"), headline text **[observed]** |
| Page background | White | `#FFFFFF` | Default page canvas **[observed]** |
| Alt section background | Slate Wash | `#F8FAFC` (Tailwind `slate-50`) | Alternating full-bleed content band on homepage **[observed]** |
| Card surface | Zinc Ghost | `#FAFAFA` (Tailwind `zinc-50`) | Event/site cards on white background **[observed]** |
| Body text | Black | `#000000` | Titles and primary copy (body default is pure black, not gray-900) **[observed]** |
| Secondary text | Gray 500 | `#6B7280` | Card descriptions, dates, footer links **[observed]** |
| Muted text | Gray 400 | `#9CA3AF` | Meta icons + labels (location "线上") **[observed]** |
| Hero subtitle | Ghost Blue-Gray | `#C7CBD8` | The English subtitle "Empowering with AI" under the hero headline **[observed]** |
| Hairline border | Gray 200 | `#E5E7EB` | Filter-pill borders (Tailwind default `border`) **[observed]** |
| Image hairline | Off-white line | `#F0F0F0` | 1px border around card cover images **[observed]** |
| Status badge | Amber | `#FBBF24` (Tailwind `amber-400`) | "进行中" (ongoing) badge on event cards, white text **[observed]** |
| Tag chip bg | Lavender Tint | `#F4F2FF` | Category chip inside cards **[observed]** |
| Tag chip text | Deep Indigo | `#2D14B8` | Category chip text **[observed]** |
| Tag chip border token | Lavender Line | `#D8D1FF` | Declared as border-color on chips but border-width is 0 — the chip renders borderless in practice **[observed quirk]** |

### Primary

- `#674DFF` brand purple — the only saturated UI color; used exclusively for interactive/emphasis roles, never as a large surface **[observed]**
- Black `#000` — primary button surface and display type; black behaves as a "second brand color"

### Interactive

- Links & active nav: `text-primary-color` (`#674DFF`); nav items are black by default and turn purple on hover (`md:hover:text-primary-color`) and stay purple when active (`md:text-primary-color`) **[observed]**
- Black CTA hover: `hover:bg-primary-color hover:shadow duration-300` — black fills to purple with a soft shadow over 300ms **[observed]**
- Focus: `focus:border-primary-color` on inputs **[observed in stylesheet]**
- Pagination (Flowbite default, off-brand): active page is `text-blue-600 bg-blue-50`, hover `bg-gray-100` — plain Tailwind blue, NOT the brand purple **[observed]**

### Gradients (signature)

- Announcement ribbon: `linear-gradient(to right, rgb(198,107,255) 0%, rgb(245,236,254) 40%, rgb(255,235,59) 100%)` — purple → pale lilac → yellow, 48px tall, black semibold text **[observed]**
- Headline keyword gradient (`.textGradient` and hero `强大` span): `linear-gradient(123.19deg, rgb(25,0,168) 0%, rgb(116,41,255) 99.96%)` with `background-clip: text; color: transparent` **[observed]**
- Featured-tools band: `linear-gradient(360deg, #F2F1F8, #FFFFFF)` (vertical fade); its tab rail uses `linear-gradient(102.97deg, #EBEDF5, #F5F6FA)` **[observed]**

### Neutral Scale

- `#FFFFFF` page → `#FAFAFA` card (zinc-50) → `#F8FAFC` band (slate-50) → `#F3F4F6` (gray-100 control track / hamburger bg) → `#E5E7EB` (gray-200 hairline) → `#9CA3AF` (gray-400 meta) → `#6B7280` (gray-500 secondary text) → `#000` (primary text)
- The neutrals are so close in value that hierarchy comes from radius and spacing, not contrast **[inferred]**

### Surface & Overlay

- Cards sit directly on white or slate with no border and no resting shadow; the card IS the `#FAFAFA` tint **[observed]**
- Carousel slide indicators: `bg-white/50`, hover/active `bg-white` — translucent white overlay dots on the hero image band **[observed]**

### Theme Modes

The DOM carries Flowbite `dark:` variant classes (footer `dark:bg-gray-900`, pagination `dark:bg-gray-800`, etc.), but `<html>` never receives a `.dark` class and no functional theme toggle was found. **Dark mode is vestigial library code, not a supported mode.** Document light mode only. **[observed]**

#### Light Mode (the only active mode)

- Background: `#FFFFFF`, alt band `#F8FAFC`
- Surface: `#FAFAFA` cards, `#FFFFFF` tool cards on tinted band
- Text: `#000` primary / `#6B7280` secondary
- Accent: `#674DFF`
- Notes: `:root` defines only `--foreground-rgb: 0,0,0`, `--background-start-rgb: 214,219,220`, `--background-end-rgb: 255,255,255` (Next.js starter leftovers; body background is actually transparent/white) **[observed]**

### Shadows & Depth

- Resting state: everything flat (`box-shadow: none`) **[observed]**
- Hover on cards: Tailwind `shadow-md` = `0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)` **[observed]**
- Hover on homepage tool cards: `shadow-xl` = `0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)` **[observed]**
- Active tab (featured tools): custom colored shadow `0 2px 4px 0 rgb(199,195,219)` on white pill **[observed]**
- Active sort segment: white pill with Tailwind `shadow` on a `gray-100` track (segmented-control pattern) **[observed]**

## 3. Typography Rules

### Font Family

- Primary: `"Helvetica Neue", Helvetica, Arial, "PingFang SC", "Hiragino Sans GB", "Heiti SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif` — a classic Chinese-web system stack, no webfont download **[observed]**
- Monospace: none observed
- Base: 16px / 24px line-height, weight 400, pure black

### Hierarchy

| Role | Size | Weight | Line Height | Notes |
| --- | --- | --- | --- | --- |
| Hero display | 36px → 48px (md) → 64px (lg) → 80px (xl) | 900 (`font-black`) | `1em` (set inline) | "因 AI 而强大", keyword wrapped in gradient span **[observed]** |
| Hero subtitle | 20px → 27px → 36px → 46px | 900 (inherits) | 1em | English echo line in `#C7CBD8` **[observed]** |
| Section heading | 36px → 64px (lg) | 900 | default | Centered, gradient keyword: "知识库内容精选" **[observed]** |
| Section subline | 18px (`text-lg`) | 400 | 28px | Centered, plain black, 40px below heading **[observed]** |
| Carousel slide title | 36px (`text-4xl`) | 400 | 40px | Notably *regular weight* at display size **[observed]** |
| Card title | 18px (`text-lg`) | 400 (events) / 700 (homepage sites use `font-bold`) | 28px | **[observed]** |
| Body / card description | 16px (`text-base`) | 400 | 24px | `text-gray-500`, `line-clamp-2` **[observed]** |
| Meta / date | 14px (`text-sm`) | 400 | 20px | `text-gray-500` **[observed]** |
| Chip / badge | 12px (`text-xs`) | 400 | 16px | **[observed]** |
| Nav links | 16px (`text-base`) | 400 | 24px | **[observed]** |
| Announcement bar | 16px | 600 (`font-semibold`) | — | **[observed]** |

### Principles

- Contrast comes from *scale and weight extremes*: 900-weight 64–80px display vs 400-weight everything else; almost nothing in between **[observed]**
- Letter-spacing is never adjusted (`normal` everywhere) — CJK-first typography **[observed]**
- Bilingual pattern: Chinese headline + lighter gray English echo underneath **[observed]**
- Long text is always clamped (`line-clamp-2`) inside fixed-height cards rather than allowed to reflow heights **[observed]**

## 4. Component Stylings

### Buttons and Links

- Primary CTA: solid black, white text, `px-8 py-2` (8px/32px), `rounded-md` (6px), inline-flex with a 16px arrow icon, `gap-2`. Hover: fills brand purple + soft shadow, `duration-300` **[observed]**
- Secondary action (sort segmented control): `bg-gray-100` track (h-32px, `rounded` 4px), active segment = white pill + `shadow` + purple text + purple icon **[observed]**
- Text links: purple `#674DFF` with trailing 16px arrow SVG and `gap-2` ("了解更多 →") **[observed]**
- Hover and active feel: 300ms all-property ease; color-fill + shadow rather than movement/scale **[observed]**

### Cards and Containers

The event/site card is the workhorse component:

- Surface: `bg-zinc-50` (#FAFAFA), no border, no resting shadow **[observed]**
- Geometry: fixed `h-[342px]`, `max-w-80` (320px; actual grid track 302px), `rounded-2xl` (16px), `overflow-hidden` **[observed]**
- Cover image: `h-44` (176px), full-width, `object-cover`, `rounded-t-2xl`, 1px `#F0F0F0` hairline **[observed]**
- Body padding: `px-5` (20px) horizontal rhythm throughout **[observed]**
- Structure top→bottom: cover image (status badge overlaid at `top-[142px] right-[8px]`) → 14px gray date → 18px title in fixed `h-20` block → footer row (`flex justify-between`): category chips left, location meta right **[observed]**
- Homepage variant adds a 40px `rounded-xl` app icon overlapping the cover by −20px (`relative top-[-20px]`) **[observed]**
- Knowledge-pick card (homepage): horizontal split card, `h-44`, image left half, `rounded-2xl bg-white hover:shadow-md` **[observed]**
- Tool card (homepage band): `bg-white rounded-2xl p-5 h-30 hover:shadow-xl` **[observed]**
- Hover: all cards lift with `shadow-md` (tools: `shadow-xl`), nothing else changes **[observed]**

### Chips, Pills & Badges

- Filter tag pill (events page): `px-2 py-1 border rounded-md text-sm` — 1px `#E5E7EB` border, transparent bg, black text, emoji prefix ("⚙️ 应用"). Rounded-md (6px), NOT fully round **[observed]**
- Category chip (inside card): `py-1 px-2 text-xs rounded-md bg-[#F4F2FF] text-[#2D14B8]`; a `border-[#D8D1FF]` class is present but no border width, so it renders borderless **[observed]**
- Status badge: `h-6 px-3 rounded-md text-xs text-white bg-amber-400` ("进行中"), absolutely positioned bottom-right of the cover image **[observed]**
- Featured-tools tab: 18px text, `padding 13px 24px`, active = white bg + `border-radius 12px` + colored shadow `0 2px 4px rgb(199,195,219)` **[observed]**

### Inputs and Interactive Controls

- Focus behavior: `focus:border-primary-color` (purple border) per stylesheet **[observed rule; no visible form on these two pages]**
- Selection states: segmented control uses white-pill-on-gray-track (see Buttons)

### Navigation

- Structure: single-row header, `max-w-[1280px] mx-auto`, inner `py-2.5 px-3 flex justify-between items-center`, total height 76px **[observed]**
- Logo: inline SVG, `h-14` (56px), rainbow concentric circles + black wordmark **[observed]**
- Background: fully transparent, no border, no shadow, NOT sticky (`position: static`) **[observed]**
- Link style: 16px black, `gap-1`; hover → purple; current page → purple (color is the only active indicator — no underline/pill) **[observed]**
- Mobile: links collapse behind a hamburger button styled `rounded-full bg-gray-100 p-2 text-gray-500` **[observed]**
- Announcement ribbon sits ABOVE the header: 48px tall link, tri-color gradient, black semibold centered text "直达「 通往AGI之路 」飞书知识库 →" **[observed]**

### Image Treatment

- Content images: `object-cover` into fixed-height slots, top-rounded to match the card radius, 1px `#F0F0F0` hairline to separate white-ish screenshots from the card **[observed]**
- Hero carousel image: `max-w-[560px] max-h-[320px] rounded-3xl` (24px) floating on an illustrated background (`/images/events-pinned-bg.png`, full-bleed cover) **[observed]**
- Homepage hero tiles: pure image links, `aspect-[4/3] rounded-2xl overflow-hidden hover:shadow-md duration-300`, background-image cover **[observed]**
- CDN: all content images from `assets.waytoagi.com` with `?image_process=resize,w_600` URL params **[observed]**

### Distinctive Components

- **Hero carousel (events page)**: Flowbite carousel (`data-testid="carousel"`), full-bleed band `h-80 sm:h-96 xl:h-[500px] 2xl:h-[600px]` over an illustrated bg image. Each slide: two-column layout inside `max-w-screen-xl` — left: date, 36px title, subtitle, black CTA; right: rounded-3xl poster image. 12px round indicator dots (`bg-white/50`, active white) + prev/next arrow buttons. Auto-advances (~3s interval, time-driven; observed active index changing without interaction) **[observed]**
- **Announcement gradient ribbon**: see Navigation
- **Gradient-keyword section headers**: `font-black` centered display line where only the keyword span gets `.textGradient` **[observed]**
- **Fixed mascot contact button**: `fixed bottom-16 right-8`, a 94×125px PNG sticker linking to Feishu, desktop only (`hidden lg:block`) **[observed]**
- **Pagination**: Flowbite default — `inline-flex gap-2 h-10` rounded-lg items, active = blue-50 bg + blue-600 text (off-brand blue) **[observed]**

## 5. Layout Principles

### Spacing System

- Base unit: Tailwind 4px scale
- Repeated values: 12px page gutters (`px-3`), 16px grid gaps (`gap-4`), 20px card padding (`px-5`/`p-5`), 24px tool-band gaps (`gap-6`), 48px section title→content (`mt-12`), 40px heading→subline (`mt-10`), 80px between sections (`mt-20`/`my-20`), 160px (`lg:py-[160px]`, `lg:my-[160px]`) between major homepage bands on desktop **[observed]**

### Grid & Container

- Grid logic: content cards use `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`; knowledge picks use 1→2 cols; homepage hero tiles use a desktop-only `grid-cols-4 gap-6` **[observed]**
- Max content width: two containers coexist — header/hero use `max-w-[1280px]`, content sections use `max-w-screen-xl` (1280px); effectively one 1280px system with 12px gutters **[observed]**
- Section spacing: generous vertical bands (80–160px) with alternating white / slate-50 backgrounds to delimit sections without borders **[observed]**

### Whitespace Philosophy

- Compact inside components, generous between sections: 16px card gaps vs 160px band spacing **[observed]**
- Alignment: homepage hero is left-aligned on desktop / centered on mobile; all section headers centered; card grids left-flowing **[observed]**
- Fixed-height cards (`h-[342px]`, `h-44`, `h-20` title block) keep grid rows perfectly even regardless of content length **[observed]**

### Border Radius Scale

- Micro: 4px (`rounded` — segmented control track)
- Standard: 6px (`rounded-md` — buttons, chips, badges, filter pills)
- Medium: 12px (`rounded-xl` — app icons, active tool tab)
- Large: 16px (`rounded-2xl` — ALL cards; the signature radius)
- XL: 24px (`rounded-3xl` — carousel poster image)
- Pill: 9999px (`rounded-full` — carousel dots, mobile hamburger)
**[all observed]**

## 6. Depth & Elevation

| Level | Treatment | Use |
| --- | --- | --- |
| Flat | no border, no shadow; tint difference only (#FAFAFA on #FFF) | All resting cards, header, sections |
| Hairline | 1px #E5E7EB or #F0F0F0 | Filter pills, image edges |
| Hover card | `0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1)` (shadow-md) | Event/knowledge cards, hero tiles |
| Hover pop | `0 20px 25px -5px rgba(0,0,0,.1), 0 8px 10px -6px rgba(0,0,0,.1)` (shadow-xl) | Tool cards |
| Active control | white pill + small shadow (`shadow` / custom `0 2px 4px #C7C3DB`) | Segmented control, tool tabs |
| Focus | purple border `#674DFF` | Inputs |

### Depth Principles

- Surface hierarchy is tint-based, not shadow-based; shadows exist only as hover/active feedback **[observed]**
- No glassmorphism, no blur, no overlays except the 50%-white carousel dots **[observed]**
- Transitions: `duration-300`, transition-all, no easing customization **[observed]**

## 7. Do's and Don'ts

### Do

- Reserve the accent color strictly for interactive/emphasis elements; keep surfaces neutral
- Use one card radius (16px) everywhere; round images with the card, not independently
- Keep cards fixed-height with clamped text so grids stay even
- Signal hover with shadow + 300ms color fill; keep resting state flat
- Alternate white and near-white full-bleed bands to separate sections without rules/borders
- Pair Chinese display headlines with a muted English echo line

### Don't

- Don't add resting shadows or visible card borders — flatness is the identity
- Don't use multiple saturated colors in the UI chrome (the gradient ribbon is the single licensed exception)
- Don't use mid-weight type; the system is 900-or-400
- Don't letterspace CJK text
- Don't ship the off-brand Flowbite blue pagination in a redesign — align pagination with the accent color (original site's inconsistency, flagged) **[observed inconsistency]**

## 8. Responsive Behavior

### Breakpoints

Tailwind defaults **[observed via classes]**:

| Name | Width | Key Changes |
| --- | --- | --- |
| Mobile (<768) | base | 1-col cards (observed 351px track at 375px viewport), nav collapses to rounded-full hamburger, hero text centers, hero 36px, mobile-specific tools widget, carousel `h-80` |
| md 768 | ≥768 | 2-col cards, hero left-aligns at 48px, desktop tools band appears |
| lg 1024 | ≥1024 | 3-col cards, hero 64px, section headers 64px, homepage image-tile grid appears (`hidden lg:grid`), mascot button appears, 160px band spacing |
| xl 1280 | ≥1280 | 4-col cards, hero 80px, carousel 500px |
| 2xl 1536 | ≥1536 | carousel 600px |

### Touch Targets

- Buttons ≥40px tall (CTA py-2 + text = 40px; pagination h-10) **[observed]**
- Small chips (24px) are non-interactive labels; interactive filter pills are ~28px — slightly under ideal touch size **[observed]**

### Collapsing Strategy

- Desktop: 4-col grid, inline nav, side-by-side carousel slide (text left / image right)
- Tablet: 2–3 col, carousel keeps split layout
- Mobile: single column, carousel stacks text over image (`flex-col md:flex-row`), homepage swaps entire tool-section component (`Mobile_wrap` vs `styles_wrap`) rather than reflowing one component **[observed]**

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA: black `#000` → hover `#674DFF`
- Accent / links: `#674DFF`
- Background: `#FFFFFF`, alt band `#F8FAFC`, card `#FAFAFA`
- Heading text: `#000`; secondary `#6B7280`; muted `#9CA3AF`
- Border/hairline: `#E5E7EB` / `#F0F0F0`
- Status: amber `#FBBF24`; chip `#F4F2FF` bg + `#2D14B8` text
- Signature gradients: headline `123deg #1900A8→#7429FF` (text-clip); ribbon `to-r #C66BFF→#F5ECFE 40%→#FFEB3B`

### Quick Summary

White-canvas Chinese AI community hub built on Tailwind+Flowbite. System font stack, 900-weight display headlines (up to 80px) with a blue-violet gradient keyword, everything else regular 400. One brand purple (#674DFF) handles all interactivity; surfaces are flat #FAFAFA rounded-2xl cards in 4/3/2/1-column grids with 16px gaps that gain shadow-md only on hover. Sections are separated by 80–160px vertical rhythm and alternating white/slate-50 bands, not borders. Playful touches: emoji filter pills, rainbow logo, tri-color gradient announcement ribbon, mascot sticker button.

### Example Component Prompts

- Hero (events): "Full-bleed band 320–600px tall over an illustrated background image; inside a 1280px container, split slide: left column with small date line, 36px regular-weight title, subtitle, and a black rounded-md CTA (px-8 py-2, white text, arrow icon, hover fills accent color with soft shadow over 300ms); right column a 560×320 rounded-3xl poster image. Auto-advancing carousel (~3s) with 12px white/50 dot indicators."
- Card: "342px-tall rounded-2xl card, bg #FAFAFA, no border/shadow; 176px object-cover top image with 1px #F0F0F0 hairline and an amber status badge overlaid bottom-right; 20px horizontal padding; 14px gray date, 18px title clamped in a fixed 80px block; footer row with tinted 12px category chips left and gray location meta right; hover: shadow-md."
- Navigation: "Transparent 76px non-sticky header in a 1280px container: 56px logo left, 16px black links right with 24px gaps; hover and active state = accent color text only. Above it a 48px gradient announcement ribbon with centered black semibold link text."
- Section header: "Centered font-black 64px headline where the keyword span uses a 123° blue→violet gradient with background-clip:text; 18px plain subline 40px below; content grid 48px below."

### Ready-to-Use Prompt

"Build a light, flat, content-dense page in the WaytoAGI language: white background, system CJK font stack, black 900-weight display headlines with a gradient-clipped keyword, one accent color reserved for links/hover/active, flat #FAFAFA rounded-2xl fixed-height cards in a responsive 1/2/3/4-column 16px-gap grid inside a 1280px container, shadow only on hover (300ms), 80–160px section rhythm with alternating white and slate-50 bands, black rounded-md CTAs that fill with the accent color on hover."

### Iteration Guide

1. Change the accent: swap `#674DFF` in exactly four roles (links/active nav, CTA hover fill, focus border, chip tint pair) — nothing else in the chrome carries color.
2. Keep radius religion: cards 16px, controls 6px; do not introduce new radii.
3. Preserve the flat→shadow-on-hover contract before adding any new elevation.
4. If keeping gradient headlines, regenerate both gradient stops from the new accent hue; the ribbon gradient can be retired independently.
5. Fix the original's inconsistencies in a redesign: pagination color (Flowbite blue) and chip border (declared but zero-width).

## Appendix: Interaction Patterns

- Scroll: no sticky header, no scroll animations, no reveal-on-scroll observed; the page is static except the carousel **[observed]**
- Hover: color-fill + shadow, 300ms, transition-all; card lift is shadow-only (no translate/scale) **[observed]**
- Click: standard navigation; filter pills and sort are full page-navigations via query params (`?tag=`, `?sort=newest`, `?page=`) — server-rendered filtering, no client state **[observed]**
- Carousel: time-driven auto-advance (~3s; active index advanced 2 slides in 6s unattended), snap-scroll based, with manual dots + arrows **[observed]**
- Animation tone: restrained; motion exists only as hover transitions and carousel sliding

## Appendix: Content & Messaging Patterns

- Headline pattern: short imperative/benefit Chinese phrases with one highlighted keyword ("因 AI 而**强大**", "**知识库**内容精选", "最新**AI产品和工具**") + English echo or explanatory subline ("探索日新月异的 AI 世界，每日都有新启发")
- CTA language: direct and functional — "查看活动详情", "了解更多", "直达…知识库 →"
- Trust signals: footer friend-links to major Chinese AI products (飞书, Kimi, 通义千问, 可灵…), WeChat QR, Feishu wiki as canonical knowledge base
- Voice: enthusiastic community-educator; dates and concrete facts everywhere; emoji as taxonomy, not decoration

## Appendix: Observed Pages

- https://www.waytoagi.com/zh — hero display type, image-tile grid, featured-tools band (tabs + white tool cards on gradient wash), knowledge-picks split cards on slate-50, sites card grid, footer, mascot button
- https://www.waytoagi.com/zh/events — announcement ribbon, header/nav states, hero carousel, emoji filter pills, sort segmented control, event cards (badge/chip/meta), Flowbite pagination

## Appendix: Evidence Notes

- Extraction method: `agent-browser` (open/wait/scroll/eval) reading computed styles, outerHTML, and CSSOM rules from the live pages at 1280×900 and 375×812 viewports, 2026-07-07.
- Not fabricated / not observed: form inputs (no forms on these pages — focus rule taken from stylesheet), dark mode rendering (never activatable), disabled states (none present).
- Known quirks worth carrying into any rebuild decision: chip border declared but zero-width; pagination uses off-brand Flowbite blue; carousel title is 400-weight while section titles are 900; `:root` CSS variables are unused starter leftovers.
