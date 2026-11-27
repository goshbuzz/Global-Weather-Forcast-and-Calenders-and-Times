# Global Weather Forecast & World Calendars

A static, SEO/AEO/GEO-optimized website with:

* **Live weather** for any city — geocoding + 7-day forecast from [Open-Meteo](https://open-meteo.com/en/docs) (no API key), WMO weather codes translated to plain language, animated conditions.
* **World calendars** side by side for any date: Gregorian, Ethiopian 13-month, Chinese (lunisolar), Hindu/Vedic pañcāṅga (tithi, nakshatra, yoga, karana, Vikram & Shaka samvat), Punjabi Desi (Bikrami) & Nanakshahi, Islamic Hijri, Hebrew, Persian Solar Hijri, Julian, Coptic/Egyptian, Mayan (Tzolkʼin, Haabʼ, Long Count).
* **Ethiopian 13-month calendar** — year view with all 13 months (12 × 30 days + Pagumē), Gregorian comparison table, and single-date converter.
* **World time zones** — live clocks and UTC offsets for every IANA time zone, plus a 33rd-parallel north city clock panel.
* **Sun, stars & horoscope** — interactive Earth–Sun orrery and night-sky model showing the Sun's apparent path through the zodiac, why the night sky changes with the seasons, leading stars, axial precession, and the 12 horoscope signs vs the 13th constellation Ophiuchus.
* **FAQ** with FAQPage structured data.

All non-Gregorian calendar conversions are approximate civil/astronomical sketches labeled as such; verify religious dates with local authorities.

## Structure
```
index.html             Home + live weather (Open-Meteo)
calendars.html         World calendar converter
ethiopian.html         Ethiopian 13-month calendar & comparison
timezones.html         World time zones & 33rd parallel
cosmos.html            Sun/Earth/stars & horoscope visualization
faq.html               FAQ (FAQPage schema)
css/style.css          Design system & layout
js/astro.js            Astronomical approximations (Sun/Moon, terms, new moons)
js/calendar-engine.js  Calendar conversions for ~12 systems
js/weather.js          Open-Meteo geocoding + forecast
js/timezones.js        IANA time zones & 33rd parallel clocks
js/cosmos.js           Interactive orrery & night sky
js/ui.js               Shared navigation
sitemap.xml / robots.txt / manifest.json
```

Deploy: static hosting (GitHub Pages / Vercel). No build step, no backend, no API key required for the demo (weather is fetched client-side from Open-Meteo).
