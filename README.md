# The Global Co-Mission website

Static HTML website prepared for Cloudflare Pages.

Live Pages project: https://globalcm.pages.dev/

## Cloudflare Pages settings

- Framework preset: None
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`

## Structure

- `index.html` — Home
- `about/` — Mission, values, beliefs, and leadership
- `initiatives/` — Ore and Rio initiatives
- `give/` — Donation methods and FAQ
- `connect/` — Contact details and partnership paths
- `privacy-policy/` and `terms-of-service/` — Legal policies
- `_headers` — Security and cache headers
- `_redirects` — Legacy URL redirects
- `robots.txt` and `sitemap.xml` — Search indexing controls

## Before the domain cutover

The first build references current GCOM photography on the existing Squarespace CDN. Export the original image files and place optimized WebP/AVIF copies in `assets/img/` before retiring the Squarespace account. Update the image URLs at that time.

## Contact form and branded email

The sitewide form posts to the Cloudflare Pages Function at `/functions/api/contact.js`. Each successful submission sends a lead notification to GCOM, sends a branded confirmation to the visitor, and redirects to `/thank-you` for conversion measurement.

Configure these in **Cloudflare Pages → Settings → Variables and Secrets**:

- `RESEND_API_KEY` — encrypted secret
- `CONTACT_FROM_EMAIL` — recommended: `The Global Co-Mission <forms@gcom.world>`
- `CONTACT_TO_EMAIL` — recommended: `connect@gcom.world`

Verify `gcom.world` in Resend before using `forms@gcom.world`. Never commit the API key to GitHub.

## Analytics and search launch

Add the GCOM GA4 measurement ID before launch, then connect the final domain to Google Search Console and submit `/sitemap.xml`. The thank-you page is excluded from search and is prepared to fire `generate_lead` and `contact_form_submit` events once GA4 is installed.
