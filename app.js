(() => {
  // =========================
  // KAINODARA (lengva redaguoti)
  // =========================
  const PRICING = {
    baseEurPerM2: 22,
    perRoom: 90,
    perBath: 150,

    // Medžiagos (apytiksliai)
    materialsPerM2: 15,
    materialsBase: 320,

    // SAFE upsell
    safeAddonWork: 220,

    vat: 0.21,
    coef: 1.02,
  };

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

  // Debug tik su ?debug=1
  const DEBUG = new URLSearchParams(location.search).get("debug") === "1";
  function debug(msg) {
    const box = $("debugBox");
    if (!box) return;
    if (!DEBUG) {
      box.hidden = true;
      box.textContent = "";
      return;
    }
    box.hidden = false;
    box.textContent = msg;
  }

  function debounce(fn, ms = 80) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function compute() {
    // ✅ TIK minimalūs elementai Simple režime
    const required = ["area", "rooms", "baths", "includeMaterials", "totalPrice", "workPrice", "materialsPrice", "includedText"];
    const missing = required.filter(id => !$(id));
    if (missing.length) {
      debug("Trūksta elementų su ID:\n- " + missing.join("\n- "));
      return null;
    }

    const area = clamp(getNum("area", 60), 10, 2000);
    const rooms = clamp(getNum("rooms", 3), 1, 30);
    const baths = clamp(getNum("baths", 1), 0, 20);

    // sutvarko įvestis, kad neliktų nesąmonių
    $("area").value = String(Math.round(area));
    $("rooms").value = String(Math.round(rooms));
    $("baths").value = String(Math.round(baths));

    const includeMaterials = getBool("includeMaterials", true);

    // ✅ showVat ir vatHint – optional (jei nėra, default)
    const showVat = getBool("showVat", false);
    const addSafe = getBool("addSafe", false);

    const workBase = area * PRICING.baseEurPerM2;
    const workComplex = rooms * PRICING.perRoom + baths * PRICING.perBath;
    const workSafe = addSafe ? PRICING.safeAddonWork : 0;

    const workSubtotal = (workBase + workComplex + workSafe) * PRICING.coef;

    const materialsSubtotal = includeMaterials
      ? (area * PRICING.materialsPerM2 + PRICING.materialsBase)
      : 0;

    const vatCoef = showVat ? (1 + PRICING.vat) : 1;

    return {
      area, rooms, baths,
      includeMaterials, showVat, addSafe,
      workFinal: workSubtotal * vatCoef,
      matFinal: materialsSubtotal * vatCoef,
      totalFinal: (workSubtotal + materialsSubtotal) * vatCoef,
    };
  }

  function render(r) {
    if (!r) return;

    $("workPrice").textContent = euro(r.workFinal);
    $("materialsPrice").textContent = euro(r.matFinal);
    $("totalPrice").textContent = euro(r.totalFinal);

    // ✅ vatHint tik jei elementas egzistuoja
    const vatHint = $("vatHint");
    if (vatHint) vatHint.textContent = r.showVat ? "Rodoma su PVM" : "Rodoma be PVM";

    const included =
      (r.includeMaterials
        ? "Įskaičiuoti darbai ir medžiagos: kabeliai, dėžutės, tvirtinimo smulkmenos, bazinė automatika."
        : "Įskaičiuoti tik darbai. Įjunk „Įtraukti medžiagas“, jei nori matyti bendrą sumą su medžiagomis.")
      + " Neįeina: šviestuvai, rozetės/jungikliai (dizainas), LED profiliai/valdikliai, specifinė smart įranga.";

    $("includedText").textContent = included;

    // WhatsApp (jei mygtukas yra)
    const waBtn = $("whatsBtn");
    if (waBtn) {
      const phone = "3706XXXXXXX"; // pakeisk
      const msg =
        `Sveiki, noriu pasiūlymo elektros darbams.\n\n` +
        `Plotas: ${r.area} m²\nKambariai: ${r.rooms}\nVonios: ${r.baths}\n` +
        `Medžiagos: ${r.includeMaterials ? "Įtrauktos" : "Ne"}\n` +
        `SAFE apsauga: ${r.addSafe ? "Taip" : "Ne"}\n` +
        `PVM: ${r.showVat ? "Su PVM" : "Be PVM"}\n\n` +
        `Preliminari suma: ${euro(r.totalFinal)}\n\n` +
        `Adresas/miestas:\nPageidaujamas laikas:\nKomentaras:`;
      waBtn.href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    }

    debug("");
  }

  const recalc = debounce(() => render(compute()), 80);

  function init() {
    const year = $("year");
    if (year) year.textContent = String(new Date().getFullYear());

    const form = $("calcForm");
    if (form) {
      form.addEventListener("input", recalc, true);
      form.addEventListener("change", recalc, true);
      form.addEventListener("click", recalc, true);
    }

    recalc();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
