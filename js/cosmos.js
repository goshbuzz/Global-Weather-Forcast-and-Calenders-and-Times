/* ==========================================================================
   Cosmos — Earth's motion, the Sun's apparent path through the zodiac,
   and the changing night sky with horoscope / leading stars.
   Educational visualization (not an accurate orrery).
   ========================================================================== */

const ZODIAC = [
  { name: "Aries", symbol: "♈", dates: "Mar 21 – Apr 19", lon: 0,   element: "fire" },
  { name: "Taurus", symbol: "♉", dates: "Apr 20 – May 20", lon: 30,  element: "earth" },
  { name: "Gemini", symbol: "♊", dates: "May 21 – Jun 20", lon: 60,  element: "air" },
  { name: "Cancer", symbol: "♋", dates: "Jun 21 – Jul 22", lon: 90,  element: "water" },
  { name: "Leo", symbol: "♌", dates: "Jul 23 – Aug 22", lon: 120, element: "fire" },
  { name: "Virgo", symbol: "♍", dates: "Aug 23 – Sep 22", lon: 150, element: "earth" },
  { name: "Libra", symbol: "♎", dates: "Sep 23 – Oct 22", lon: 180, element: "air" },
  { name: "Scorpio", symbol: "♏", dates: "Oct 23 – Nov 21", lon: 210, element: "water" },
  { name: "Sagittarius", symbol: "♐", dates: "Nov 22 – Dec 21", lon: 240, element: "fire" },
  { name: "Capricorn", symbol: "♑", dates: "Dec 22 – Jan 19", lon: 270, element: "earth" },
  { name: "Aquarius", symbol: "♒", dates: "Jan 20 – Feb 18", lon: 300, element: "air" },
  { name: "Pisces", symbol: "♓", dates: "Feb 19 – Mar 20", lon: 330, element: "water" }
];
const OPHIUCHUS = { name: "Ophiuchus (13th constellation)", symbol: "⛎", dates: "Sun ~Nov 29 – Dec 17", lon: 240 };

const LEADING_STARS = [
  { name: "Sirius", constellation: "Canis Major", note: "Brightest night star; its heliacal rising once marked the Egyptian New Year and Nile flood." },
  { name: "Vega", constellation: "Lyra", note: "Northern pole star about 12,000 years ago, and again in the far future (axial precession)." },
  { name: "Polaris", constellation: "Ursa Minor", note: "Current northern pole star — sits almost above Earth's North Pole." },
  { name: "Arcturus", constellation: "Boötes", note: "Brilliant orange giant, easy to find by following the Big Dipper's handle." },
  { name: "Spica", constellation: "Virgo", note: "Lies very close to the ecliptic — the Moon and planets often pass near it." },
  { name: "Antares", constellation: "Scorpius", note: "Rival of Mars; a red supergiant in the heart of the Scorpion." },
  { name: "Aldebaran", constellation: "Taurus", note: "The follower of the Pleiades; marks the Bull's eye." },
  { name: "Regulus", constellation: "Leo", note: "The little king; lies almost exactly on the ecliptic." },
  { name: "Pollux", constellation: "Gemini", note: "One of the celestial Twins; brighter than nearby Castor." },
  { name: "Fomalhaut", constellation: "Piscis Austrinus", note: "Lonely bright star of autumn skies in the Southern Fish." },
  { name: "Rigel", constellation: "Orion", note: "Blue supergiant at Orion's foot." },
  { name: "Betelgeuse", constellation: "Orion", note: "Red supergiant at Orion's shoulder." },
  { name: "Canopus", constellation: "Carina", note: "Second-brightest star in the night sky." },
  { name: "Altair", constellation: "Aquila", note: "Part of the Summer Triangle with Vega and Deneb." },
  { name: "Deneb", constellation: "Cygnus", note: "Tail of the Swan; one of the most luminous stars known." }
];

const Cosmos = (() => {
  let state = {
    dayOfYear: Math.floor(((new Date()) - new Date(new Date().getFullYear(), 0, 0)) / 86400000),
    playing: true, speed: 1,
    view: "orrery" // orrery | sky
  };

  const els = {};
  let rafId;

  function dayOfYearFromDate(iso) {
    const d = new Date(iso + "T12:00:00");
    const start = new Date(d.getFullYear(), 0, 0);
    return Math.floor((d - start) / 86400000);
  }

  function init(elements) {
    Object.assign(els, elements);
    state.dayOfYear = dayOfYearFromDate(els.dateInput.value);
    els.dateInput.min = "1900-01-01";
    els.dateInput.max = "2100-12-31";

    els.dateInput.addEventListener("input", (e) => {
      state.dayOfYear = dayOfYearFromDate(e.target.value);
      render();
    });
    els.playBtn.addEventListener("click", () => { state.playing = !state.playing; els.playBtn.textContent = state.playing ? "⏸ Pause" : "▶ Play"; });
    els.speedInput.addEventListener("input", (e) => { state.speed = parseFloat(e.target.value) || 0; });
    els.viewBtns.forEach(b => b.addEventListener("click", () => {
      state.view = b.dataset.view;
      els.viewBtns.forEach(x => x.classList.toggle("active", x === b));
      render();
    }));
    render();
    animate();
  }

  function sunLon() {
    // Apparent ecliptic longitude of the Sun = opposite Earth's position
    return (state.dayOfYear / 365.25) * 360 + 180;
  }

  function earthAngle() {
    return (state.dayOfYear / 365.25) * 360;
  }

  function moonPhase() {
    // approximate illuminated fraction from date (synodic month 29.53 days, anchored known new moon 2024-01-11)
    const anchor = new Date("2024-01-11T11:57:00Z").getTime();
    const days = (Date.now() - anchor) / 86400000;
    const phase = ((days % 29.53) + 29.53) % 29.53;
    return phase / 29.53; // 0 = new, 0.5 = full
  }

  function drawOrrery(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    const rOrbit = Math.min(w, h) * 0.42;

    // Star field background
    ctx.fillStyle = "#04060d";
    ctx.fillRect(0, 0, w, h);
    const stars = [];
    for (let i = 0; i < 120; i++) stars.push({ x: Math.random() * w, y: Math.random() * h, s: Math.random() * 1.2 + 0.3, o: Math.random() });
    ctx.fillStyle = "#ffffff";
    stars.forEach(s => { ctx.globalAlpha = s.o; ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill(); });
    ctx.globalAlpha = 1;

    // Ecliptic / zodiac ring
    ctx.beginPath();
    ctx.arc(cx, cy, rOrbit, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ZODIAC.forEach((z, i) => {
      const a = (z.lon / 360) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * (rOrbit + 34);
      const y = cy + Math.sin(a) * (rOrbit + 34);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = i === signIndex() ? "#fbbf24" : "#94a3b8";
      ctx.font = "bold 14px ui-sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(z.symbol, 0, 0);
      ctx.restore();
    });
    // Ophiuchus note on ring
    {
      const a = (OPHIUCHUS.lon / 360) * Math.PI * 2 - Math.PI / 2;
      const x = cx + Math.cos(a) * (rOrbit + 34);
      const y = cy + Math.sin(a) * (rOrbit + 34);
      ctx.fillStyle = "#a78bfa";
      ctx.font = "11px ui-sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⛎", x, y);
    }

    // Sun at center (glow)
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34);
    grad.addColorStop(0, "#fde047");
    grad.addColorStop(0.45, "#fbbf24");
    grad.addColorStop(1, "rgba(251,191,36,0)");
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(cx, cy, 34, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fillStyle = "#fee265"; ctx.fill();

    // Sun's apparent label
    const sa = (sunLon() / 360) * Math.PI * 2 - Math.PI / 2;
    const sx = cx + Math.cos(sa) * 22;
    const sy = cy + Math.sin(sa) * 22;
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px ui-sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Sun (apparent)", sx, sy - 26);

    // Earth orbit position
    const ea = earthAngle() * Math.PI / 180 - Math.PI / 2;
    const ex = cx + Math.cos(ea) * rOrbit;
    const ey = cy + Math.sin(ea) * rOrbit;

    // Earth: day/night terminator based on sun direction
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate((Date.now() / 200) * Math.PI / 180); // spin animation (illustrative)
    const er = 13;
    ctx.beginPath(); ctx.arc(0, 0, er, 0, Math.PI * 2); ctx.fillStyle = "#22d3ee"; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, er, 0, Math.PI * 2); ctx.clip();
    const sunDir = earthAngle() * Math.PI / 180 + Math.PI; // from earth to sun
    ctx.fillStyle = "rgba(15,21,38,0.75)";
    ctx.beginPath();
    ctx.arc(0, 0, er, sunDir - Math.PI / 2, sunDir + Math.PI / 2, true);
    ctx.lineTo(0, 0);
    ctx.fill();
    ctx.restore();

    // Earth axis tilt indicator (fixed direction in space)
    ctx.beginPath();
    ctx.moveTo(ex + Math.cos(-0.42) * 26, ey + Math.sin(-0.42) * 26);
    ctx.lineTo(ex - Math.cos(-0.42) * 26, ey - Math.sin(-0.42) * 26);
    ctx.strokeStyle = "rgba(167,139,250,0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Moon around Earth
    const phase = moonPhase();
    const ma = (state.dayOfYear / 29.53) * Math.PI * 2;
    const mx = ex + Math.cos(ma) * 24;
    const my = ey + Math.sin(ma) * 24;
    ctx.beginPath(); ctx.arc(mx, my, 4.5, 0, Math.PI * 2); ctx.fillStyle = "#cbd5e1"; ctx.fill();
    // moon terminator (phase)
    ctx.save(); ctx.translate(mx, my);
    ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, 0); ctx.fill();
    ctx.restore();

    // Connect sun-earth line
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(ex, ey);
    ctx.strokeStyle = "rgba(251,191,36,0.15)"; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = "#f5f7fa"; ctx.font = "12px ui-sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Earth", ex, ey - 20);
    ctx.fillText("Axis tilt 23.5° (fixed in space)", cx, h - 26);
  }

  function signIndex() {
    const sl = sunLon() % 360;
    return ZODIAC.findIndex(z => sl >= z.lon && sl < z.lon + 30);
  }

  function drawSky(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    const sl = sunLon();
    ctx.fillStyle = "#04060d";
    ctx.fillRect(0, 0, w, h);
    // horizon glow at sun direction (hidden part of sky)
    const sunScreen = angleToScreen(sl - sl, 0); // sun at edge
    // Draw stars: anti-sun point at center
    for (let i = 0; i < 150; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * (Math.min(w, h) * 0.38);
      ctx.fillStyle = "rgba(255,255,255," + (0.25 + Math.random() * 0.5) + ")";
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0.8, 0, Math.PI * 2); ctx.fill();
    }

    // Zodiac constellations on the ecliptic circle around the sky
    const R = Math.min(w, h) * 0.42;
    ZODIAC.forEach(z => {
      const delta = normalizeAngle(z.lon - sl); // -180..180 ; 180 = opposite sun = midnight center
      const visible = Math.abs(delta) > 75;
      const rr = R * (1 - Math.abs(delta) / 180);
      const da = (delta / 180) * Math.PI;
      const x = cx + Math.cos(da) * rr;
      const y = cy + Math.sin(da) * rr;
      ctx.beginPath(); ctx.arc(x, y, visible ? 4.5 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = visible ? "#22d3ee" : "rgba(34,211,238,0.25)";
      ctx.fill();
      if (visible) {
        ctx.fillStyle = "#fbbf24"; ctx.font = "bold 11px ui-sans-serif"; ctx.textAlign = "center";
        ctx.fillText(z.symbol, x, y - 8);
      }
    });
    // Ophiuchus
    {
      const delta = normalizeAngle(OPHIUCHUS.lon - sl);
      const da = (delta / 180) * Math.PI;
      const rr = R * (1 - Math.abs(delta) / 180);
      const x = cx + Math.cos(da) * rr; const y = cy + Math.sin(da) * rr;
      ctx.fillStyle = "#a78bfa";
      ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#c4b5fd"; ctx.font = "10px ui-sans-serif"; ctx.textAlign = "center";
      ctx.fillText("⛎", x, y - 8);
    }

    // Bright leading stars (indicative sky positions)
    const starPositions = {
      "Sirius": 100, "Vega": 280, "Polaris": 90, "Arcturus": 200, "Spica": 200,
      "Antares": 240, "Aldebaran": 60, "Regulus": 135, "Pollux": 105, "Fomalhaut": 330,
      "Rigel": 95, "Betelgeuse": 90, "Canopus": 110, "Altair": 310, "Deneb": 300
    };
    LEADING_STARS.forEach(s => {
      const slon = starPositions[s.name] || 0;
      const delta = normalizeAngle(slon - sl);
      if (Math.abs(delta) < 85) return; // near/above horizon hidden or too low
      const da = (delta / 180) * Math.PI;
      const rr = R * (1 - Math.abs(delta) / 180) * 0.9;
      const x = cx + Math.cos(da) * rr; const y = cy + Math.sin(da) * rr;
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#94a3b8"; ctx.font = "10px ui-sans-serif"; ctx.textAlign = "center";
      ctx.fillText(s.name.split(" ")[0], x, y - 7);
    });

    // Center = midnight (opposite the Sun)
    ctx.fillStyle = "rgba(34,211,238,0.35)";
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#22d3ee"; ctx.font = "bold 11px ui-sans-serif"; ctx.textAlign = "center";
    ctx.fillText("Midnight sky (opposite the Sun)", cx, cy - 16);
    ctx.fillStyle = "#fbbf24"; ctx.font = "10px ui-sans-serif";
    ctx.fillText("Sun direction (hidden by daylight)", cx + Math.cos(0) * (R * 0.72), cy + Math.sin(0) * (R * 0.72) - 8);
  }

  function normalizeAngle(a) { return (((a % 360) + 540) % 360) - 180; }

  function render() {
    if (els.orreryCanvas) drawOrrery(els.orreryCanvas.getContext("2d"), els.orreryCanvas.width, els.orreryCanvas.height);
    if (els.skyCanvas) drawSky(els.skyCanvas.getContext("2d"), els.skyCanvas.width, els.skyCanvas.height);

    const z = ZODIAC[signIndex()];
    if (els.sunSign) {
      els.sunSign.innerHTML = `<span style="font-size:1.5rem">${z.symbol}</span> <strong>${z.name}</strong> — the Sun is in ${z.name} (${z.dates})`;
    }
    if (els.dayLabel) {
      els.dayLabel.textContent = new Date(els.dateInput.value + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    }
  }

  function animate() {
    if (state.playing && state.speed > 0) {
      state.dayOfYear = (state.dayOfYear + 0.15 * state.speed) % 365.25;
      els.dateInput.value = new Date(new Date().getFullYear(), 0, Math.floor(state.dayOfYear) + 1).toISOString().slice(0, 10);
      render();
    }
    rafId = requestAnimationFrame(animate);
  }

  function destroy() { if (rafId) cancelAnimationFrame(rafId); }

  return { init, destroy, ZODIAC, OPHIUCHUS, LEADING_STARS, setDay: d => { state.dayOfYear = d; render(); } };
})();

if (typeof window !== "undefined") window.Cosmos = Cosmos;
