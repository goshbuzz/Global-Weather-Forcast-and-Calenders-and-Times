/* ==========================================================================
   Weather — Open-Meteo (no API key required)
   Docs: https://open-meteo.com/en/docs
   ========================================================================== */

const WEATHER_CODES = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Fog", 48: "Depositing rime fog",
  51: "Light drizzle", 53: "Moderate drizzle", 55: "Dense drizzle",
  56: "Light freezing drizzle", 57: "Dense freezing drizzle",
  61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  66: "Light freezing rain", 67: "Heavy freezing rain",
  71: "Slight snowfall", 73: "Moderate snowfall", 75: "Heavy snowfall", 77: "Snow grains",
  80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  85: "Slight snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with slight hail", 97: "Heavy thunderstorm", 99: "Thunderstorm with heavy hail"
};

function weatherIcon(code) {
  const map = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌧️", 53: "🌧️", 55: "🌧️", 56: "🌧️", 57: "🌧️",
    61: "🌧️", 63: "🌧️", 65: "🌧️", 66: "🌨️", 67: "🌨️",
    71: "🌨️", 73: "🌨️", 75: "🌨️", 77: "🌨️",
    80: "🌦️", 81: "🌦️", 82: "🌦️", 85: "🌨️", 86: "🌨️",
    95: "⛈️", 96: "⛈️", 97: "⛈️", 99: "⛈️"
  };
  return map[code] || "🌡️";
}

function effectClass(code) {
  if ([61,63,65,66,67,80,81,82].includes(code)) return "rain";
  if ([71,73,75,77,85,86].includes(code)) return "snow";
  if ([45,48].includes(code)) return "fog";
  if ([95,96,97,99].includes(code)) return "storm";
  return "";
}

const WeatherAPI = {
  BASE: "https://geocoding-api.open-meteo.com/v1/search",
  FORECAST: "https://api.open-meteo.com/v1/forecast",

  async searchCities(query) {
    const url = `${this.BASE}?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocoding request failed");
    const data = await res.json();
    return data.results || [];
  },

  async getForecast(lat, lon) {
    const url =
      `${this.FORECAST}?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,precipitation` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,daylight_duration` +
      `&hourly=temperature_2m,weather_code,precipitation_probability,wind_speed_10m` +
      `&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Forecast request failed");
    return res.json();
  }
};

function isDayTime(currentTime, sunrise, sunset) {
  return currentTime >= sunrise && currentTime <= sunset;
}

const WeatherUI = {
  container: null,
  searchInput: null,
  searchBtn: null,
  resultsBox: null,

  init({ container, searchInput, searchBtn, resultsBox }) {
    this.container = container;
    this.searchInput = searchInput;
    this.searchBtn = searchBtn;
    this.resultsBox = resultsBox;
    this.bind();
  },

  bind() {
    this.searchBtn.addEventListener("click", () => this.search(this.searchInput.value));
    this.searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.search(this.searchInput.value);
    });
    this.searchInput.addEventListener("input", () => {
      clearTimeout(this._timer);
      this._timer = setTimeout(() => {
        if (this.searchInput.value.length > 2) this.showSuggestions(this.searchInput.value);
      }, 300);
    });
  },

  async showSuggestions(q) {
    try {
      const cities = await WeatherAPI.searchCities(q);
      this.resultsBox.innerHTML = "";
      this.resultsBox.style.display = cities.length ? "block" : "none";
      cities.slice(0, 8).forEach(c => {
        const div = document.createElement("div");
        div.className = "city-suggestion";
        div.innerHTML = `<strong>${c.name}</strong><span class="muted" style="font-size:0.75rem">${c.country}, ${c.admin1 || ""}</span> (${c.latitude.toFixed(3)}, ${c.longitude.toFixed(3)})`;
        div.onclick = () => {
          this.searchInput.value = c.name;
          this.resultsBox.style.display = "none";
          this.load(c.latitude, c.longitude, c.name);
        };
        this.resultsBox.appendChild(div);
      });
    } catch (e) {
      this.resultsBox.style.display = "none";
    }
  },

  async search(q) {
    if (!q.trim()) return;
    this.container.innerHTML = this.loadingHTML();
    try {
      const cities = await WeatherAPI.searchCities(q);
      if (!cities.length) throw new Error("City not found");
      const c = cities[0];
      this.load(c.latitude, c.longitude, c.name);
    } catch (e) {
      this.container.innerHTML = this.errorHTML(e.message);
    }
  },

  async load(lat, lon, name) {
    this.container.innerHTML = this.loadingHTML();
    try {
      const data = await WeatherAPI.getForecast(lat, lon);
      this.render(data, name);
    } catch (e) {
      this.container.innerHTML = this.errorHTML(e.message);
    }
  },

  loadingHTML() {
    return `<div class="panel text-center" style="padding:3rem"><div style="font-size:2rem;display:block;margin-bottom:0.5rem">🔄</div><p class="muted">Fetching weather from Open-Meteo…</p></div>`;
  },
  errorHTML(msg) {
    return `<div class="panel text-center" style="padding:3rem"><div style="font-size:2rem;display:block;margin-bottom:0.5rem">⚠️</div><p class="muted">${escapeHtml(msg)}</p></div>`;
  },

  render(data, name) {
    const cur = data.current;
    const daily = data.daily;
    const timeStr = cur.time;
    const sunrise = daily.sunrise[0]?.substring(11, 16) || "";
    const sunset = daily.sunset[0]?.substring(11, 16) || "";
    const daytime = isDayTime(timeStr.substring(11, 16), sunrise, sunset);
    const code = cur.weather_code;
    const effect = effectClass(code);

    let html = `
    <div class="weather-header">
      <div class="city-info">
        <div class="city-badge">📍 ${escapeHtml(name)}</div>
        <div class="city-map">Lat ${data.latitude.toFixed(3)} · Lon ${data.longitude.toFixed(3)} · ${data.timezone}</div>
      </div>
      <div style="margin-left:auto;text-align:right;">
        <div class="muted" style="font-size:0.85rem">${new Date(timeStr).toLocaleString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        <div class="muted" style="font-size:0.85rem">${timeStr.substring(11, 16)} ${daytime ? "☀️" : "🌙"}</div>
      </div>
    </div>

    <div class="current-card ${daytime ? "" : "is-night"}">
      <div class="temp-wrap">
        <div class="icon" style="position:relative">${weatherIcon(code)}</div>
        <div class="temp-wrap-inner">
          <div class="condition">${WEATHER_CODES[code] || "Unknown"}</div>
          <div class="temp">${Math.round(cur.temperature_2m)}<span>°C</span></div>
          <div class="detail">
            <span>Feels ${Math.round(cur.apparent_temperature)}°C</span>
            <span>•</span>
            <span>Humidity ${cur.relative_humidity_2m}%</span>
            <span>•</span>
            <span>Wind ${cur.wind_speed_10m} km/h</span>
          </div>
        </div>
      </div>
      <div class="${effect}-layer" id="weather-effect"></div>
      ${effect === "storm" ? `<div class="storm-flash"></div>` : ""}
    </div>

    <div class="weather-meta">
      <div class="meta-item"><div class="label">High</div><div class="value">${Math.round(daily.temperature_2m_max[0])}°C</div></div>
      <div class="meta-item"><div class="label">Low</div><div class="value">${Math.round(daily.temperature_2m_min[0])}°C</div></div>
      <div class="meta-item"><div class="label">Rain chance</div><div class="value">${daily.precipitation_probability_max[0]}%</div></div>
      <div class="meta-item"><div class="label">Sunrise</div><div class="value">${sunrise}</div></div>
      <div class="meta-item"><div class="label">Sunset</div><div class="value">${sunset}</div></div>
      <div class="meta-item"><div class="label">Daylight</div><div class="value">${Math.round(daily.daylight_duration[0] / 3600)} h</div></div>
    </div>

    <div style="margin-top:1rem"><strong style="font-size:0.9rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--muted);display:block;margin-bottom:0.75rem">7-day forecast</strong>
      <div class="forecast-list">${daily.time.slice(0, 7).map((t, i) => {
        const date = new Date(t + "T00:00:00");
        const wc = daily.weather_code[i];
        return `<div class="day-card">
          <div class="day-name">${date.toLocaleDateString(undefined, { weekday: "short" })}</div>
          <span class="icon">${weatherIcon(wc)}</span>
          <div class="temps">${Math.round(daily.temperature_2m_max[i])}° <span class="lo">${Math.round(daily.temperature_2m_min[i])}°</span></div>
          <div style="font-size:0.7rem;color:var(--muted);margin-top:0.25rem">${daily.precipitation_probability_max[i]}% rain</div>
        </div>`;
      }).join("")}
      </div>
    </div>
    `;
    this.container.innerHTML = html;
    this.injectEffect(effect);
  },

  injectEffect(effect) {
    const layer = document.getElementById("weather-effect");
    if (!layer) return;
    const count = effect === "rain" ? 24 : effect === "snow" ? 18 : effect === "fog" ? 3 : 0;
    const base = effect === "rain" || effect === "snow" ? 0.6 : 8;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = effect === "rain" ? "rain-drop" : effect === "snow" ? "snow-flake" : "fog-band";
      el.style.left = Math.random() * 100 + "%";
      el.style.animationDuration = (base + Math.random() * 1.2) + "s";
      el.style.animationDelay = Math.random() * 2 + "s";
      el.style.opacity = 0.4 + Math.random() * 0.6;
      layer.appendChild(el);
    }
  }
};

function escapeHtml(t) {
  return String(t).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

if (typeof window !== "undefined") {
  window.WEATHER_CODES = WEATHER_CODES;
  window.WeatherAPI = WeatherAPI;
  window.WeatherUI = WeatherUI;
}
