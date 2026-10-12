# Digital Garden visual redesign

The user requests tasteSKILL and wants to review completed key pages. Build a working local review before requesting approval. Production deployment is outside this step.

## Audit and direction

Current site: purple accent, Fraunces/DM Sans, centered avatar hero, glass article cards and repeated single-column sections. Preserve route URLs, navigation labels, article content, Markdown anchors and API contracts.

Design read: editorial personal blog for Chinese readers, quiet and individual. DESIGN_VARIANCE 6, MOTION_INTENSITY 3, VISUAL_DENSITY 3. Keep React/Tailwind 3; implement native CSS. Use off-white paper, charcoal ink and a muted violet accent, with a corresponding dark theme. Outfit provides Latin display; locally served Noto Serif SC provides Chinese editorial headings; system sans provides reading text.

## Pages

- Home: asymmetric introduction with the existing character portrait, a prominent recent article, smaller article entries, two-column projects and links to other garden areas.
- Archive: title, real tags, search, results and pagination. Spacing and fine dividers replace glass cards.
- Reading: comfortable body measure, metadata, sticky contents and preserved interaction forms.
- About: a generous portrait and profile composition using actual profile data.
- Responsive mobile navigation, single-column layouts, focus states and reduced-motion support.

## Images and verification

Gemini is the default generation workflow. Dedicated Chrome startup was rejected by automatic approval. Reuse the existing portrait and real article covers; do not substitute an image generator.

Scope colors and typography to the public editorial shell; ledger, tracker and admin retain their tokens. The local review server proxies public GET requests and rejects API mutations. Verify build, lint, browser layouts, archive search/tags, navigation, reading contents and both themes at desktop/mobile sizes. Capture real local screenshots.
