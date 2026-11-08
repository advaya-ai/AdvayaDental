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
  clinic: "Clinic name",
  city: "City and country",
  phone: "Phone / WhatsApp",
  offers: "Interested in",
  pms: "Where appointments live today",
  size: "Chairs / locations",
  notes: "Anything else? (optional)",
};

const LIMITS = { name: 120, clinic: 160, city: 120, phone: 40, pms: 80, size: 60, notes: 2000 };

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
    clinic: clean(body.clinic, LIMITS.clinic),
    city: clean(body.city, LIMITS.city),
    phone: clean(body.phone, LIMITS.phone),
    pms: clean(body.pms, LIMITS.pms),
    size: clean(body.size, LIMITS.size),
    notes: clean(body.notes, LIMITS.notes),
  };
  const offers = Array.isArray(body.offers)
    ? body.offers.map(o => clean(o, 60)).filter(Boolean).slice(0, 5)
    : [];

  const missing = ["name", "clinic", "city", "phone"].filter(k => !data[k]);
  if (missing.length) {
    return res.status(400).json({ ok: false, error: "Missing required fields", fields: missing });
  }
  if (!/^[+()\d\s.-]{6,40}$/.test(data.phone)) {
    return res.status(400).json({ ok: false, error: "Please enter a valid phone number", fields: ["phone"] });
  }

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) {
    console.error("AIRTABLE_TOKEN is not set");
    return res.status(500).json({ ok: false, error: "Form is not configured" });
  }

  const fields = {
    [FIELDS.name]: data.name,
    [FIELDS.clinic]: data.clinic,
    [FIELDS.city]: data.city,
    [FIELDS.phone]: data.phone,
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
