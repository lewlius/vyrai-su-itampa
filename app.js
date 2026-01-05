(() => {
  // =========================
  // KAINODARA (lengva redaguoti)
  // =========================
  const PRICING = {
    // Bazė (jūsų kryptis: konkurencinga, ne pigiausia)
    baseEurPerM2: 22,

    // Sudėtingumo priedai (paprasta logika, gerai veikia “preliminariai”)
    perRoom: 90,
    perBath: 150,

    // Medžiagos (apytiksliai: kabeliai, dėžutės, tvirtinimas, bazinė automatika)
    materialsPerM2: 15,
    materialsBase: 320,

    // SAFE upsell (paprastas, aiškus priedas)
    safeAddonWork: 220,

    // PVM
    vat: 0.21,

    // Nedidelis koeficientas “realistiškumui”
    coef: 1.02,
  };

  // ========= Helpers =========
  const $ = (id) => document.getElementById(id);

  const euro = (n) => {
    const val = Math.max(0, Math.round(Number(n) || 0));
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
  };

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

  function getNum(id, fallback) {
    const el = $(id);
    if (!el) return fallback;
    const v = Number(el.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function getBool(id, fallback = false) {
    const el = $(id);
    if (!el) return fallback;
    return !!el.checked;
  }

  // Debug only when ?debug=1
  const DEBUG = new URLSearchParams(location.search).get("debug") === "1";
  function debug(msg) {
    const box = $("debugBox");
    if (!box) return;
    if (!DEBUG) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.textContent = msg;
  }

  // Debounce (kad nestrigtų rašant)
  function debounce(fn, ms = 80) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  // ========= Core calc =========
  function compute() {
    // Required minimal set (Simple)
    const required = ["area", "rooms", "baths", "includeMaterials", "totalPrice", "workPrice", "materialsPrice", "includedText"];
    const missing = required.filter(id => !$(id));
    if (missing.length) {
      debug("Trūksta elementų su ID:\n- " + missing.join("\n- "));
      return null;
    }

    // Read & clamp inputs
    const area = clamp(getNum("area", 60), 10, 1000);
    const rooms = clamp(getNum("rooms", 3), 1, 30);
    const baths = clamp(getNum("baths", 1), 0, 20);

    // Keep inputs “clean”
    $("area").value = String(Math.round(area));
    $("rooms").value = String(Math.round(rooms));
    $("baths").value = String(Math.round(baths));

    const includeMaterials = getBool("includeMaterials", true);
    const showVat = getBool("showVat", false);
    const addSafe = getBool("addSafe", false);

    // Work formula
    const workBase = area * PRICING.baseEurPerM2;
    const workComplex = rooms * PRICING.perRoom + baths * PRICING.perBath;
    const workSafe = addSafe ? PRICING.safeAddonWork : 0;

    const workSubtotal = (workBase + workComplex + workSafe) * PRICING.coef;

    // Materials (simple model)
    const materialsSubtotal = includeMaterials
      ? (area * PRICING.materialsPerM2 + PRICING.materialsBase)
      : 0;

    const vatCoef = showVat ? (1 + PRICING.vat) : 1;

    const workFinal = workSubtotal * vatCoef;
    const matFinal = materialsSubtotal * vatCoef;
    const totalFinal = (workSubtotal + materialsSubtotal) * vatCoef;

    return {
      area, rooms, baths,
      includeMaterials, showVat, addSafe,
      workFinal, matFinal, totalFinal
    };
  }

  function render(r) {
    if (!r) return;

    $("workPrice").textContent = euro(r.workFinal);
    $("materialsPrice").textContent = euro(r.matFinal);
    $("totalPrice").textContent = euro(r.totalFinal);

    const vatHint = $("vatHint");
    if (vatHint) vatHint.textContent = r.showVat ? "Rodoma su PVM" : "Rodoma be PVM";

    const included =
      (r.includeMaterials
        ? "Įskaičiuoti darbai ir medžiagos: kabeliai, dėžutės, tvirtinimo smulkmenos, bazinė automatika."
        : "Įskaičiuoti tik darbai. Įjunk „Įtraukti medžiagas“, jei nori matyti bendrą sumą su medžiagomis.")
      + " Neįeina: šviestuvai, rozetės/jungikliai (dizainas), LED profiliai/valdikliai, specifinė smart įranga.";

    $("includedText").textContent = included;

    // WhatsApp lead message (super svarbu konversijai)
    const phone = "3706XXXXXXX"; // pakeisk
    const msg =
      `Sveiki, noriu pasiūlymo elektros darbams.\n\n` +
      `Plotas: ${r.area} m²\n` +
      `Kambariai: ${r.rooms}\n` +
      `Vonios: ${r.baths}\n` +
      `Medžiagos: ${r.includeMaterials ? "Įtrauktos" : "Ne"}\n` +
      `SAFE apsauga: ${r.addSafe ? "Taip" : "Ne"}\n` +
      `PVM: ${r.showVat ? "Su PVM" : "Be PVM"}\n\n` +
      `Preliminari suma: ${euro(r.totalFinal)}\n\n` +
      `Adresas/miestas:\nPageidaujamas laikas:\nKomentaras:`;

    const wa = $("whatsBtn");
    if (wa) {
      wa.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    }

    debug(""); // clear if debug mode
  }

  const recalc = debounce(() => {
    const r = compute();
    render(r);
  }, 80);

  // ========= Modal (help) =========
  function initHelp() {
    const btn = $("helpBtn");
    const modal = $("helpModal");
    const close = $("helpClose");
    const x = $("helpX");

    if (!btn || !modal) return;

    const open = () => { modal.hidden = false; };
    const shut = () => { modal.hidden = true; };

    btn.addEventListener("click", open);
    close && close.addEventListener("click", shut);
    x && x.addEventListener("click", shut);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") shut();
    });
  }

  function init() {
    const year = $("year");
    if (year) year.textContent = String(new Date().getFullYear());

    const form = $("calcForm");
    if (form) {
      // input + change (kad veiktų ir mobile)
      form.addEventListener("input", recalc, true);
      form.addEventListener("change", recalc, true);
      form.addEventListener("click", recalc, true);
    }

    initHelp();
    recalc();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
