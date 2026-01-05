(() => {
  // ---- KAINODARA (keisi čia) ----
  const PRICING = {
    baseEurPerM2: 22,

    objectCoef: { new: 1.00, reno: 1.15 },
    wallCoef:   { gipsas: 1.00, blokeliai: 1.05, betonas: 1.12 },

    perRoom: 90,
    perBath: 150,
    kitchenHeavy: 220,
    lanPoint: 35,

    boardWork: { paprastas: 280, vidutinis: 420, pro: 700 },
    bundleWork:{ none: 0, safe: 220, pros: 340 },

    singleCoef: 1.02,
    vat: 0.21,

    materialsPerM2: { basic: 10, standard: 15, premium: 23 },
    boardMaterials: { basic: 220, standard: 320, premium: 500 }
  };

  const $ = (id) => document.getElementById(id);

  const euro = (n) => {
    const val = Math.max(0, Math.round(Number(n) || 0));
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " €";
  };

  const showDebug = (msg) => {
    const box = $("debugBox");
    if (!box) return;
    box.style.display = "block";
    box.textContent = msg;
  };
  const hideDebug = () => {
    const box = $("debugBox");
    if (!box) return;
    box.style.display = "none";
    box.textContent = "";
  };

  // Jei advanced laukų nėra / paslėpti – naudojam protingus default
  function getVal(id, fallback) {
    const el = $(id);
    if (!el) return fallback;
    if (el.type === "checkbox") return !!el.checked;
    return el.value ?? fallback;
  }

  function getNum(id, fallback) {
    const el = $(id);
    if (!el) return fallback;
    const v = Number(el.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function isAdvancedShown() {
    const box = $("advancedBox");
    return box && !box.hidden;
  }

  function calc() {
    try {
      // Required always-visible
      const required = ["area","rooms","baths","includeMaterials","showVat","totalPrice","workPrice","materialsPrice","vatHint","includedText","quoteBtn","year"];
      const missing = required.filter(id => !$(id));
      if (missing.length) {
        showDebug("Trūksta elementų su ID:\n- " + missing.join("\n- "));
        return;
      }
      hideDebug();

      const adv = isAdvancedShown();

      const area = getNum("area", 60);
      const rooms = getNum("rooms", 3);
      const baths = getNum("baths", 1);
      const includeMaterials = !!$("includeMaterials").checked;
      const showVat = !!$("showVat").checked;

      // Advanced values (only if shown; otherwise defaults)
      const objectType = adv ? getVal("objectType","new") : "new";
      const walls      = adv ? getVal("walls","gipsas") : "gipsas";
      const board      = adv ? getVal("board","vidutinis") : "vidutinis";
      const kitchen    = adv ? !!$("kitchen")?.checked : false;
      const lan        = adv ? getNum("lan", 0) : 0;
      const bundle     = adv ? getVal("bundle","none") : "none";
      const materialsLevel = adv ? getVal("materialsLevel","standard") : "standard";

      // WORK
      const base =
        area * PRICING.baseEurPerM2 *
        (PRICING.objectCoef[objectType] ?? 1) *
        (PRICING.wallCoef[walls] ?? 1);

      const complexity =
        rooms * PRICING.perRoom +
        baths * PRICING.perBath +
        (kitchen ? PRICING.kitchenHeavy : 0) +
        lan * PRICING.lanPoint;

      const boardWork = PRICING.boardWork[board] ?? 0;
      const bundleWork = PRICING.bundleWork[bundle] ?? 0;

      const workSubtotal = (base + complexity + boardWork + bundleWork) * PRICING.singleCoef;

      // MATERIALS
      let materials = 0;
      if (includeMaterials) {
        materials =
          area * (PRICING.materialsPerM2[materialsLevel] ?? 0) +
          (PRICING.boardMaterials[materialsLevel] ?? 0);
      }

      const vatCoef = showVat ? (1 + PRICING.vat) : 1;
      const workFinal = workSubtotal * vatCoef;
      const matFinal = materials * vatCoef;
      const total = (workSubtotal + materials) * vatCoef;

      $("workPrice").textContent = euro(workFinal);
      $("materialsPrice").textContent = includeMaterials ? euro(matFinal) : "0 €";
      $("totalPrice").textContent = euro(total);
      $("vatHint").textContent = showVat ? "Rodoma su PVM" : "Rodoma be PVM";

      // Included text
      const inc = includeMaterials
        ? "Įskaičiuotos darbų ir medžiagų sąnaudos (kabeliai, dėžutės, tvirtinimas, bazinė automatika/skydas pagal lygį)."
        : "Įskaičiuoti tik darbai. Medžiagas galime įtraukti – įjunk „Medžiagos: Įtraukti“.";

      $("includedText").textContent =
        inc + " Neįeina: šviestuvai, rozetės/jungikliai (dizainas), LED profiliai/valdikliai, specifinė smart įranga.";

      // mailto
      const subject = encodeURIComponent("Užklausa: elektros darbai (preliminari sąmata)");
      const body = encodeURIComponent(
        `Sveiki,\n\nNoriu gauti pasiūlymą.\n\n` +
        `Plotas: ${area} m²\nKambariai: ${rooms}\nVonios: ${baths}\n` +
        `Medžiagos: ${includeMaterials ? "Įtrauktos" : "Ne"}\n` +
        (adv ? `\n(Detalės)\nObjektas: ${objectType}\nSienos: ${walls}\nSkydas: ${board}\nVirtuvė (daug technikos): ${kitchen ? "Taip" : "Ne"}\nLAN/TV: ${lan}\nApsauga: ${bundle}\nMedžiagų lygis: ${materialsLevel}\n` : "") +
        `\nPVM: ${showVat ? "Su PVM" : "Be PVM"}\n\n` +
        `Preliminari suma: ${$("totalPrice").textContent}\nDarbai: ${$("workPrice").textContent}\nMedžiagos: ${$("materialsPrice").textContent}\n\n` +
        `Kontaktai:\nVardas:\nTelefonas:\nAdresas/miestas:\nKomentaras:\n`
      );

      const to = ""; // pvz. "vyraisuitampa@gmail.com"
      $("quoteBtn").href = `mailto:${to}?subject=${subject}&body=${body}`;

    } catch (err) {
      showDebug("JS klaida:\n" + (err?.stack || err?.message || String(err)));
      console.error(err);
    }
  }

  function initAdvancedToggle() {
    const btn = $("toggleAdvanced");
    const box = $("advancedBox");
    if (!btn || !box) return;

    btn.addEventListener("click", () => {
      const open = box.hidden;
      box.hidden = !open;
      btn.textContent = open ? "Tikslesnė sąmata (slėpti)" : "Tikslesnė sąmata (rodyti daugiau)";
      calc();
    });
  }

  function init() {
    $("year").textContent = new Date().getFullYear();

    const form = $("calcForm");
    if (!form) return;

    form.addEventListener("input", calc, true);
    form.addEventListener("change", calc, true);
    form.addEventListener("click", calc, true);

    initAdvancedToggle();
    calc();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
