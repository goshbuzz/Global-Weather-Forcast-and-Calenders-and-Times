/* ==========================================================================
   World Time Zones (IANA via Intl API)
   ========================================================================== */

const TimeZoneUI = {
  tableBody: null,
  searchInput: null,
  allZones: [],

  init({ tableBody, searchInput }) {
    this.tableBody = tableBody;
    this.searchInput = searchInput;
    try {
      this.allZones = Intl.supportedValuesOf("timeZone");
    } catch (e) {
      this.allZones = DEFAULT_ZONES.slice();
    }
    this.bind();
    this.render(this.allZones);
    this.startLiveClock();
  },

  bind() {
    this.searchInput.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      this.render(this.allZones.filter(z => z.toLowerCase().includes(q)));
    });
  },

  render(zones) {
    const now = new Date();
    const rows = zones.map(zone => {
      try {
        const fmt = new Intl.DateTimeFormat("en-US", {
          timeZone: zone, hour12: false,
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit", second: "2-digit"
        });
        const parts = fmt.formatToParts(now);
        const get = (type) => parts.find(p => p.type === type).value;
        const offsetFmt = new Intl.DateTimeFormat("en-US", {
          timeZone: zone, timeZoneName: "shortOffset"
        });
        const offset = offsetFmt.formatToParts(now).find(p => p.type === "timeZoneName").value;
        const isDST = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "long" })
          .formatToParts(now).find(p => p.type === "timeZoneName").value.includes("Daylight");
        return `<tr>
          <td><span class="zone-name">${escapeHtml(zone)}</span><br><span class="region-tag">${regionOf(zone)}</span></td>
          <td><span class="tz-time">${get("hour")}:${get("minute")}:${get("second")}</span><br><span style="font-size:0.75rem;color:var(--muted)">${get("month")}/${get("day")}/${get("year")}</span></td>
          <td><span class="tz-offset">${offset} ${isDST ? "· DST" : ""}</span></td>
        </tr>`;
      } catch (e) { return ""; }
    }).join("");
    this.tableBody.innerHTML = rows;
  },

  startLiveClock() {
    setInterval(() => this.render(this.allZones.filter(z =>
      z.toLowerCase().includes(this.searchInput.value.toLowerCase()))), 1000);
  }
};

const PARALLEL_33_CITIES = [
  { city: "Casablanca", country: "Morocco", zone: "Africa/Casablanca" },
  { city: "Algiers", country: "Algeria", zone: "Africa/Algiers" },
  { city: "Tunis", country: "Tunisia", zone: "Africa/Tunis" },
  { city: "Beirut", country: "Lebanon", zone: "Asia/Beirut" },
  { city: "Damascus", country: "Syria", zone: "Asia/Damascus" },
  { city: "Amman", country: "Jordan", zone: "Asia/Amman" },
  { city: "Baghdad", country: "Iraq", zone: "Asia/Baghdad" },
  { city: "Kuwait City", country: "Kuwait", zone: "Asia/Kuwait" },
  { city: "Phoenix", country: "USA (Arizona)", zone: "America/Phoenix" },
  { city: "San Diego", country: "USA (California)", zone: "America/Los_Angeles" },
  { city: "Dallas", country: "USA (Texas)", zone: "America/Chicago" },
  { city: "Atlanta", country: "USA (Georgia)", zone: "America/New_York" },
  { city: "Charleston", country: "USA (South Carolina)", zone: "America/New_York" },
  { city: "Nagasaki", country: "Japan", zone: "Asia/Tokyo" }
];

function TimeZone33UI(container) {
  this.container = container;
}
TimeZone33UI.prototype.render = async function () {
  const now = new Date();
  const rows = PARALLEL_33_CITIES.map(c => {
    try {
      const fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: c.zone, hour12: false,
        hour: "2-digit", minute: "2-digit"
      });
      const time = fmt.format(now);
      return `<tr><td><strong>${escapeHtml(c.city)}</strong><br><span class="muted" style="font-size:0.8rem">${escapeHtml(c.country)}</span></td>
        <td class="tz-time">${time}</span></td>
        <td class="muted">${c.zone}</td></tr>`;
    } catch (e) { return ""; }
  }).join("");
  this.container.innerHTML = `
    <h3 style="font-size:1.25rem;margin-bottom:0.5rem">33rd Parallel North — live clock at cities along the line</h3>
    <p class="muted" style="margin-bottom:1rem">The 33rd parallel north is a circle of latitude 33° above the equator. It passes through Morocco, Algeria, Tunisia, Lebanon, Syria, Jordan, Iraq, Iran, Afghanistan, Pakistan, India, China, Japan, and the southern United States. Cities on or very near the line share the same solar geometry — shown here as live local times.</p>
    <div class="tz-table-wrap" style="margin-top:0"><table class="tz-table">
      <thead><tr><th style="width:40%">City</th><th>Local time</th><th>IANA zone</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <div class="disclaimer" style="margin-top:1rem">
      <strong>Flat-earth note.</strong> Some communities discuss the 33rd parallel (and time zones generally) within flat-earth frameworks. Mainstream geography describes Earth as a globe: time zones exist because a rotating spherical Earth is illuminated by the Sun on only one side at a time, so local noon arrives at different longitudes at different moments. This site shows both the live times and the mainstream explanation so readers can compare perspectives.
    </div>
  `;
};

const DEFAULT_ZONES = [
  "Africa/Casablanca","Africa/Johannesburg","Africa/Nairobi",
  "Asia/Dubai","Asia/Karachi","Asia/Kolkata","Asia/Dhaka","Asia/Bangkok",
  "Asia/Singapore","Asia/Hong_Kong","Asia/Tokyo","Asia/Seoul",
  "Asia/Baghdad","Asia/Tehran","Asia/Jerusalem",
  "Europe/London","Europe/Berlin","Europe/Moscow","Europe/Paris","Europe/Istanbul",
  "America/New_York","America/Chicago","America/Denver","America/Phoenix",
  "America/Los_Angeles","America/Toronto","America/Sao_Paulo","America/Mexico_City",
  "Australia/Sydney","Australia/Melbourne","Pacific/Auckland","Pacific/Honolulu",
  "UTC"
];

function regionOf(zone) {
  const map = { Africa: "Africa", Asia: "Asia", Europe: "Europe", America: "Americas", Australia: "Oceania", Pacific: "Pacific", UTC: "Coordinated" };
  for (const k of Object.keys(map)) if (zone.startsWith(k)) return map[k];
  return "World";
}

function escapeHtml(t) {
  return String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

if (typeof window !== "undefined") window.TimeZoneUI = TimeZoneUI;
if (typeof window !== "undefined") window.TimeZone33UI = TimeZone33UI;
