/* app.js — Vyrai su įtampa: skaičiuoklė
   Stabilus event handling: klausom formos input/change + fallback click
   Debug box: jei trūksta ID ar meta klaidą, parodo ekrane.
*/
(() => {
  const PRICING = {
    // bazė €/m² (galėsi koreguoti)
    baseEurPerM2: 22,

    objectCoef: { new: 1.00, reno: 1.15 },
    wallCoef:   { gipsas: 1.00, blokeliai: 1.05, betonas: 1.12 },

    perRoom: 90,
    perBath: 150,
    kitchenHeavy: 220,
    lanPoint: 35,

    boardWork: { paprastas: 280, vidutinis: 420, pro: 700 },
    bundleWork:{ none: 0, safe: 220, pros: 340 },

    // vienos sumos koeficientas (vidurkis)
    singleCoef: 1.02,

    vat: 0.21,

    // Medžiagos: €/m² + skydelio/automatikos dalis
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

  function requiredMissing(ids) {
    return ids.filter((id) => !$(id));
  }

  function calc() {
    try {
      const required = [
        "calcForm",
        "area","rooms","baths","objectType","walls","board","lan","bundle",
        "kitchen","includeMaterials","materialsLevel","showVat",
        "totalPrice","workPrice","materialsPrice","vatHint","includedText","materialsLevelWrap"
      ];

      const missing = requiredMissing(required);
      if (missing.length) {
        showDebug("❌ Trūksta elementų su ID:\n- " + missing.join("\n- "));
        return;
      }
      hideDebug();

      const area = Number($("area").value || 0);
      const rooms = Number($("rooms").value || 0);
      const baths = Number($("baths").value || 0);
      const objectType = $("objectType").value; // new/reno
      const walls = $("walls").value;           // gipsas/blokeliai/betonas
      const board = $("board").value;           // paprastas/vidutinis/pro
      const lan = Number($("lan").value || 0);
      const bundle = $("bundle").value;         // none/safe/pros

      const kitchen = $("kitchen").checked;
      const includeMaterials = $("includeMaterials").checked;
      const materialsLevel = $("materialsLevel").value; // basic/standard/premium
      const showVat = $("showVat").checked;

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
      $("materialsLevelWrap").style.display = includeMaterials ? "block" : "none";

      const inc = includeMaterials
        ? "Įskaičiuotos darbų ir medžiagų sąnaudos pagal pasirinktą lygį (kabeliai, dėžutės, tvirtinimas, bazinis skydas/automatika)."
        : "Įskaičiuoti tik darbai. Medžiagos (kabeliai, dėžutės, automatikos komplektas) skaičiuojamos atskirai – įjunk „Įtraukti medžiagas“.";

      $("includedText").textContent =
        inc + " Neįeina: šviestuvai, rozetės/jungikliai (dizainas), LED profiliai/valdikliai, specifinė smart įranga.";
    } catch (err) {
      showDebug("❌ JS klaida:\n" + (err?.stack || err?.message || String(err)));
      console.error(err);
    }
  }

  function init() {
    const y = $("year");
    if (y) y.textContent = new Date().getFullYear();

    const form = $("calcForm");
    if (!form) {
      showDebug("❌ Nerandu formos: calcForm");
      return;
    }

    // Stabiliausia: klausom pačios formos
    form.addEventListener("input", calc, true);
    form.addEventListener("change", calc, true);

    // Papildomas saugiklis (kai kurie telefonai keistai su select/checkbox)
    form.addEventListener("click", calc, true);

    // Pirmas paskaičiavimas
    calc();
  }

  window.addEventListener("DOMContentLoaded", init);
})();

