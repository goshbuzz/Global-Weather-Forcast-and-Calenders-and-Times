/* ==========================================================================
   World Calendar Engine
   Conversions: Gregorian <-> Ethiopian, Chinese (approx), Hindu/Vedic (approx),
   Punjabi Desi & Nanakshahi, Hijri (arithmetic approx), Hebrew (approx),
   Persian/Solar Hijri (approx), Julian, Coptic/Egyptian, Mayan (Tzolkin/Haab/Long Count).
   All non-Gregorian conversions are approximate civil/astronomical sketches
   and labelled "approximate". For religious or legal dates, consult local
   religious/civil authorities.
   ========================================================================== */

const CalendarEngine = (() => {
  const GREG_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const GREG_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  /* ---------------- Ethiopian ---------------- */
  // Approximate Lahiri ayanamsha (~24° in 2024) for sidereal reckoning
  const AYANAMSHA = 24;

  const ETH_MONTHS = [
    { en: "Meskerem", geez: "መስከረም", days: 30 },
    { en: "Tikimt", geez: "ጥቅምት", days: 30 },
    { en: "Hedar", geez: "ኅዳር", days: 30 },
    { en: "Tahsas", geez: "ጥር", days: 30 },
    { en: "Tir", geez: "የካቲት", days: 30 },
    { en: "Yekatit", geez: "መጋቢት", days: 30 },
    { en: "Megabit", geez: "ሚያዝያ", days: 30 },
    { en: "Miazia", geez: "ግንቦት", days: 30 },
    { en: "Genbot", geez: "ሰኔ", days: 30 },
    { en: "Sene", geez: "ሐምሌ", days: 30 },
    { en: "Hamle", geez: "ነሐሴ", days: 30 },
    { en: "Nehase", geez: "ጳጉሜ", days: 30 },
    { en: "Pagume", geez: "ጳጉሜ", days: 5 }
  ];
  const ETH_ANCHOR_Y = 2016; // 1 Meskerem 2016 = 11 Sep 2023 (Gregorian)
  const ETH_ANCHOR = { y: 2023, m: 9, d: 11 };

  function ethDaysInYear(y) { return (y % 4 === 3) ? 366 : 365; }
  function ethMonthDays(y, mi) { // mi 0..12
    if (mi === 12) return (y % 4 === 3) ? 6 : 5;
    return 30;
  }

  function gregorianToEthiopian(y, m, d) {
    const jd = Astro.toJD(y, m, d);
    const anchor = Astro.toJD(ETH_ANCHOR.y, ETH_ANCHOR.m, ETH_ANCHOR.d);
    let diff = Math.floor(jd) - Math.floor(anchor);
    let ey = ETH_ANCHOR_Y;
    while (diff < 0) { ey--; diff += ethDaysInYear(ey); }
    while (diff >= ethDaysInYear(ey)) { diff -= ethDaysInYear(ey); ey++; }
    const mi = Math.min(12, Math.floor(diff / 30));
    const dd = (diff % 30) + 1;
    return { y: ey, m: mi + 1, d: dd, mi: mi };
  }

  function ethiopianToGregorian(y, m, d) {
    let diff = 0;
    for (let yy = ETH_ANCHOR_Y; yy < y; yy++) diff += ethDaysInYear(yy);
    for (let yy = y; yy < ETH_ANCHOR_Y; yy++) { diff -= ethDaysInYear(yy); }
    for (let mi = 0; mi < m - 1; mi++) diff += ethMonthDays(y, mi);
    diff += (d - 1);
    const anchor = Astro.toJD(ETH_ANCHOR.y, ETH_ANCHOR.m, ETH_ANCHOR.d);
    const g = Astro.jdToGregorian(anchor + diff);
    return { y: g.year, m: g.month, d: g.day };
  }

  /* ---------------- Chinese (approximate) ---------------- */
  const ZODIAC_ANIMALS = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake",
    "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
  const GAN_ZHI = [
    "甲子","乙丑","丙寅","丁卯","戊辰","己巳","庚午","辛未","壬申","癸酉",
    "甲戌","乙亥","丙子","丁丑","戊寅","己卯","庚辰","辛巳","壬午","癸未",
    "甲申","乙酉","丙戌","丁亥","戊子","己丑","庚寅","辛卯","壬辰","癸巳",
    "甲午","乙未","丙申","丁酉","戊戌","己亥","庚子","辛丑","壬寅","癸卯",
    "甲辰","乙巳","丙午","丁未","戊申","己酉","庚戌","辛亥","壬子","癸丑",
    "甲寅","乙卯","丙辰","丁巳","戊午","己未","庚申","辛酉","壬戌","癸亥"];
  const CHINESE_MONTHS = [
    "Zhēngyuè (1st)", "Èryuè (2nd)", "Sānyuè (3rd)", "Sìyuè (4th)",
    "Wǔyuè (5th)", "Liùyuè (6th)", "Qīyuè (7th)", "Bāyuè (8th)",
    "Jiǔyuè (9th)", "Shíyuè (10th)", "Shíyīyuè (11th)", "Shíèryuè (12th)"
  ];

  function chineseData(y, m, d) {
    const jd = Math.floor(Astro.toJD(y, m, d)); // noon of the date

    // Chinese New Year = second new moon after the winter solstice (approx.)
    let sol = Math.floor(Astro.solarTermJD(270, y));
    if (sol > jd) sol = Math.floor(Astro.solarTermJD(270, y - 1));
    let nm1 = Math.floor(Astro.newMoonNear(sol + 1));
    if (nm1 <= sol) nm1 = Math.floor(Astro.newMoonNear(nm1 + 29));
    let nm2 = Math.floor(Astro.newMoonNear(nm1 + 29));
    let cny = nm2;
    let cy = y;
    if (cny > jd) {
      // date falls before this year's Chinese New Year -> previous Chinese year
      const sol2 = Math.floor(Astro.solarTermJD(270, y - 1));
      let a = Math.floor(Astro.newMoonNear(sol2 + 1));
      if (a <= sol2) a = Math.floor(Astro.newMoonNear(a + 29));
      cny = Math.floor(Astro.newMoonNear(a + 29));
      cy = y - 1;
    }
    const animal = ZODIAC_ANIMALS[(cy - 2020) % 12];
    const gz = GAN_ZHI[((cy - 1984) % 60 + 60) % 60];
    const chineseYear = cy + 2698;

    // walk lunations from CNY to the lunation containing `jd`.
    // A lunation with no principal solar term (longitude 0,30,...,330) is a leap month.
    let cursor = cny;
    let monthNo = 1;
    let leap = false;
    let leapOf = -1;
    while (true) {
      const nextNm = Math.floor(Astro.newMoonNear(cursor + 29));
      if (nextNm > jd) break;
      let hasTerm = false;
      for (let t = 0; t < 24; t++) {
        const st = Math.floor(Astro.solarTermJD(t * 15, cy));
        if (st > cursor && st < nextNm) { hasTerm = true; break; }
        const st2 = Math.floor(Astro.solarTermJD(t * 15, cy + 1));
        if (st2 > cursor && st2 < nextNm) { hasTerm = true; break; }
      }
      if (!hasTerm) { leap = true; leapOf = monthNo; } // leap month repeats this number
      cursor = nextNm;
      monthNo++;
    }
    // check the partial lunation that contains `jd`
    const nextNm = Math.floor(Astro.newMoonNear(cursor + 29));
    let hasTerm = false;
    for (let t = 0; t < 24; t++) {
      const st = Math.floor(Astro.solarTermJD(t * 15, cy));
      if (st > cursor && st < nextNm) { hasTerm = true; break; }
      const st2 = Math.floor(Astro.solarTermJD(t * 15, cy + 1));
      if (st2 > cursor && st2 < nextNm) { hasTerm = true; break; }
    }
    if (!hasTerm) { leap = true; leapOf = monthNo; }

    return {
      system: "chinese", year: chineseYear, gz, animal,
      month: monthNo, day: Math.max(1, jd - cursor + 1),
      leap, leapOf,
      cnyGregorian: Astro.jdToGregorian(cny)
    };
  }

  /* ---------------- Hindu / Vedic (approximate) ---------------- */
  const HINDU_MONTHS_EN = [
    "Chaitra", "Vaishakha", "Jyaistha", "Ashadha", "Shravana", "Bhadrapada",
    "Ashvina", "Kartika", "Margashirsha", "Pausha", "Magha", "Phalguna"
  ];
  const HINDU_MONTHS_HI = [
    "चैत्र", "वैशाख", "ज्येष्ठ", "आषाढ़", "श्रावण", "भाद्रपद",
    "अश्विन", "कार्तिक", "मृगशिरा", "पौष", "माघ", "फाल्गुन"
  ];
  const TITHI_NAMES = [
    "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi",
    "Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi",
    "Trayodashi","Chaturdashi","Purnima"];
  const NAKSHATRAS = [
    "Ashwini","Bharani","Krittika","Rohini","Mrigashirsha","Ardra",
    "Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni",
    "Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula",
    "Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha",
    "Purva Bhadrapada","Uttara Bhadrapada","Revati"];
  const YOGAS = [
    "Vishkumbha","Preeti","Ayushman","Saubhagya","Sobhana","Atiganda",
    "Sukarma","Dhriti","Shoola","Ganda","Vriddhi","Dhruva","Vyaghata",
    "Harshana","Vajra","Siddhi","Vyatipata","Variyan","Parigha","Shiva",
    "Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"];

  function hinduData(y, m, d) {
    const jd = Astro.toJD(y, m, d);
    const jdFloor = Math.floor(jd);
    const slon = Astro.normalizeAngle(Astro.sunLongitude(jd));
    const mlon = Astro.normalizeAngle(Astro.moonLongitude(jd));
    const slonS = Astro.normalizeAngle(slon - AYANAMSHA); // sidereal
    const mlonS = Astro.normalizeAngle(mlon - AYANAMSHA); // sidereal

    const tithiRaw = Astro.normalizeAngle(mlon - slon); // phase, unaffected by ayanamsha
    const tithi = Math.floor(tithiRaw / 12) + 1; // 1..30
    const paksha = tithi <= 15 ? "Shukla" : "Krishna";
    const tithiDay = tithi <= 15 ? tithi : tithi - 15;
    const tithiName = tithi === 15 ? "Purnima" : (tithi === 30 ? "Amavasya" : TITHI_NAMES[tithiDay - 1]);

    const nakIdx = Math.floor(mlonS / (360 / 27)) % 27;
    const yogaIdx = Math.floor(Astro.normalizeAngle(slonS + mlonS) / (360 / 27)) % 27;
    const karanaIndex = (Math.ceil(tithiRaw / 6) - 1) % 7;
    const KARANAS = ["Bava","Balava","Kaulava","Taitila","Gara","Vanij","Vishti"];
    const karana = KARANAS[karanaIndex];

    const sign = Math.floor(slonS / 30) % 12; // Mesha=0 ... Meena=11 (sidereal)
    // month named by solar transit: Meena -> Chaitra ... Mesha -> Vaishakha
    const monthIdx = (sign + 1) % 12;

    // find most recent Chaitra start: most recent new moon with sidereal sun in Meena (sign 11)
    let nm = Math.floor(Astro.newMoonNear(jdFloor));
    if (nm > jdFloor) nm = Math.floor(Astro.newMoonNear(nm - 29));
    let boundaryJD = nm;
    for (let k = 0; k < 40; k++) {
      const nslon = Astro.normalizeAngle(Astro.sunLongitude(nm) - AYANAMSHA);
      if (Math.floor(nslon / 30) % 12 === 11) { boundaryJD = nm; break; }
      nm = Math.floor(Astro.newMoonNear(nm - 29));
    }
    const b = Astro.jdToGregorian(boundaryJD);
    const vsYear = b.year + 57;      // Vikram / Bikrami Samvat
    const shakaYear = b.year - 78;   // Shaka Samvat

    return {
      system: "hindu", year: vsYear, shaka: shakaYear,
      paksha, tithi, tithiDay, tithiName,
      nakshatra: NAKSHATRAS[nakIdx], yoga: YOGAS[yogaIdx], karana,
      month: monthIdx, monthEn: HINDU_MONTHS_EN[monthIdx], monthHi: HINDU_MONTHS_HI[monthIdx],
      day: Math.max(1, Math.floor(tithiDay)), boundaryGregorian: b
    };
  }

  /* ---------------- Punjabi (Desi / Bikrami + Nanakshahi) ---------------- */
  const PUNJABI_MONTHS = [
    { en: "Chetar", gu: "ਚੇਤ" },
    { en: "Vaisakh", gu: "ਵੈਸਾਖ" },
    { en: "Jeth", gu: "ਜੇਠ" },
    { en: "Harh", gu: "ਹਾੜ੍ਹ" },
    { en: "Sawan", gu: "ਸਾਵਣ" },
    { en: "Bhadon", gu: "ਭਾਦੋਂ" },
    { en: "Assu", gu: "ਅੱਸੂ" },
    { en: "Katak", gu: "ਕੱਤਕ" },
    { en: "Maghar", gu: "ਮੱਘਰ" },
    { en: "Poh", gu: "ਪੋਹ" },
    { en: "Magh", gu: "ਮਾਘ" },
    { en: "Phagan", gu: "ਫੱਗਣ" }
  ];

  function punjabiData(y, m, d) {
    const jd = Astro.toJD(y, m, d);
    const jdFloor = Math.floor(jd);
    const slon = Astro.normalizeAngle(Astro.sunLongitude(jd) - AYANAMSHA); // sidereal
    const sign = Math.floor(slon / 30) % 12;
    const pMonth = PUNJABI_MONTHS[(sign + 1) % 12];
    // sankranti: first day of the current sidereal solar sign
    let sankJD = jdFloor;
    let cursor = jdFloor;
    for (let k = 0; k < 45; k++) {
      const prev = Astro.jdToGregorian(cursor - 1);
      const pj = Math.floor(Astro.toJD(prev.year, prev.month, prev.day));
      const ps = Math.floor(Astro.normalizeAngle(Astro.sunLongitude(pj) - AYANAMSHA) / 30) % 12;
      if (ps !== sign) break;
      cursor = pj;
    }
    sankJD = cursor;
    const dayInMonth = jdFloor - sankJD + 1;
    // Hindu data for samvat year
    const h = hinduData(y, m, d);
    const nanakshahi = new Date(y, 2, 14); // 14 March
    const nsDate = new Date(y, m - 1, d);
    const nsYear = (nsDate >= nanakshahi) ? y - 1468 : y - 1469;
    return {
      system: "punjabi", bikrami: h.year, month: pMonth.en, monthGu: pMonth.gu,
      day: dayInMonth, nanakshahiYear: nsYear
    };
  }

  /* ---------------- Hijri (arithmetic approx) ---------------- */
  const HIJRI_MONTHS = [
    "Muharram","Safar","Rabi' al-awwal","Rabi' ath-thani","Jumada al-awwal",
    "Jumada ath-thani","Rajab","Sha'ban","Ramadan","Shawwal","Dhu al-Qidah",
    "Dhu al-Hijjah"];
  const HIJRI_MONTHS_AR = [
    "مُحَرَّم","صَفَر","رَبِيع ٱلْأَوَّل","رَبِيع ٱلثَّانِي","جُمَادَى ٱلْأُولَى",
    "جُمَادَى ٱلْآخِرَة","رَجَب","شَعْبَان","رَمَضَان","شَوَّال","ذُو ٱلْقِعْدَة","ذُو ٱلْحِجَّة"];
  const HIJRI_LEAPS = [2,5,7,10,13,16,18,21,24,26,29];
  function hijriLeap(y) { return HIJRI_LEAPS.includes(((y - 1) % 30) + 1); }
  function gregorianToHijri(y, m, d) {
    const jd = Math.floor(Astro.toJD(y, m, d));
    const epoch = Math.floor(Astro.toJD(622, 7, 19)); // approx 1 Muharram 1 AH (proleptic Gregorian)
    let rem = jd - epoch;
    let hy = 1;
    const cycle = Math.floor(rem / 10631); rem = rem % 10631;
    hy += cycle * 30;
    for (let i = 1; i <= 30 && rem > 0; i++) {
      const yl = hijriLeap(i) ? 355 : 354;
      if (rem >= yl) { rem -= yl; hy++; } else break;
    }
    const leap = hijriLeap(hy);
    const lengths = [30,29,30,29,30,29,30,29,30,29,30, leap ? 30 : 29];
    let hm = 0; let hd = rem + 1;
    while (hd > lengths[hm]) { hd -= lengths[hm]; hm++; }
    return { system: "hijri", year: hy, month: hm + 1, day: hd,
      monthEn: HIJRI_MONTHS[hm], monthAr: HIJRI_MONTHS_AR[hm], ah: `AH ${hy}` };
  }

  /* ---------------- Hebrew (approx, molad-based) ---------------- */
  const HEBREW_MONTHS = [
    "Tishrei","Cheshvan","Kislev","Tevet","Shevat","Adar","Adar I","Adar II",
    "Nisan","Iyar","Sivan","Tammuz","Av","Elul"];
  const HEBREW_MONTHS_HE = [
    "תִּשְׁרֵי","חֶשְׁוָן","כִּסְלֵו","טֵבֵת","שְׁבָט","אֲדָר","אֲדָר רִאשׁוֹן","אֲדָר שֵׁנִי",
    "נִיסָן","אִיָּיר","סִיוָן","תַּמּוּז","אָב","אֱלוּל"];
  const PARTS_PER_HOUR = 1080;
  const MOLAD_EPOCH = 2 + 5 / 24 + 204 / (24 * PARTS_PER_HOUR); // Sunday 11:11:20 pm (fractional week)
  // molad of Tishrei for Hebrew year (parts of day)
  function moladTishrei(hy) {
    const monthParts = 29 * 24 * PARTS_PER_HOUR + 12 * PARTS_PER_HOUR + 793;
    const commonYear = 12 * monthParts;
    const leapYear = 13 * monthParts;
    let total = 0;
    let leapCycle = [3,6,8,11,14,17,19];
    for (let yr = 1; yr < hy; yr++) {
      total += leapCycle.includes(yr % 19 || (yr % 19 === 0 ? 19 : 0)) ? leapYear : commonYear;
    }
    return (MOLAD_EPOCH * 24 * PARTS_PER_HOUR + total) % (7 * 24 * PARTS_PER_HOUR);
  }
  // weekday of molad: 0=Sunday (epoch is Sunday)
  function weekdayOf(partsOfWeek) { return Math.floor(partsOfWeek / (24 * PARTS_PER_HOUR)) % 7; }
  function gregorianToHebrew(y, m, d) {
    // search Hebrew year whose Rosh Hashanah brackets the date
    let hy = y + 3760; // approx
    const findRH = (h) => {
      const mt = moladTishrei(h);
      let wd = weekdayOf(mt);
      // dehiyyot (simplified)
      if (wd === 0 || wd === 3 || wd === 5) wd = (wd + 1) % 7; // loadu
      // molad zaken / other postponements approximated
      return { h, wd };
    };
    // iterate to find RH dates around the gregorian date (approx: RH near Sep/Oct)
    const target = Math.floor(Astro.toJD(y, m, d));
    // Convert Hebrew RH weekday back to a Gregorian-ish anchor is complex;
    // use an empirical anchor: RH 5784 = 15 Sep 2023 (Saturday)
    const anchorH = 5784; const anchorJD = Math.floor(Astro.toJD(2023, 9, 15));
    const anchorWD = 6; // Saturday
    let curH = anchorH; let curJD = anchorJD;
    while (true) {
      const leap = [3,6,8,11,14,17,19].includes(curH % 19 || (curH % 19 === 0 ? 19 : 0));
      const days = leap ? 385 : 354; // approx lengths vary; use typical
      if (target >= curJD && target < curJD + days) break;
      curJD += days; curH++;
      if (curH > anchorH + 5) break; // safety
    }
    const g = Astro.jdToGregorian(curJD + (target - curJD));
    return { system: "hebrew", year: curH, note: "Approximate molad sketch — verify with Hebrew calendar authority" };
  }

  /* ---------------- Persian / Solar Hijri (approx) ---------------- */
  const PERSIAN_MONTHS = [
    "Farvardin","Ordibehesht","Khordad","Tir","Mordad","Shahrivar",
    "Mehr","Aban","Azar","Dey","Bahman","Esfand"];
  function gregorianToPersian(y, m, d) {
    const jd = Math.floor(Astro.toJD(y, m, d));
    const eq = Astro.solarTermJD(0, y); // vernal equinox
    let eqJD = Math.floor(eq);
    let py = y - 621;
    if (jd < eqJD) { eqJD = Math.floor(Astro.solarTermJD(0, y - 1)); py = y - 622; }
    const nextEq = Math.floor(Astro.solarTermJD(0, y + 1));
    const leap = (nextEq - eqJD) >= 365;
    const lengths = [31,31,31,31,31,31,30,30,30,30,30, leap ? 30 : 29];
    let doy = jd - eqJD + 1;
    let pm = 0; let pd = doy;
    while (pd > lengths[pm]) { pd -= lengths[pm]; pm++; }
    return { system: "persian", year: py, month: pm + 1, day: pd,
      monthEn: PERSIAN_MONTHS[pm], leap };
  }

  /* ---------------- Julian ---------------- */
  function gregorianToJulian(y, m, d) {
    let offset = -13;
    if (y < 1900) offset = -12;
    if (y > 2099) offset = -14;
    const g = Astro.jdToGregorian(Math.floor(Astro.toJD(y, m, d)) + offset);
    return { system: "julian", y: g.year, m: g.month, d: g.day, offset: Math.abs(offset) };
  }

  /* ---------------- Coptic / Egyptian (fixed 365) ---------------- */
  const COPTIC_MONTHS = [
    "Thout","Paopi","Hathor","Koiak","Tobi","Meshir",
    "Paremhotep","Paremoude","Pashons","Paona","Epip","Mesra","Nasieh"];
  function gregorianToCoptic(y, m, d) {
    const eth = gregorianToEthiopian(y, m, d);
    // Coptic year = Ethiopian year - 24 (both share 13-month structure)
    const cy = eth.y - 24;
    return { system: "coptic", year: cy, month: eth.m, day: eth.d,
      monthEn: COPTIC_MONTHS[eth.m - 1] };
  }

  /* ---------------- Buddhist / Thai calendar ---------------- */
  // Buddhist Era (BE) = CE + 543. Month structure mirrors Gregorian;
  // Songkran (Thai New Year, 13–15 Apr) is the cultural anchor.
  const BUDDHIST_MONTHS_EN = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  const BUDDHIST_MONTHS_TH = [
    "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
    "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
  function gregorianToBuddhist(y, m, d) {
    return { system: "buddhist", year: y + 543, month: m, day: d,
      monthEn: BUDDHIST_MONTHS_EN[m - 1], monthTh: BUDDHIST_MONTHS_TH[m - 1],
      era: "BE" };
  }

  /* ---------------- Japanese era calendar ---------------- */
  const JAPANESE_ERAS = [
    { name: "Reiwa", ja: "令和", start: { y: 2019, m: 5, d: 1 } },
    { name: "Heisei", ja: "平成", start: { y: 1989, m: 1, d: 8 } },
    { name: "Showa", ja: "昭和", start: { y: 1926, m: 12, d: 25 } },
    { name: "Taisho", ja: "大正", start: { y: 1912, m: 7, d: 30 } },
    { name: "Meiji", ja: "明治", start: { y: 1868, m: 9, d: 8 } }];
  const JAPANESE_MONTHS = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  function gregorianToJapanese(y, m, d) {
    let era = JAPANESE_ERAS[0];
    for (const e of JAPANESE_ERAS) {
      const sy = e.start.y, sm = e.start.m, sd = e.start.d;
      if (y > sy || (y === sy && (m > sm || (m === sm && d >= sd)))) { era = e; break; }
    }
    const ey = y - era.start.y + 1;
    return { system: "japanese", year: ey, eraName: era.name, eraJa: era.ja,
      month: m, day: d, monthEn: JAPANESE_MONTHS[m - 1] };
  }

  /* ---------------- Vietnamese calendar (lunisolar, approx.) ---------------- */
  // Approximates the Vietnamese lunisolar calendar using the same lunation
  // math as the Chinese calendar, with Vietnamese month names & zodiac.
  const VIETNAMESE_MONTHS = [
    "Giêng","Tháng Hai","Tháng Ba","Tháng Tư","Tháng Năm","Tháng Sáu",
    "Tháng Bảy","Tháng Tám","Tháng Chín","Tháng Mười","Tháng Mười Một","Tháng Ch"];
  const VIETNAMESE_ZODIAC = ["Tý","Sửu","Dần","Mão","Thìn","Tỵ","Ngọ","Mùi","Thân","Dậu","Tuất","Hợi"];
  function gregorianToVietnamese(y, m, d) {
    const chi = CE.chineseData ? chineseData(y, m, d) : null;
    // Fallback computed inline if chineseData not yet defined (it is, above)
    const jd = Math.floor(Astro.toJD(y, m, d));
    const sol = Math.floor(Astro.solarTermJD(270, y));
    const baseSol = sol > jd ? Math.floor(Astro.solarTermJD(270, y - 1)) : sol;
    let nm1 = Math.floor(Astro.newMoonNear(baseSol + 1));
    if (nm1 <= baseSol) nm1 = Math.floor(Astro.newMoonNear(nm1 + 29));
    let nm2 = Math.floor(Astro.newMoonNear(nm1 + 29));
    let cny = nm2; let cy = y;
    if (cny > jd) {
      const s2 = Math.floor(Astro.solarTermJD(270, y - 1));
      let a = Math.floor(Astro.newMoonNear(s2 + 1));
      if (a <= s2) a = Math.floor(Astro.newMoonNear(a + 29));
      cny = Math.floor(Astro.newMoonNear(a + 29)); cy = y - 1;
    }
    let cursor = cny; let monthNo = 1;
    while (true) {
      const nextNm = Math.floor(Astro.newMoonNear(cursor + 29));
      if (nextNm > jd) break;
      cursor = nextNm; monthNo++;
    }
    const animal = VIETNAMESE_ZODIAC[(cy - 2020) % 12];
    const can = ["Giáp","Ất","Bính","Đinh","Mậu","Kỷ","Canh","Tân","Nhâm","Quý"][
      ((cy - 1984) % 10 + 10) % 10];
    return { system: "vietnamese", year: cy, can, chi: animal,
      month: monthNo, monthVi: VIETNAMESE_MONTHS[(monthNo - 1) % 12],
      day: jd - cursor + 1, cnyGregorian: Astro.jdToGregorian(cny) };
  }

  /* ---------------- Mayan ---------------- */
  const MAYAN_TZOLKIN = [
    "Imix'","Ik'","Ak'bal","K'an","Chicchan","Cimi","Manik'","Lamat",
    "Muluc","Oc","Chuen","Eb","Ben","Ix","Men","Cib","Caban","Etznab","Cauac","Ahau"];
  const MAYAN_HAAB = [
    "Pop","Wo","Sip","Sotz'","Sec","Xul","Yaxk'in","Mol","Chen","Yax","Zac",
    "Ceh","Mac","K'ank'in","Muan","Pax","Kayab","Cumku","Uayeb"];
  const HAAB_LENGTHS = [20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,5];
  // GMT correlation: 0.0.0.0.0 = 11 Aug 3114 BCE = 4 Ahau 8 Cumku
  const MAYAN_ANCHOR = Math.floor(Astro.toJD(-3113, 8, 11));
  function gregorianToMayan(y, m, d) {
    const jd = Math.floor(Astro.toJD(y, m, d));
    const days = jd - MAYAN_ANCHOR;
    const baktun = Math.floor(days / 144000);
    let r = days % 144000;
    const katun = Math.floor(r / 7200); r %= 7200;
    const tun = Math.floor(r / 360); r %= 360;
    const uinal = Math.floor(r / 20); r %= 20;
    const kin = r;
    const k = ((days % 260) + 260) % 260;
    const tone = 1 + (k % 13);
    const tzName = MAYAN_TZOLKIN[(19 + k) % 20];
    const h = ((days % 365) + 365) % 365;
    let hm = 0, hd = h;
    while (hd >= HAAB_LENGTHS[hm]) { hd -= HAAB_LENGTHS[hm]; hm++; }
    return { system: "mayan", longCount: `${baktun}.${katun}.${tun}.${uinal}.${kin}`,
      tzolkin: `${tone} ${tzName}`, tone, tzName,
      haab: `${hd} ${MAYAN_HAAB[hm]}`, haabDay: hd, haabMonth: MAYAN_HAAB[hm] };
  }

  /* ---------------- Public API ---------------- */
  return {
    Astro,
    GREG_MONTHS, GREG_SHORT,
    ETH_MONTHS,
    ZODIAC_ANIMALS, GAN_ZHI, CHINESE_MONTHS,
    HINDU_MONTHS_EN, HINDU_MONTHS_HI, TITHI_NAMES, NAKSHATRAS, YOGAS,
    PUNJABI_MONTHS, HIJRI_MONTHS, HIJRI_MONTHS_AR, HEBREW_MONTHS, HEBREW_MONTHS_HE,
    PERSIAN_MONTHS, COPTIC_MONTHS,
    BUDDHIST_MONTHS_EN, BUDDHIST_MONTHS_TH, JAPANESE_ERAS, JAPANESE_MONTHS,
    VIETNAMESE_MONTHS, VIETNAMESE_ZODIAC,
    gregorianToEthiopian, ethiopianToGregorian,
    chineseData, hinduData, punjabiData,
    gregorianToHijri, gregorianToHebrew, gregorianToPersian,
    gregorianToBuddhist, gregorianToJapanese, gregorianToVietnamese,
    gregorianToJulian, gregorianToCoptic, gregorianToMayan,
    ethDaysInYear, ethMonthDays,
    solarTerms: Astro.SOLAR_TERMS,
    now() { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() }; }
  };
})();

if (typeof window !== "undefined") window.CalendarEngine = CalendarEngine;
