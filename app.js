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

  function getState() {
    return {
      area: Number($("area")?.value || 0),
      rooms: Number($("rooms")?.value || 0),
      baths: Number($("baths")?.value || 0),
      objectType: $("objectType")?.value || "new",
      walls: $("walls")?.value || "gipsas",
      board: $("board")?.value || "paprastas",
      lan: Number($("lan")?.value || 0),
      bundle: $("bundle")?.value || "none",
      kitchen: !!$("kitchen")?.checked,
      includeMaterials: !!$("includeMaterials")?.checked,
      materialsLevel: $("materialsLevel")?.value || "standard",
      showVat: !!$("showVat")?.checked
    };
  }

  function calc() {
    try {
      const required = [
        "calcForm","area","rooms","baths","objectType","walls","board","lan","bundle",
        "kitchen","includeMaterials","materialsLevel","showVat",
        "totalPrice","workPrice","materialsPrice","vatHint","includedText","materialsLevelWrap",
        "quoteBtn","year"
      ];
      const missing = required.filter(id => !$(id));
      if (missing.length) {
        showDebug("❌ Trūksta elementų su ID:\n- " + missing.join("\n- "));
        return;
      }
      hideDebug();

      const s = getState();

      // WORK
      const base =
        s.area * PRICING.baseEurPerM2 *
        (PRICING.objectCoef[s.objectType] ?? 1) *
        (PRICING.wallCoef[s.walls] ?? 1);

      const complexity =
        s.rooms * PRICING.perRoom +
        s.baths * PRICING.perBath +
        (s.kitchen ? PRICING.kitchenHeavy : 0) +
        s.lan * PRICING.lanPoint;

      const boardWork = PRICING.boardWork[s.board] ?? 0;
      const bundleWork = PRICING.bundleWork[s.bundle] ?? 0;

      const workSubtotal = (base + complexity + boardWork + bundleWork) * PRICING.singleCoef;

      // MATERIALS
      let materials = 0;
      if (s.includeMaterials) {
        materials =
          s.area * (PRICING.materialsPerM2[s.materialsLevel] ?? 0) +
          (PRICING.boardMaterials[s.materialsLevel] ?? 0);
      }

      const vatCoef = s.showVat ? (1 + PRICING.vat) : 1;
      const workFinal = workSubtotal * vatCoef;
      const matFinal = materials * vatCoef;
      const total = (workSubtotal + materials) * vatCoef;

      $("workPrice").textContent = euro(workFinal);
      $("materialsPrice").textContent = s.includeMaterials ? euro(matFinal) : "0 €";
      $("totalPrice").textContent = euro(total);
      $("vatHint").textContent = s.showVat ? "Rodoma su PVM" : "Rodoma be PVM";
      $("materialsLevelWrap").style.display = s.includeMaterials ? "block" : "none";

      const inc = s.includeMaterials
        ? "Įskaičiuotos darbų ir medžiagų sąnaudos pagal pasirinktą lygį (kabeliai, dėžutės, tvirtinimas, bazinis skydas/automatika)."
        : "Įskaičiuoti tik darbai. Medžiagos skaičiuojamos atskirai – įjunk „Įtraukti medžiagas“.";

      $("includedText").textContent =
        inc + " Neįeina: šviestuvai, rozetės/jungikliai (dizainas), LED profiliai/valdikliai, specifinė smart įranga.";

      // “Gauti pasiūlymą” – mailto su užpildyta informacija
      const subject = encodeURIComponent("Užklausa: elektros darbai (preliminari sąmata)");
      const body = encodeURIComponent(
        `Sveiki,\n\nNoriu gauti pasiūlymą.\n\n` +
        `Plotas: ${s.area} m²\nKambariai: ${s.rooms}\nVonios: ${s.baths}\nObjektas: ${s.objectType}\nSienos: ${s.walls}\nSkydas: ${s.board}\nLAN/TV: ${s.lan}\nApsauga: ${s.bundle}\nVirtuvė (daug technikos): ${s.kitchen ? "Taip" : "Ne"}\n` +
        `Medžiagos: ${s.includeMaterials ? "Įtrauktos" : "Ne"}\nMedžiagų lygis: ${s.includeMaterials ? s.materialsLevel : "-"}\n` +
        `PVM: ${s.showVat ? "Su PVM" : "Be PVM"}\n\n` +
        `Preliminari suma: ${$("totalPrice").textContent}\n` +
        `Darbai: ${$("workPrice").textContent}\nMedžiagos: ${$("materialsPrice").textContent}\n\n` +
        `Kontaktai:\nVardas: \nTelefonas: \nAdresas/miestas: \nKomentaras: \n`
      );

      // Pakeisk į savo el.paštą (arba palik tuščią – tada atsidarys pasirinkimas)
      const to = ""; // pvz. "vyraisuitampa@gmail.com"
      $("quoteBtn").href = `mailto:${to}?subject=${subject}&body=${body}`;

    } catch (err) {
      showDebug("❌ JS klaida:\n" + (err?.stack || err?.message || String(err)));
      console.error(err);
    }
  }

  // Modal logika
  function initModals() {
    const openBtns = document.querySelectorAll("[data-open]");
    const modals = document.querySelectorAll(".modal");

    const open = (id) => {
      const m = $(id);
      if (!m) return;
      m.classList.add("open");
      m.setAttribute("aria-hidden", "false");
    };
    const close = (modalEl) => {
      modalEl.classList.remove("open");
      modalEl.setAttribute("aria-hidden", "true");
    };

    openBtns.forEach(btn => {
      btn.addEventListener("click", () => open(btn.getAttribute("data-open")));
    });

    modals.forEach(m => {
      m.addEventListener("click", (e) => {
        if (e.target === m) close(m);
      });
      m.querySelectorAll("[data-close]").forEach(x => {
        x.addEventListener("click", () => close(m));
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") modals.forEach(m => close(m));
    });
  }

  function init() {
    $("year").textContent = new Date().getFullYear();

    const form = $("calcForm");
    if (!form) {
      showDebug("❌ Nerandu formos: calcForm");
      return;
    }

    // Stabiliausia: klausom formos
    form.addEventListener("input", calc, true);
    form.addEventListener("change", calc, true);
    form.addEventListener("click", calc, true);

    initModals();
    calc();
  }

  window.addEventListener("DOMContentLoaded", init);
})();
