// Vercel Function: receives the free-audit form and creates a row in Airtable.
//
// Required environment variable (Vercel → Project → Settings → Environment Variables):
//   AIRTABLE_TOKEN  Personal access token with scope data.records:write on the base below.
// Optional overrides:
//   AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID
//
// The token is only ever read here on the server; it is never sent to the browser.

const BASE_ID = process.env.AIRTABLE_BASE_ID || "appxVgFc2OECiVDXz";
const TABLE_ID = process.env.AIRTABLE_TABLE_ID || "tblxknxFsVW9fMXaE";

// Airtable column names. They must match the table exactly (case and punctuation).
const FIELDS = {
  name: "Name",
  email: "Email",
  clinic: "Clinic name",
  city: "City and country",
  phone: "Phone / WhatsApp",
  offers: "Interested in",
  pms: "Where appointments live today",
  size: "Chairs / locations",
  notes: "Anything else? (optional)",
};

const LIMITS = { name: 120, email: 160, clinic: 160, city: 120, phone: 40, pms: 80, size: 60, notes: 2000 };

function clean(value, max) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim().slice(0, max);
}

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (e) { return null; }
  }
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = parseBody(req);
  if (!body) return res.status(400).json({ ok: false, error: "Invalid request" });

  // Honeypot: real visitors never fill the hidden "website" field.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const data = {
    name: clean(body.name, LIMITS.name),
    email: clean(body.email, LIMITS.email).toLowerCase(),
    clinic: clean(body.clinic, LIMITS.clinic),
    city: clean(body.city, LIMITS.city),
    phone: clean(body.phone, LIMITS.phone),
    countryCode: clean(body.country_code, 6),
    pms: clean(body.pms, LIMITS.pms),
    size: clean(body.size, LIMITS.size),
    notes: clean(body.notes, LIMITS.notes),
  };
  const offers = Array.isArray(body.offers)
    ? body.offers.map(o => clean(o, 60)).filter(Boolean).slice(0, 5)
    : [];

  const missing = ["name", "email", "clinic", "city", "phone"].filter(k => !data[k]);
  if (missing.length) {
    return res.status(400).json({ ok: false, error: "Missing required fields", fields: missing });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email)) {
    return res.status(400).json({ ok: false, error: "Please enter a valid email address", fields: ["email"] });
  }
  if (!/^[+()\d\s.-]{6,40}$/.test(data.phone)) {
    return res.status(400).json({ ok: false, error: "Please enter a valid phone number", fields: ["phone"] });
  }

  // Save the number in E.164 (+<country code><number>) so the voice agent can dial it.
  // A number typed with its own +code wins; otherwise prefix the code chosen in the dropdown.
  const digits = data.phone.replace(/\D/g, "");
  let phone;
  if (data.phone.startsWith("+")) {
    phone = "+" + digits;
  } else if (/^\+\d{1,4}$/.test(data.countryCode)) {
    const ccDigits = data.countryCode.slice(1);
    let national = digits.replace(/^0+/, ""); // drop trunk prefix, e.g. 098... -> 98...
    // Visitor typed the code again without "+" (e.g. 91 98765 43210): don't double it.
    if (national.startsWith(ccDigits) && national.length > 10) national = national.slice(ccDigits.length);
    phone = data.countryCode + national;
  } else {
    phone = data.phone; // old form without the dropdown
  }
  if (phone.replace(/\D/g, "").length < 8) {
    return res.status(400).json({ ok: false, error: "Please enter a valid phone number", fields: ["phone"] });
  }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.error("AIRTABLE_TOKEN is not set");
    return res.status(500).json({ ok: false, error: "Form is not configured" });
  }

  const fields = {
    [FIELDS.name]: data.name,
    [FIELDS.email]: data.email,
    [FIELDS.clinic]: data.clinic,
    [FIELDS.city]: data.city,
    [FIELDS.phone]: phone,
    [FIELDS.offers]: offers.length ? offers.join(", ") : "Not sure yet",
    [FIELDS.pms]: data.pms,
    [FIELDS.size]: data.size,
  };
  if (data.notes) fields[FIELDS.notes] = data.notes;

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }], typecast: true }),
    });
    if (!r.ok) {
      const detail = await r.text();
      console.error("Airtable error", r.status, detail.slice(0, 500));
      return res.status(502).json({ ok: false, error: "Could not save your request" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Airtable request failed", err);
    return res.status(502).json({ ok: false, error: "Could not save your request" });
  }
};
