# Portfolio V3 Design Bible

**Positioning:** Character Concept Artist portfolio for top-tier game studios  
**Format:** Premium digital art book / professional concept-art presentation  
**Visual concept:** Controlled Signal  
**Status:** Design-system specification only. No portfolio pages are defined as finished designs.

---

## 1. Core Visual Concept

### Controlled Signal

Portfolio V3 combines two modes:

1. **Artwork mode:** large, emotional, cinematic, and nearly silent.
2. **Study mode:** analytical, ordered, precise, and easy to inspect.

The tension between those modes creates the portfolio's rhythm. The graphic system should feel assertive at a thumbnail and restrained at full size.

### Intended Impression

- Premium and authored, without appearing self-promotional.
- Graphic and contemporary, without imitating a game interface.
- Editorial, with the pacing and restraint of an official art book.
- Character-focused: identity, silhouette, costume, equipment, and design logic remain central.
- Studio-ready: information is organized for rapid review by Art Directors and Lead Character Concept Artists.

### Reference Principles To Extract

- Strong contrast between large artwork and small information.
- Deliberate use of scale, cropping, alignment, and negative space.
- Typography used as structure, not decoration.
- Repeated grid anchors that make varied pages feel related.
- Sharp rectangular modules, controlled asymmetry, and clear reading order.
- Alternation between cinematic spreads and analytical study pages.

### Reference Elements Not To Copy

- Existing Arknights compositions, logos, symbols, interface panels, or typography lockups.
- Rarity systems, event dates, stars, operator data, fictional codes, or promotional language.
- Marketing-poster density or fake product branding.

---

## 2. Page Size And Format

### Master Canvas

- **Aspect ratio:** 16:9 horizontal.
- **Working size:** 1920 x 1080 px.
- **High-resolution master/export:** 3840 x 2160 px when source resolution permits.
- **Color space:** sRGB for digital review.
- **Primary viewing condition:** full-screen desktop or landscape tablet.

### Format Rules

- Design as individual pages, not simulated two-page book spreads.
- Pages must remain readable at 25% thumbnail scale and sharp at 100% scale.
- Artwork may bleed to any edge when the page type permits.
- Text, labels, and essential design information remain inside the safe area.
- Do not add print crop marks, binding shadows, paper mockups, or book-gutter effects.

---

## 3. Grid System

### Base Grid

- **Columns:** 12.
- **Outer margins:** 96 px left/right; 72 px top/bottom.
- **Gutters:** 24 px.
- **Column width:** 122 px at 1920 px canvas width.
- **Spacing unit:** 8 px.
- **Baseline rhythm:** 8 px; major vertical intervals use 16, 24, 32, 48, 64, or 96 px.

### Safe Area

- Essential text and small details stay within x = 96-1824 and y = 72-1008.
- Hero artwork and intentional image bleed may leave the safe area.
- Important facial features, hands, weapons, and costume information should not sit closer than 24 px to a crop edge unless the crop is intentionally demonstrating that detail.

### Alignment Rules

- Every text block and image module must align to a column edge, gutter edge, or documented optical offset.
- Use no more than three primary vertical alignment lines per page.
- Labels align with the image or subject they identify, never with an unrelated page edge.
- Repeated modules share one baseline and one spacing interval.
- Optical corrections of up to 8 px are allowed for irregular silhouettes, but grid coordinates remain the starting point.
- Avoid centered layouts by default. Centering is reserved for symmetrical turnarounds, isolated character sheets, and intentional hero moments.

### Common Module Widths

- 2 columns: captions, page numbers, small reference images.
- 3 columns: detail crops and supporting studies.
- 4 columns: portrait or costume modules.
- 5-7 columns: primary study image.
- 8-12 columns: hero artwork or full-page composition.

---

## 4. Typography System

### Font Direction

**Primary family:** Inter or a licensed neutral neo-grotesk equivalent.

- Use for titles, captions, resume text, and all functional information.
- Desired qualities: clean construction, excellent small-size legibility, multiple weights, restrained personality.

**Secondary family:** IBM Plex Sans Condensed or a licensed condensed grotesk equivalent.

- Use selectively for section openers, large page numerals, and short graphic statements.
- Never use it for paragraphs or dense resume content.

**CJK fallback:** Noto Sans SC, matched by visual weight to the primary family.

Do not introduce a third display family. Do not use sci-fi, stencil, techno, handwritten, or ornamental fonts.

### Type Hierarchy At 1920 x 1080

| Level | Use | Size | Weight | Tracking |
|---|---|---:|---:|---:|
| Display | Cover or rare section opener | 96-160 px | 500-700 | 0 to +1% |
| H1 | Character or chapter title | 48-72 px | 500-650 | 0 to +2% |
| H2 | Page topic | 24-32 px | 500-600 | +2 to +5% |
| Section label | Design topic or category | 12-15 px | 500-600 | +18 to +28% |
| Caption | Artwork title or view name | 11-13 px | 400-500 | +4 to +10% |
| Metadata | Medium, year, role, status | 9-11 px | 400-500 | +12 to +20% |
| Body | Resume and concise notes only | 15-18 px | 400 | 0 to +2% |

### Typography Rules

- Use sentence case for artwork titles and resume content.
- Use uppercase for short labels, navigation, and section identifiers only.
- A label should normally remain under 28 characters.
- Large typography may become part of the composition only on covers, section openers, or pages with substantial negative space.
- Large type must never overlap a face, hand, weapon mechanism, or essential silhouette.
- Keep a minimum gap of 24 px between small text and artwork; use 48 px when the text is not attached to a specific image.
- Use one dominant text scale and no more than three visible text sizes on a normal page.
- Avoid outlined text, drop shadows, bevels, gradients, distortion, and vertical text longer than one short label.

### Display Typography Constraint

- The condensed secondary family may be used only on covers, section opener pages, and rare hero pages with substantial negative space.
- Use it no more than once per page and for no more than 10 words.
- It must never overlap a face, hand, signature weapon, or key costume silhouette.
- It must never be used as a decorative poster effect.
- It is forbidden on character sheets, turnarounds, technical breakdowns, resume pages, and other information-dense pages.

### Caption And Metadata Style

- Captions state only what helps review the work: title, view, role, medium, or year.
- Use separators consistently: `TITLE / VIEW / YEAR`.
- Metadata must be factual. Never invent production codes, factions, classes, or game statistics.
- If a label does not improve orientation or interpretation, remove it.

### Language Rules

- Use **English** for cover text, page numbers, section labels, short category labels, and concise metadata.
- Use **Chinese** for design explanations, resume content, work experience, project descriptions, and longer notes.
- Do not mix Chinese and English inside one short label unless the label contains a proper name.
- Keep equivalent labels consistent across pages; do not alternate between translated variants.
- Labels must remain concise. Longer explanatory content must use Chinese rather than compressed bilingual phrasing.

---

## 5. Color System

### Core Neutrals

| Role | Color | Use |
|---|---|---|
| Paper | `#F4F3EF` | Primary warm-neutral page field |
| White | `#FFFFFF` | Artwork fields and high-clarity study pages |
| Ink | `#17191C` | Primary titles and essential text |
| Graphite | `#4F5359` | Secondary text and rules |
| Muted | `#8C9096` | Captions and metadata |
| Hairline | `#D2D4D7` | Dividers and alignment marks |

### Accent System

- **Global graphic accent:** Signal Red `#D6263A`.
- Signal Red is locked across every page and may not be replaced by a color sampled from an artwork.
- Artwork-sampled colors may appear only inside a character sheet or palette-swatches section when they factually describe the artwork itself.
- Artwork-sampled colors must never become page furniture, typography accents, navigation, lines, blocks, numbering, or chapter colors.
- One page may use only Signal Red as its graphic accent outside the artwork.
- Accent coverage should normally remain below 5% of the page.
- Use accent for one of the following: a section marker, active line, page numeral, small block, or one keyword.
- Do not use accent merely to fill empty space.

### Color Rules

- Artwork color always has priority over interface color.
- Paper and White may alternate only when the page role changes.
- Do not alternate neutral backgrounds automatically from page to page.
- Across the full 12-page portfolio, use no more than two intentional background-tone shifts, excluding artwork-led full-bleed hero pages.
- Dark pages are exceptional and require artwork that supports them; never use dark pages as the default theme.
- Do not place low-contrast gray text over detailed artwork.
- Do not recolor artwork to force palette consistency.

### Avoid

- Multi-color gradients, neon rainbow accents, and purple-blue gradient branding.
- Beige-dominant luxury styling.
- Multiple competing accent colors.
- Pure black backgrounds behind every artwork.
- Colored panels that distort the perceived palette of the character.

---

## 6. Graphic Language

### Thin Lines

- Standard hairline: 1 px at 1920 x 1080; 2 px at 3840 x 2160.
- Lines must align, separate, measure, or connect real information.
- Maximum two line weights per page.
- Do not box every image or create decorative corner brackets.

### Numbering

- Use one main page-number system only: two digits from `01` through `12`.
- Place the page number at the bottom-right, inside the safe area.
- Set page numbers in the metadata style.
- The cover page does not display a page number.
- A page may contain only one main page number.
- Do not use fake serial numbers, secondary numbering systems, coordinates, decorative numeric clusters, or oversized background numerals.
- Real process sequences or view names must use concise text labels rather than competing numeric systems.

### Geometric Blocks

- Use sharp rectangles and narrow bars; no rounded cards.
- Blocks may anchor labels, create image masks, or establish chapter color.
- Maximum one dominant block and two minor blocks on a page.
- Blocks must align with the 12-column grid.

### Circles And Curves

- Use only when derived from a character motif, weapon geometry, crop callout, or actual design relationship.
- Do not scatter circles as atmosphere.
- Do not use radar charts, targeting reticles, or fake interface rings.

### Small Data-Like Labels

- Permitted information: project type, character name, view, medium, role, year, or process stage.
- Labels must be human-readable and factually useful.
- No fake serial numbers, fictional coordinates, status readouts, rarity, class, faction, or event information.

### Editorial Marks

- Allowed: page number, section identifier, crop index, real project category, short directional line.
- Marks should repeat consistently across the portfolio rather than appearing once.
- Use no more than three graphic mark types across the entire system.

### Background Patterns

- Default: none.
- When justified, derive a pattern from actual character geometry, a costume seam, or a repeated project motif.
- Keep pattern opacity at 2-4% and coverage below one-third of the page.
- Never place a pattern behind detailed line work, facial features, or readable notes.

---

## 7. Image Treatment Rules

### General Rules

- Inspect every source at full resolution before selecting a crop.
- Preserve original color, proportion, and artwork integrity.
- Never stretch, distort, sharpen aggressively, or invent missing content.
- Every crop must have a stated purpose: emotion, identity, silhouette, construction, material, equipment, or process.
- Avoid repeating the same crop at slightly different scales.
- Use hard rectangular crops by default. Use cutouts only when clean source separation exists.
- No drop shadows, mock frames, bevels, or floating cards.

### Artwork Integrity

- Codex may use only existing source assets supplied in the workspace.
- Allowed actions: crop, scale, reposition, mask, arrange, adjust layout, and use existing visible PSD layers when they are clearly available.
- Forbidden actions: generate new artwork, use AI fill or AI outpainting, invent missing costume details, add or remove character parts, or reconstruct hidden areas.
- Do not create fake weapon diagrams, turnarounds, material studies, separated parts, production notes, or design annotations.
- Every visual or written design claim must be visibly supported by the source artwork.
- When the source does not contain sufficient evidence for a requested module, omit the module rather than simulate it.

### Hero Artwork

- Occupy 90-100% of the page's visual field.
- Typography is optional and must remain secondary.
- Preserve the complete character unless an intentional cinematic crop keeps all critical design information readable.
- Allow secondary effects, creature forms, and environment to bleed first.
- The face, hands, signature weapon, and key costume silhouette require priority.

### Full-Page Artwork

- Use one artwork only.
- Crop for a clear focal path, not simply to fill the canvas.
- Do not add borders or inset frames.
- If the source aspect ratio conflicts with the page, choose controlled negative space or crop secondary material. Never distort.

### Character Breakdown

- Use 3-4 analytical views maximum.
- Each view answers a different visibly supported question: face and identity, costume silhouette, weapon silhouette, creature relationship, visible ornament, or visible layering.
- Add a short topic label and, when useful, a keyword line of no more than four terms.
- The full illustration may appear as a small reference but must not dominate.
- If two crops communicate the same design idea, keep only the stronger crop.
- Page 3 may use only real crops from the approved hero artwork.
- Do not present a crop as a weapon schematic, material breakdown, isolated character part, or technical study when the source does not provide that information.
- Do not fabricate clean separation when no clean PSD asset package is available.
- A label may describe only information that is directly visible and verifiable in its crop.
- If a crop does not reveal new information, remove it.

### Character Sheet

- Present front, side, back, and alternate views at consistent scale.
- Align feet to one baseline and heads to a controlled reference line.
- Keep orthographic views free from cinematic cropping.
- Reserve 15-25% of the page for labels, palette, or isolated details.
- Do not mix unrelated characters on one sheet.

### Turnaround

- Use equal visual weight and consistent spacing between views.
- Preserve full silhouette from highest point to lowest accessory.
- Use minimal ground lines only when needed for alignment.
- Do not use perspective views as substitutes for missing orthographic information.

### Detail Close-Up

- Use 2-4 details maximum.
- Show construction, material transitions, fastening, weapon operation, pattern logic, or signature motifs.
- Crop tightly enough to reveal information but include enough context to locate the detail on the character.
- Avoid generic beauty crops that only enlarge rendering quality.

### Supporting Studies

- Group by one topic: silhouette exploration, expression, costume variation, material, color, or pose.
- Use consistent thumbnail scale inside each group.
- Show selection logic when possible: exploration, shortlist, final.
- Supporting studies remain visually quieter than finished character artwork.

### Sketch And Process

- Preserve evidence of decision-making rather than showing every draft.
- Sequence images in actual development order.
- Use concise labels such as `SILHOUETTE`, `VARIATION`, `REFINEMENT`, `FINAL`.
- Do not use arrows or diagrams unless they clarify a real decision.

---

## 8. Page Rhythm

### Recommended 12-Page Architecture

| Page | Function | Density | Rhythm Role |
|---:|---|---|---|
| P01 | Cover | Very low | Identity and restraint |
| P02 | Hero spread | Maximum image / minimal text | Immediate impact |
| P03 | Character breakdown | Medium-high | Shift from emotion to analysis |
| P04 | Character design | Medium | Silhouette and design logic |
| P05 | Character sheet | High | Technical proof |
| P06 | Costume / detail | Medium-high | Material and construction depth |
| P07 | Second character hero | Low text / high image | Visual reset and renewed impact |
| P08 | Bust / portrait study | Medium-low | Identity and expression |
| P09 | Sketch / process | High but ordered | Decision-making evidence |
| P10 | Additional design | Medium | Breadth without dilution |
| P11 | Resume | Medium-low | Professional clarity |
| P12 | Contact | Very low | Confident close |

### Density Curve

- Never place more than two dense analytical pages consecutively.
- Follow a maximal image page with a page that slows the viewer and explains design.
- Use P07 as a visual reset; it should feel like a second chapter, not more of P06.
- Resume and contact pages reduce density and close the portfolio calmly.
- A weaker artwork must not be included merely to complete the page count. The final portfolio may range from 10-14 pages.
- Background tone follows page role, not page parity. Paper and White may shift no more than twice across a 12-page sequence, excluding full-bleed hero pages.

### Reading Flow

1. **Identify:** artist and role.
2. **Impress:** strongest artwork at immediate scale.
3. **Prove:** reveal design language and construction.
4. **Deepen:** show technical sheets, details, and process.
5. **Refresh:** introduce a second strong character.
6. **Conclude:** demonstrate professional readiness and provide contact access.

---

## 9. Page Template Rules

These are constraints, not finished layouts.

### Cover Page

- One hero artwork or one controlled artwork crop.
- Artwork is the first visual signal.
- Include artist name and `CHARACTER CONCEPT ARTIST`; optional monogram only if it is a resolved mark.
- Maximum three text elements.
- No project description, metadata list, or portfolio year unless required.
- Keep at least 25% controlled negative space unless artwork is intentionally full bleed.

### Hero Spread Page

- One artwork, 90-100% visual occupancy.
- No information column.
- Maximum one small label.
- Secondary forms may bleed; critical character information remains readable.
- Must produce a clear three-second focal point.

### Character Breakdown Page

- 3-4 views, each tied to a unique design topic.
- One view establishes hierarchy; supporting views are clearly smaller.
- Use topic labels and optional keyword lines only.
- Do not repeat the hero spread at reduced size unless orientation genuinely requires it.
- Page 3 must use only visibly supported crops from the approved hero artwork.
- Do not fabricate schematics, isolated components, material callouts, or annotations that are not present in the source.
- Approved observational topics include face and identity, costume silhouette, weapon silhouette, creature relationship, visible ornament, and visible layering.

### Character Sheet Page

- Orthographic information dominates.
- Use consistent figure scale and shared baselines.
- One narrow information zone may hold factual labels or palette swatches.
- Avoid cinematic overlaps, decorative cropping, or oversized display type.

### Costume / Detail Page

- Organize by construction logic: upper body, lower body, accessories, material, or fastening.
- 2-4 detail groups maximum.
- Include enough context to locate each detail.
- Palette swatches must be sampled from the artwork and labeled only when useful.

### Sketch / Process Page

- Show 3-5 meaningful stages or one focused exploration set.
- Make chronology or selection logic immediately clear.
- Finished artwork may appear only as a small endpoint reference.
- Keep sketches at legible scale; do not create a wall of thumbnails.

### Resume Page

- Use the primary type family only.
- Recommended structure: profile, experience, selected projects, skills, education, contact.
- Body text minimum 15 px at 1920 x 1080.
- Use two columns maximum and one accent color.
- No skill bars, star ratings, portraits, decorative timelines, or infographic charts.

### Contact Page

- Include name, role, email, portfolio link, and relevant professional platforms.
- Use one artwork fragment only if it supports the closing tone.
- Maximum five information lines.
- Keep generous negative space and a decisive final hierarchy.
- Do not use QR codes unless the destination is tested and essential.

---

## 10. Do / Do Not Rules

### Do

- Use strong and immediate hierarchy.
- Let artwork dominate emotional pages.
- Use controlled typography and factual labels.
- Build every page from the same grid and spacing scale.
- Give every crop and graphic element a specific purpose.
- Alternate high-impact pages with analytical pages.
- Preserve character readability and design information.
- Use white space as pacing, not as unused leftover area.
- Check pages at thumbnail, reading, and detail scale.
- Remove work that weakens the overall standard.

### Do Not

- Make every page equal in density, structure, or image scale.
- Overuse text, labels, lines, numbers, or geometric blocks.
- Copy Arknights layouts, symbols, UI, or promotional conventions.
- Turn the portfolio into a marketing poster or fictional game campaign.
- Add fake game data, rarity, stars, dates, factions, or serial codes.
- Use random labels that do not help review the artwork.
- Crop faces, hands, feet, weapons, or signature elements without a clear reason.
- Present random illustration enlargements as character-design analysis.
- Put cards inside cards or frame every artwork.
- Add decorative textures, gradients, glow, or technical overlays.
- Use more than one accent color on a page.
- Include weak work to fill space or meet an arbitrary page count.

---

## 11. Codex Execution Rules

### Before Designing Any Page

1. Work on only the page explicitly approved by the user.
2. Inspect the source artwork at full resolution.
3. Confirm the page's single primary objective.
4. Identify the focal artwork and every necessary supporting asset.
5. State what each crop, label, and graphic element contributes.
6. Select the appropriate template and density level from this Bible.
7. Do not reuse a previous composition merely because it is available.

### During Design

1. Start from the 12-column grid and 8 px spacing system.
2. Establish artwork scale and focal path before adding typography.
3. Use only factual text supplied by the source or user and follow the defined English/Chinese language split.
4. Use no decorative element without a structural or interpretive function.
5. Preserve source artwork and save edits non-destructively.
6. Design one strong hierarchy, not several competing focal points.
7. Compare the page with the immediately preceding and following page roles.
8. Use Signal Red `#D6263A` as the only global graphic accent.
9. Use only existing source assets; never generate, outpaint, reconstruct, or invent artwork or technical information.
10. Apply the single bottom-right page-number system on every numbered page except the cover.

### Mandatory Art Director Review

Every page must pass all checks before presentation:

- **Three-second test:** Is the intended focal point immediate?
- **Role test:** Does the page perform its assigned portfolio function?
- **Artwork test:** Is important design information readable and uncropped?
- **Evidence test:** Is every design claim visibly supported by an existing source asset?
- **Purpose test:** Does every image, crop, label, line, and shape have a reason?
- **Hierarchy test:** Is there one clear primary level and controlled supporting levels?
- **Editorial test:** Does the page feel authored rather than templated?
- **Studio test:** Is the information useful to an Art Director or Lead Concept Artist?
- **Consistency test:** Does it use the defined grid, type, color, and spacing systems?
- **Restraint test:** Can anything be removed without weakening the page? If yes, remove it.
- **Sequence test:** Does the page improve the rhythm of the portfolio around it?

If any answer is no or uncertain, revise the page and repeat the review.

### Visual QA

- Review at 25% for hierarchy and pacing.
- Review at 50% for normal portfolio reading.
- Review at 100% for crop quality, typography, and image resolution.
- Verify 1920 x 1080 output and safe-area compliance.
- Compare against the previous page side by side.
- Check for accidental borders, uneven gutters, weak alignment, and text collisions.

### File And Approval Rules

- Save each page in a dedicated, clearly named folder.
- Keep source artwork unchanged.
- Use versioned filenames until approval; mark only the approved direction as `FINAL`.
- Do not create additional pages, a combined portfolio, or a PDF without explicit approval.
- Present the page, explain decisions, report the review result, and wait for approval before continuing.

---

## System Summary

Portfolio V3 uses large artwork, disciplined typography, a 12-column editorial grid, neutral page fields, and one locked Signal Red accent. Cinematic pages create emotional impact; structured pages prove character-design thinking using only visible evidence from existing source assets. Graphic language is permitted only when it organizes real information. The system should feel confident enough to be quiet and precise enough to support professional review.
