# Advaya Recovery Desk: deploy notes

## What's in here
- `dental/`: upload this whole folder to the root of advayaai.in, so the pages live at https://advayaai.in/dental/
  - `index.html`: landing page (offer, ROI calculator, pricing with India/US toggle, FAQ, audit form)
  - `compliance.html`: patient data, HIPAA and DPDP page
  - `unscheduled-treatment-recovery.html`: SEO guide (global/US)
  - `whatsapp-patient-recall-india.html`: SEO guide (India)
  - `assets/`: CSS, JS, favicon, 1200×630 social image
- `sitemap-dental.xml`: upload to the site root (https://advayaai.in/sitemap-dental.xml)
- `robots-add-these-lines.txt`: add these lines to your existing root robots.txt

## Before going live (5 minutes)
1. Open `dental/assets/site.js` and set `CONTACT_EMAIL` and `WHATSAPP_NUMBER` (e.g. "9198XXXXXXXX"). The WhatsApp buttons stay hidden until a number is set.
2. The audit form opens the visitor's email app (mailto). For better conversion, swap it for a form service (Tally, Formspree, Google Forms, or an n8n webhook). Keep patient details out of the form.
3. If you move to a separate domain, find and replace `https://advayaai.in/dental/` across all files (canonicals, OG tags, JSON-LD, sitemap).
4. Link to `/dental/` from your main advayaai.in navigation and homepage. Internal links matter for indexing.

## After going live
- Google Search Console: add the property, submit `sitemap-dental.xml`, and request indexing for the 4 URLs.
- Bing Webmaster Tools: import from Search Console.
- Test: https://search.google.com/test/rich-results and https://pagespeed.web.dev/
- Write one new guide every 2–3 weeks (ideas: "dental recall message templates", "how to reduce dental no-shows in India", "Open Dental treatment finder follow-up", "NexHealth vs Weave for recall").

## Before you sign the first US clinic
- Sign BAAs: NexHealth (developer), Keragon, Twilio (on a BAA-eligible edition), Retell AI. Ideally open them in the clinic's name.
- Have a US healthcare attorney review your BAA template, TCPA consent for texts and calls, and state call-recording rules.
- Re-check each vendor's current terms. They change.
