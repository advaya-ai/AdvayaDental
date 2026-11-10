/* Advaya AI Dental — small, dependency-free behaviours.
   EDIT THESE TWO VALUES BEFORE GOING LIVE. */
const CONFIG = {
  CONTACT_EMAIL: "support@advayaai.in",  // where audit / demo requests go
  WHATSAPP_NUMBER: ""                 // e.g. "919876543210" (country code, no +). Empty hides WhatsApp buttons.
};

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- region (India ₹ / US $) ---------- */
  const R = {
    in: { cur: "₹", locale: "en-IN",
      fees: { missed: 4999, recovery: 14999 },
      defaults: { mcCalls: 20, mcNew: 30, mcValue: 4000, mcRate: 20, rdList: 500, rdValue: 4000, rdRate: 4 },
      range: { mcValue: [1000, 20000, 500], rdValue: [1000, 25000, 500] } },
    us: { cur: "$", locale: "en-US",
      fees: { missed: 249, recovery: 750 },
      defaults: { mcCalls: 20, mcNew: 30, mcValue: 400, mcRate: 20, rdList: 250, rdValue: 500, rdRate: 4 },
      range: { mcValue: [100, 3000, 50], rdValue: [150, 3000, 50] } }
  };
  let region = "in", saved = null;
  try { saved = localStorage.getItem("advaya-region"); } catch (e) {}
  if (saved === "in" || saved === "us") region = saved;
  else { try { if (/^America\//.test(Intl.DateTimeFormat().resolvedOptions().timeZone || "")) region = "us"; } catch (e) {} }

  const money = n => R[region].cur + Math.round(n).toLocaleString(R[region].locale);

  function setRange(id, [min, max, step]) { const el = $(id); if (el) { el.min = min; el.max = max; el.step = step; } }
  function setDefaults() {
    const d = R[region].defaults;
    Object.entries({ "#mc-calls": d.mcCalls, "#mc-new": d.mcNew, "#mc-value": d.mcValue, "#mc-rate": d.mcRate,
                     "#rd-list": d.rdList, "#rd-value": d.rdValue, "#rd-rate": d.rdRate })
      .forEach(([id, v]) => { const el = $(id); if (el) el.value = v; });
  }
  function applyRegion(r, resetDefaults, remember) {
    region = r;
    if (remember) { try { localStorage.setItem("advaya-region", r); } catch (e) {} }
    $$("[data-region-btn]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.regionBtn === r)));
    $$("[data-region]").forEach(el => { el.hidden = el.dataset.region !== r; });
    setRange("#mc-value", R[r].range.mcValue);
    setRange("#rd-value", R[r].range.rdValue);
    if (resetDefaults) setDefaults();
    calcMissed(); calcRecovery();
  }
  $$("[data-region-btn]").forEach(b => b.addEventListener("click", () => applyRegion(b.dataset.regionBtn, true, true)));

  /* ---------- calculator tabs ---------- */
  $$("[data-calc-tab]").forEach(b => b.addEventListener("click", () => {
    $$("[data-calc-tab]").forEach(x => x.setAttribute("aria-selected", String(x === b)));
    $$("[data-calc-panel]").forEach(p => { p.hidden = p.dataset.calcPanel !== b.dataset.calcTab; });
  }));

  const txt = (id, v) => { const el = $(id); if (el) el.textContent = v; };

  /* Missed calls: missed/week × 4.33 × share that are new-patient enquiries × value × share we turn into bookings */
  function calcMissed() {
    if (!$("#mc-calls")) return;
    const calls = +$("#mc-calls").value, share = +$("#mc-new").value / 100, value = +$("#mc-value").value, rate = +$("#mc-rate").value / 100;
    const enquiries = calls * 4.33 * share;
    const lost = enquiries * value;
    const booked = Math.round(enquiries * rate);
    const recovered = booked * value;
    const fee = R[region].fees.missed;
    txt("#o-mc-calls", calls); txt("#o-mc-new", Math.round(share * 100) + "%"); txt("#o-mc-value", money(value)); txt("#o-mc-rate", Math.round(rate * 100) + "%");
    txt("#mc-lost", money(lost)); txt("#mc-booked", booked); txt("#mc-recovered", money(recovered)); txt("#mc-fee", money(fee));
    txt("#mc-mult", (recovered / fee).toFixed(1) + "×"); txt("#mc-big", money(recovered));
    txt("#mc-verdict", recovered / fee >= 3 ? "Comfortably pays for itself on these numbers." : recovered / fee >= 1 ? "Roughly pays for itself. Check your real missed-call count first." : "Probably not worth it at this volume. We'll say so on the audit.");
  }
  /* Recovery Desk: list × booking rate × value */
  function calcRecovery() {
    if (!$("#rd-list")) return;
    const n = +$("#rd-list").value, v = +$("#rd-value").value, rate = +$("#rd-rate").value / 100;
    const booked = Math.round(n * rate), prod = booked * v, fee = R[region].fees.recovery;
    txt("#o-rd-list", n.toLocaleString()); txt("#o-rd-value", money(v)); txt("#o-rd-rate", Math.round(rate * 100) + "%");
    txt("#rd-booked", booked); txt("#rd-prod", money(prod)); txt("#rd-fee", money(fee)); txt("#rd-mult", (prod / fee).toFixed(1) + "×"); txt("#rd-big", money(prod));
    txt("#rd-verdict", prod / fee >= 5 ? "Above our 5× guarantee line. A pilot makes sense." : prod / fee >= 2 ? "Positive, but below 5×. We'd check your list on the audit before recommending a pilot." : "Probably not worth it yet. Your list may be too small.");
  }
  ["#mc-calls", "#mc-new", "#mc-value", "#mc-rate"].forEach(id => { const el = $(id); if (el) el.addEventListener("input", calcMissed); });
  ["#rd-list", "#rd-value", "#rd-rate"].forEach(id => { const el = $(id); if (el) el.addEventListener("input", calcRecovery); });

  /* ---------- success popup ---------- */
  const modal = $("#success-modal");
  function openSuccess(name, phone) {
    if (!modal) return;
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    const first = /^(dr|mr|mrs|ms|miss|prof)\.?$/i.test(parts[0] || "") ? parts.slice(0, 2).join(" ") : (parts[0] || "");
    $("#success-text").textContent = (first ? "Thank you, " + first + ". " : "Thank you. ") +
      "Our team will call you within 20 minutes" + (phone ? " on " + String(phone).trim() : " on the number you shared") + ".";
    modal.hidden = false;
    $("#success-close").focus();
  }
  function closeSuccess() { if (modal) modal.hidden = true; }
  if (modal) {
    $("#success-close").addEventListener("click", closeSuccess);
    modal.addEventListener("click", e => { if (e.target === modal) closeSuccess(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && !modal.hidden) closeSuccess(); });
  }

  /* ---------- audit / demo form → Airtable (via /api/lead), email as fallback ---------- */
  const form = $("#audit-form");
  if (form) {
    const status = $("#form-status");
    const submitBtn = form.querySelector('button[type="submit"]');
    const showStatus = (msg, kind) => {
      if (!status) return;
      status.textContent = msg;
      status.dataset.kind = kind;
      status.hidden = false;
    };
    const mailtoFallback = (d, offers) => {
      const lines = [
        "Free audit / demo request",
        "Name: " + d.get("name"), "Email: " + d.get("email"), "Clinic: " + d.get("clinic"), "City / country: " + d.get("city"),
        "Phone / WhatsApp: " + d.get("phone"), "Interested in: " + (offers.join(", ") || "Not sure yet"),
        "Practice software: " + d.get("pms"), "Chairs / locations: " + d.get("size"),
        "Notes: " + (d.get("notes") || "-")
      ];
      window.location.href = "mailto:" + CONFIG.CONTACT_EMAIL + "?subject=" + encodeURIComponent("Dental audit request: " + d.get("clinic")) + "&body=" + encodeURIComponent(lines.join("\n"));
    };

    form.addEventListener("submit", async e => {
      e.preventDefault();
      const d = new FormData(form);
      const offers = d.getAll("offer");
      const payload = {
        name: d.get("name"), email: d.get("email"), clinic: d.get("clinic"), city: d.get("city"), phone: d.get("phone"),
        offers, pms: d.get("pms"), size: d.get("size"), notes: d.get("notes") || "",
        website: d.get("website") || ""
      };
      if (submitBtn) { submitBtn.disabled = true; submitBtn.dataset.label = submitBtn.textContent; submitBtn.textContent = "Sending…"; }
      showStatus("Sending your request…", "info");
      try {
        const r = await fetch("/api/lead", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const out = await r.json().catch(() => ({}));
        if (r.ok && out.ok) {
          form.reset();
          if (status) status.hidden = true;
          openSuccess(payload.name, payload.phone);
        } else if (r.status === 400) {
          showStatus(out.error || "Please check the highlighted fields and try again.", "error");
        } else {
          throw new Error(out.error || "Request failed");
        }
      } catch (err) {
        showStatus("We couldn't save your request online, so your email app will open with the details filled in. If it doesn't, write to " + CONFIG.CONTACT_EMAIL + ".", "error");
        mailtoFallback(d, offers);
      } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitBtn.dataset.label || "Request my free audit"; }
      }
    });
  }

  $$("[data-wa]").forEach(a => {
    if (!CONFIG.WHATSAPP_NUMBER) { a.hidden = true; return; }
    a.href = "https://wa.me/" + CONFIG.WHATSAPP_NUMBER + "?text=" + encodeURIComponent("Hi Advaya, I'd like a free audit for my dental clinic.");
  });
  $$("[data-email]").forEach(a => { a.href = "mailto:" + CONFIG.CONTACT_EMAIL; a.textContent = CONFIG.CONTACT_EMAIL; });
  $$("[data-year]").forEach(el => el.textContent = new Date().getFullYear());

  applyRegion(region, region === "us", false);
})();
