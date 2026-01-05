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
  co
