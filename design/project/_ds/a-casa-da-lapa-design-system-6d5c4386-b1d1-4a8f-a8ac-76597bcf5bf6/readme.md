# Casa da Lapa — Design System

A complete brand & UI system for **Casa da Lapa**, a restored volcanic-stone country house in **Serreta, Terceira Island, Azores**. The system blends Scandinavian minimalism, Azorean heritage and boutique eco-tourism hospitality — architectural, calm, nature-first.

> **Title:** Casa da Lapa
> **Subtitle:** Traditional Azorean Country House in Serreta, Terceira
> **Tagline:** Relax between forest and sea.

---

## Source materials

Everything here was derived from materials provided by the studio (stored in `uploads/`, kept for reference — do not assume the reader can open them):

- `uploads/Manual de normas _ Casa da Lapa.pdf` — the official brand manual (logo construction, the volcanic-stone-façade concept, Neutraface typography spec, colour direction).
- `uploads/Sobre a Casa da Lapa.docx` — property history & "about" copy.
- `uploads/CASA da lapa_pricipal_cor.jpg` — primary logo (mark + lettering), the source for the sampled brand colours.
- Property photography: `Exterior Frente 04`, `Sala 01/05`, `Quarto Piso 0/1`, `Quarto de Banho 01`, plus three rendered interiors/exteriors.
- **Brand fonts** (provided): the licensed **Neutraface Text** OTF family (Light / Book / Demi / Bold + italics), now self-hosted in `fonts/`.

The property: two independent units (two beds each), rebuilt over a primitive rural house, keeping the original architectural lines of traditional Serreta building — dry volcanic stone, deep-set asymmetric windows, a courtyard and the original wood-fired bread oven.

---

## How this project is wired

- **`styles.css`** (root) is the single entry point consumers link. It only `@import`s the token files.
- **`tokens/`** — `fonts.css` (self-hosted Neutraface @font-face), `colors.css`, `typography.css`, `spacing.css`, `base.css`.
- **`components/<group>/`** — React primitives (`<Name>.jsx` + `.d.ts` + `.prompt.md`), one `*.card.html` thumbnail per group.
- **`ui_kits/website/`** — a high-fidelity, click-through recreation of the marketing site.
- **`guidelines/`** — foundation specimen cards shown in the Design System tab.
- **`assets/`** — logo lockups, the mark (transparent PNG), and property photography.

The compiler bundles components into `window.ACasaDaLapaDesignSystem_6d5c43`. In card/kit HTML, link `styles.css`, `<script src=".../_ds_bundle.js">`, then `const { Button } = window.ACasaDaLapaDesignSystem_6d5c43`.

---

## CONTENT FUNDAMENTALS — how Casa da Lapa writes

**Voice:** calm, welcoming, authentic, nature-first. Premium *without* sounding luxurious, exclusive or salesy. Quietly confident; never hyped.

- **Person:** speaks to *you* warmly, and uses *we* for the hosts ("we'll send the code the day before"). Inclusive, never corporate.
- **Casing:** sentence case for almost everything. The brand name and short labels use the architectural **lettering treatment** — UPPERCASE with wide letter-spacing (`CASA DA LAPA`, `EXPERIENCE PILLARS`). Headlines are sentence case with a full stop ("Relax between forest and sea.").
- **Length:** short, unhurried sentences. Lots of breathing room. Concrete, sensory nouns over adjectives — *stone, oven, forest, Atlantic, sunset, courtyard* — rather than "stunning", "luxurious", "world-class".
- **Punctuation:** the em-dash and the period are the workhorses. Headlines often end in a calm full stop. Bilingual touches are natural (PT · EN; Açores).
- **Numbers & facts:** precise and useful — distances ("6.8 km"), times ("check-in from 15:00"), coordinates ("38.7621° N"). Set in the mono face. No fake stats, no urgency ("only 2 left!").
- **Emoji:** none. Ever.

**We say** → "Relax between forest and sea." · "Two quiet units in a restored stone house." · "Wake to the Atlantic through deep-set windows."
**We avoid** → "Luxury escape for the elite few." · "Unrivalled five-star opulence!!!" · "Book now — limited offer 🔥"

**The five experience pillars** (use as content scaffolding): 1) Nature & Hiking · 2) Authentic Azorean Heritage · 3) Peace & Privacy · 4) Ocean Views & Sunsets · 5) Slow Island Living.

---

## VISUAL FOUNDATIONS

**Concept.** The identity abstracts the **dry volcanic-stone façade** into a regular contemporary grid; two terracotta-outlined squares mark the house's signature **asymmetric windows**. Everything else follows from stone, soil, forest, sea and warm island light.

**Colour.**
- *Primary:* **Volcanic Stone Grey `#78858C`** (the slate neutral — text, surfaces, structure) and **Terracotta `#D9705E`** (the single accent — CTAs, links, eyebrows; the dry-red soil of the courtyard). Both sampled from the logo.
- *Canvas:* warm off-white **Paper `#F4F0E9`** with a **Sand `#EAE4D8`** alternate for banding sections. Surfaces lift to near-white/white.
- *Secondary (used sparingly, mostly from photography):* Forest `#3B4D3A`, Ocean `#3A5A6B`, Basalt `#1A1917` (warm near-black for dark sections/footer). *Sunset `#E07B3C`* is a rare warmth accent only.
- Author against semantic aliases (`--text-strong`, `--color-brand`, `--surface…`), not raw scales. Terracotta is precious — one accent per view, not everywhere.

**Type.** One geometric voice: **Neutraface Text** (self-hosted; Light 300 / Book 400 / Demi 500–600 / Bold 700). Display & headings are **Light**, with tight leading (1.02–1.2) and slightly negative tracking for an architectural feel. Eyebrows/labels are **Demi**, UPPERCASE, tracked `0.12–0.22em`. Body is Book, generous leading (1.5–1.7), `66ch` measure. Numbers/coordinates/trail stats use **Spline Sans Mono**.

**Layout & space.** Generous whitespace is the luxury. 4px spacing base; section rhythm is large (96–128px). Editorial asymmetry — offset image pairs, mosaic galleries, sticky booking sidebar. Containers cap ~1240px.

**Imagery.** The hero medium. Large, immersive, full-bleed photography of **stone textures, ocean, forest trails, natural pools, sunsets and warm interiors** with minimal staging and warm natural light. Tone is warm and natural (not cool, not B&W, no heavy grain). Treatments: object-fit cover; gentle `scale(1.04)` zoom on hover over `--dur-image` (720ms); bottom **scrim gradients** (`--scrim-bottom/-full`) for legible overlaid text rather than solid bars.

**Shape & depth.** Stone is square — radii are restrained (`sm 4` / `md 8` on controls; `lg 14` / `xl 22` on image cards). Borders are 1–1.5px hairlines (`rgba(35,43,48,0.10–0.16)`). Shadows are **soft, warm, low-contrast** (`--shadow-sm/md/lg`); images get a deeper `--shadow-image`. No harsh drop shadows, no glows.

**Motion.** Calm and slow — fades and gentle lifts, **never bounce**. Easing `--ease-out` (240ms) for UI, `--ease-in-out` for larger moves, 720ms for image zooms. Honours `prefers-reduced-motion`.

**States.** Hover: terracotta darkens one step (`--color-brand-hover`), outline buttons invert to stone-900, cards lift 3px + image zooms. Press: 1px downward nudge (no scale-down on buttons). Focus: 2px terracotta ring, 2px offset (plus a soft `--terra-50` halo on fields).

**Transparency & blur.** Used purposefully: a translucent **paper nav** (`rgba(244,240,233,0.92)` + 12px blur) once scrolled; **glass** controls over photography (`rgba(255,255,255,0.16)` + blur). Otherwise surfaces are opaque.

---

## ICONOGRAPHY

- **Library:** [**Lucide**](https://lucide.dev) — its thin (1.5–2px), rounded, geometric stroke matches Neutraface and the architectural feel. Loaded from CDN (`unpkg.com/lucide`). No proprietary icon font shipped with the brand, so Lucide is the system default. *Substitution flagged: Lucide stands in for any bespoke icon set; swap for a licensed set if the studio has one.*
- **Usage:** quiet, functional, never decorative clutter. Default stroke colour `--stone-500`; terracotta only when an icon is itself the accent (e.g. a Highlight tile). Sizes 14–22px inline, ~22px in tinted highlight tiles.
- **Glyphs in play:** `trees, waves, flame, moon` (pillars); `wifi, utensils-crossed, car, wind, dog, key, shield-check` (amenities); `chevron-left/right, arrow-right, heart, share, menu` (UI).
- **Stars** (ratings) are drawn inline as a single filled SVG path in terracotta — the one bespoke glyph.
- **Emoji / unicode icons:** never used.
- **Brand assets:** `assets/logo/casa-da-lapa-primary.jpg` (full lockup), `assets/logo/casa-da-lapa-mark.png` (transparent mark — invert to white on dark via `filter: brightness(0) invert(1)`).

---

## INDEX

**Foundations & tokens**
- `styles.css` — entry point (`@import`s only)
- `tokens/colors.css` · `typography.css` · `spacing.css` · `fonts.css` · `base.css`

**Components** (`window.ACasaDaLapaDesignSystem_6d5c43`)
- `components/buttons/` — **Button**, **IconButton**
- `components/forms/` — **Input**, **Select**, **Checkbox**
- `components/feedback/` — **Badge**, **Tag**, **Rating**
- `components/cards/` — **PropertyCard**, **ExperienceCard**, **TrailCard**
- `components/content/` — **Testimonial**, **Highlight**, **FaqItem**
- `components/booking/` — **BookingWidget**

**UI kits**
- `ui_kits/website/` — marketing site (Home · The House · Experiences) with shared `Chrome.jsx` (nav + footer)

**Specimen cards** (Design System tab) — `guidelines/*.html`: colours, type, spacing, radius, shadow, motion, logo, photography, voice.

**Assets** — `assets/logo/`, `assets/photography/`, `fonts/`.

**Skill** — `SKILL.md` (Agent-Skill compatible).

---

## Caveats

- **Neutraface Text** is the *Text* optical size; the manual may also reference *Display* cuts for very large headlines — only Text was provided, so it's used throughout.
- Photography is the studio's own set plus a few AI-rendered interiors; replace the rendered ones (`*-entrance.png`, `*-shower.png`, `bedroom-orange.png`) with real shots when available. Three originals had a phone watermark cropped off the bottom edge.
- Icons use Lucide as a documented stand-in (no proprietary set was provided).
