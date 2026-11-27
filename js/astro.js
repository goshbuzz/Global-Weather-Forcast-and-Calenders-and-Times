/* ==========================================================================
   Astronomical core (approximate, for display/educational purposes)
   Implements: Julian Day, Sun/Moon longitude approximations, solar terms,
   lunation (new/full moon) iteration.
   Accuracy: within ~1-2 degrees — good enough for calendar sketches,
   NOT for religious/civil date determination. Always verify with local
   religious/civil authorities.
   ========================================================================== */

const Astro = (() => {
  // Julian Day Number at noon for a Gregorian date (Meeus formula)
  function toJD(year, month, day) {
    let y = year, m = month;
    if (m <= 2) { y -= 1; m += 12; }
    const a = Math.floor(y / 100);
    const b = 2 - a + Math.floor(a / 4);
    const jd = Math.floor(365.25 * (y + 4716)) +
               Math.floor(30.6001 * (m + 1)) +
               day + b - 1524.5;
    return jd;
  }

  function jdToGregorian(jd) {
    const z = Math.floor(jd + 0.5);
    const f = (jd + 0.5) - z;
    let a = z;
    if (z >= 2299161) {
      const alpha = Math.floor((z - 1867216.25) / 36524.25);
      a = z + 1 + alpha - Math.floor(alpha / 4);
    }
    const b = a + 1524;
    const c = Math.floor((b - 122.1) / 365.25);
    const d = Math.floor(365.25 * c);
    const e = Math.floor((b - d) / 30.6001);
    const day = b - d - Math.floor(30.6001 * e) + f;
    let month = e < 14 ? e - 1 : e - 13;
    let year = month > 2 ? c - 4716 : c - 4715;
    return { year, month, day: Math.floor(day), frac: day - Math.floor(day) };
  }

  // Degrees -> radians and back
  const DEG = Math.PI / 180;

  // Mean elements at J2000 epoch (JD 2451545.0)
  // Sun longitude approximation (Meeus, truncated)
  function sunLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0; // centuries
    const L = (280.46645 + 36000.76983 * T + 0.0003032 * T * T) % 360;
    const g = (357.52910 + 35999.05030 * T - 0.0001559 * T * T - 0.00000048 * T * T * T) % 360; // mean anomaly
    const c = (1.914600 - 0.004817 * T - 0.000014 * T * T) * Math.sin(g * DEG) +
              (0.019993 - 0.000101 * T) * Math.sin(2 * g * DEG) +
              0.000290 * Math.sin(3 * g * DEG);
    const longitude = (L + c) % 360;
    return longitude < 0 ? longitude + 360 : longitude;
  }

  // Moon longitude approximation (Meeus Ch. 47, truncated)
  function moonLongitude(jd) {
    const T = (jd - 2451545.0) / 36525.0;
    const L = (218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841 - T * T * T * T / 65194000) % 360;
    const M = (134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000) % 360;
    const Md = (357.5291092 + 35999.0502909 * T - 0.0001536 * T * T - T * T * T / 24490000) % 360;
    const F = (93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - T * T * T / 3526000 + T * T * T * T / 863310000) % 360;
    const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + T * T * T / 545868 - T * T * T * T / 113065000) % 360;

    const rad = (a) => ((a % 360) + 360) % 360 * DEG;
    let lon = L
      + 6.288750 * Math.sin(rad(Md))
      + 1.274018 * Math.sin(rad(2 * D - Md))
      + 0.658309 * Math.sin(rad(2 * D))
      + 0.213616 * Math.sin(rad(2 * Md))
      - 0.185596 * Math.sin(rad(Md))
      - 0.114336 * Math.sin(rad(2 * F));
    lon = ((lon % 360) + 360) % 360;
    return lon;
  }

  // Anchor: 2024-02-09 22:27 UTC new moon (approximate)
  const SYNODIC_MONTH = 29.530588853;
  let NM_ANCHOR = null;

  // Find date of (approx) new moon nearest to a target JD.
  function newMoonNear(jdGuess) {
    if (NM_ANCHOR === null) NM_ANCHOR = Astro.toJD(2024, 2, 9) + (22 + 27 / 60 - 12) / 24;
    let jd = NM_ANCHOR + Math.round((jdGuess - NM_ANCHOR) / SYNODIC_MONTH) * SYNODIC_MONTH;
    for (let i = 0; i < 25; i++) {
      const E = moonLongitude(jd) - sunLongitude(jd); // raw, near 360*k at new moon
      const k = Math.round(E / 360);
      const err = E - 360 * k;
      if (Math.abs(err) < 0.005) break;
      jd -= err / 12.19; // ~degrees per day relative speed
    }
    return jd;
  }

  // Solar term longitudes: 0 = vernal equinox, then every 15 deg
  const SOLAR_TERMS = [
    "Spring begins", "Rain water", "Insects awaken", "Spring equinox",
    "Pure brightness", "Grain rain", "Summer begins", "Grain buds",
    "Grain in ear", "Summer solstice", "Slight heat", "Great heat",
    "Autumn begins", "Limit of heat", "White dew", "Autumn equinox",
    "Cold dew", "Frost descends", "Winter begins", "Light snow",
    "Heavy snow", "Winter solstice", "Slight cold", "Great cold"
  ];

  function solarTermJD(targetLon, year) {
    // find JD when sun longitude crosses targetLon near given year
    const start = toJD(year, 1, 1);
    let jd = start;
    for (let d = 0; d < 400; d++) {
      const lon = sunLongitude(jd);
      const a1 = ((lon - targetLon + 540) % 360) - 180;
      const jd2 = jd + 1;
      const lon2 = sunLongitude(jd2);
      const a2 = ((lon2 - targetLon + 540) % 360) - 180;
      if (a1 * a2 <= 0 && Math.abs(a1 - a2) < 40) {
        // linear refine
        return jd - a1 / (a2 - a1);
      }
      jd = jd2;
    }
    return jd;
  }

  function normalizeAngle(a) { return ((a % 360) + 360) % 360; }

  return { toJD, jdToGregorian, sunLongitude, moonLongitude, newMoonNear, solarTermJD, normalizeAngle, SOLAR_TERMS, DEG };
})();

// Export for browsers without modules
if (typeof window !== "undefined") window.Astro = Astro;
