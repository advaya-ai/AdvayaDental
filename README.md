# Advaya.ai: Dental Systems site

Static, SEO-ready marketing site for **dental.advayaai.in**, with three offers:

| Page | URL |
|---|---|
| Home (all three offers, calculators, pricing, FAQ, audit form) | `/` |
| AI Receptionist | `/ai-receptionist` |
| Missed Call Manager | `/missed-call-manager` |
| Recovery Desk | `/recovery-desk` |
| Patient data (HIPAA / DPDP) | `/patient-data` |
| Guides | `/guides/unscheduled-treatment-recovery`, `/guides/whatsapp-patient-recall-india` |

There's no build step: plain HTML, one CSS file and one JS file. Vercel serves it as-is (`vercel.json` turns on clean URLs and redirects the old `/dental/...` paths).

## Before going live
1. In `assets/site.js`, set `CONTACT_EMAIL` and `WHATSAPP_NUMBER`.
2. In Vercel, add the domain `dental.advayaai.in` to this project, then add the CNAME record it shows you at your DNS provider.
3. Every canonical, Open Graph tag, JSON-LD block and the sitemap use `https://dental.advayaai.in`. If you pick a different subdomain, find and replace that string everywhere.
4. In Google Search Console, add the property and submit `https://dental.advayaai.in/sitemap.xml`.

## Editing
- Prices appear in `index.html` (pricing section and offer cards), in each offer page's JSON-LD `offers`, and as calculator fees in `assets/site.js` (`fees`).
- The region switch (India ₹ / US $) shows or hides elements marked `data-region="in"` / `data-region="us"`.
- Keep one `<h1>` per page, titles under about 60 characters and descriptions under about 155.
