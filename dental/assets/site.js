/* Advaya Recovery Desk — small, dependency-free behaviours.
   EDIT THESE TWO VALUES BEFORE GOING LIVE. */
const CONFIG = {
  CONTACT_EMAIL: "hello@advayaai.in",   // where audit requests go
  WHATSAPP_NUMBER: ""                  // e.g. "919876543210" (country code, no +). Leave empty to hide WhatsApp buttons.
};

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- region toggle (pricing + calculator currency) ---------- */
  const PRICES = {
    in: { cur: "₹", locale: "en-IN", fee: 14999, defaultValue: 4000, defaultList: 500 },
    us: { cur: "$", locale: "en-US", fee: 750,   defaultValue: 500,  defaultList: 250 }
  };
  let region = "in", saved = null;
  try { saved = localStorage.getItem("advaya-region"); } catch (e) {}
  if (saved === "us" || saved === "in") {
    region = saved;
  } else {
    // first visit: guess from timezone (no network call, no tracking)
    try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; if (/^America\//.test(tz)) region = "us"; } catch (e) {}
  }

  function fmt(n) {
    const p = PRICES[region];
    return p.cur + Math.round(n).toLocaleString(p.locale);
  }

  function applyRegion(r, fromUser) {
    region = r;
    if (fromUser) { try { localStorage.setItem("advaya-region", r); } catch (e) {} }
    $$("[data-region-btn]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.regionBtn === r)));
    $$("[data-region]").forEach(el => { el.hidden = el.dataset.region !== r; });
    const val = $("#c-value"), list = $("#c-list");
    if (val) { val.min = r === "in" ? 1000 : 150; val.max = r === "in" ? 25000 : 3000; val.step = r === "in" ? 500 : 50; }
    if (val && fromUser) { val.value = PRICES[r].defaultValue; }
    if (list && fromUser) { list.value = PRICES[r].defaultList; }
    calc();
  }
  $$("[data-region-btn]").forEach(b => b.addEventListener("click", () => applyRegion(b.dataset.regionBtn, true)));

  /* ---------- ROI calculator ---------- */
  function calc() {
    const list = $("#c-list"); if (!list) return;
    const n = +list.value, v = +$("#c-value").value, rate = +$("#c-rate").value / 100;
    const fee = PRICES[region].fee;
    const booked = Math.round(n * rate);
    const production = booked * v;
    const multiple = production / fee;
    $("#o-list").textContent = n.toLocaleString();
    $("#o-value").textContent = fmt(v);
    $("#o-rate").textContent = (rate * 100).toFixed(0) + "%";
    $("#r-booked").textContent = booked.toLocaleString();
    $("#r-prod").textContent = fmt(production);
    $("#r-fee").textContent = fmt(fee);
    $("#r-mult").textContent = multiple.toFixed(1) + "×";
    $("#r-big").textContent = fmt(production);
    const verdict = $("#r-verdict");
    if (verdict) {
      verdict.textContent = multiple >= 5
        ? "Above our 5× guarantee line — a pilot makes sense."
        : multiple >= 2
          ? "Positive, but below 5×. We'd check your list size and treatment mix on the audit call before recommending a pilot."
          : "Probably not worth it yet. Your list may be too small — we'll tell you honestly on the audit.";
    }
  }
  ["#c-list", "#c-value", "#c-rate"].forEach(id => { const el = $(id); if (el) el.addEventListener("input", calc); });

  /* ---------- audit form → email (and optional WhatsApp) ---------- */
  const form = $("#audit-form");
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault();
      const d = new FormData(form);
      const lines = [
        "Free recovery audit request",
        "Name: " + d.get("name"),
        "Clinic: " + d.get("clinic"),
        "City / country: " + d.get("city"),
        "Practice software: " + d.get("pms"),
        "Chairs / locations: " + d.get("size"),
        "Phone / WhatsApp: " + d.get("phone"),
        "Notes: " + (d.get("notes") || "-")
      ];
      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = "mailto:" + CONFIG.CONTACT_EMAIL + "?subject=" + encodeURIComponent("Recovery audit — " + d.get("clinic")) + "&body=" + body;
      const ok = $("#form-ok"); if (ok) ok.hidden = false;
    });
  }

  /* ---------- WhatsApp buttons ---------- */
  $$("[data-wa]").forEach(a => {
    if (!CONFIG.WHATSAPP_NUMBER) { a.hidden = true; return; }
    a.href = "https://wa.me/" + CONFIG.WHATSAPP_NUMBER + "?text=" + encodeURIComponent("Hi Advaya, I'd like a free unscheduled-treatment audit for my clinic.");
  });
  $$("[data-email]").forEach(a => { a.href = "mailto:" + CONFIG.CONTACT_EMAIL; a.textContent = CONFIG.CONTACT_EMAIL; });

  /* ---------- year ---------- */
  $$("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

  applyRegion(region, region === "us");
})();
