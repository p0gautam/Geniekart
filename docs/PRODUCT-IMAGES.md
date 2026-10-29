# Generated product imagery — 23 October 2026

Replaced active catalog placeholders with 33 AI-generated representative visuals using the built-in image generation tool. Art direction: DSLR-style realism, natural window lighting, neutral warm backgrounds. These are not supplier photographs or confirmed inventory specifications.

Final assets: `public/images/products/`, grouped by category, WebP at up to 1024 pixels and quality 85. Fourteen individual products have two gallery views each. Four combos have a full-set primary image and three component views. All combo content thumbnails use the individual product images; packaging has its own image. Product names, descriptions, categories, enquiry settings and all other non-image product fields were verified unchanged.

Exact prompts and original generation paths: `scripts/product-image-manifest.json`. Apply script: `scripts/apply-product-images.ts`. Previous image mappings are backed up at `.local/backups/product-images-1792748076792.json`; previous media and files were retained.

Verification: production build, TypeScript and ESLint passed. Catalog regression verified 18 pages/enquiries, eight category filters, all 33 images and 127 redirects. Browser checked gift-set cards, gallery selection and mobile detail layout without horizontal overflow. Preview screenshot: `docs/catalog-combos-preview.png`.

Local preview: http://localhost:3000/corporate-gifts

This supersedes the placeholder-image notes in the earlier catalog replacement report.
