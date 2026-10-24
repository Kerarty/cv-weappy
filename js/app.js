/* THIS IS THE GAME DESIGNER — логика досье */
(function () {
  'use strict';

  var START_OF_SERVICE = new Date(2023, 8, 1); // 1 сентября 2023 — поступление в БГУИР
  var DIPLOMA_DATE = new Date(2027, 5, 30);    // выпуск 2027

  /* ---------- Язык RU/EN ---------- */
  var currentLang = 'ru';

  function applyLang(lang) {
    currentLang = lang;
    document.documentElement.lang = lang === 'ru' ? 'ru' : 'en';
    var nodes = document.querySelectorAll('[data-ru]');
    for (var i = 0; i < nodes.length; i++) {
      var ru = nodes[i].getAttribute('data-ru');
      var en = nodes[i].getAttribute('data-en');
      var text = lang === 'ru' ? (ru != null ? ru : '') : (en != null ? en : (ru || ''));
      if (text) nodes[i].textContent = text;
    }
    var toggle = document.getElementById('langToggle');
    if (toggle) toggle.textContent = lang === 'ru' ? 'EN' : 'RU';
    try { localStorage.setItem('cv-lang', lang); } catch (e) {}
  }

  var langToggle = document.getElementById('langToggle');
  if (langToggle) {
    langToggle.addEventListener('click', function () {
      applyLang(currentLang === 'ru' ? 'en' : 'ru');
    });
  }
  try { applyLang(localStorage.getItem('cv-lang') || 'ru'); } catch (e) { applyLang('ru'); }

  /* ---------- Счётчики дней ---------- */
  function daysBetween(a, b) { return Math.floor((b - a) / 86400000); }

  function updateCounters() {
    var now = new Date();
    var served = daysBetween(START_OF_SERVICE, now);
    var left = daysBetween(now, DIPLOMA_DATE);
    var dEl = document.getElementById('hudDay');
    var gEl = document.getElementById('hudGrad');
    if (dEl) {
      dEl.textContent = currentLang === 'ru'
        ? 'ДЕНЬ ' + served + ' СЛУЖБЫ'
        : 'DAY ' + served + ' OF SERVICE';
    }
    if (gEl) {
      gEl.textContent = currentLang === 'ru'
        ? 'ДО ДИПЛОМА: ' + left
        : 'UNTIL DIPLOMA: ' + left;
    }
  }
  updateCounters();
  setInterval(updateCounters, 60000);

  /* ---------- Шкала поддержки населения ---------- */
  var supportFill = document.getElementById('supportFill');
  var supportNum = document.getElementById('supportNum');
  var finalStamp = document.getElementById('finalStamp');
  var stamped = false;

  function updateSupport() {
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0;
    if (supportFill) supportFill.style.width = p + '%';
    if (supportNum) supportNum.textContent = p + '%';
    if (p >= 98 && !stamped && finalStamp) {
      stamped = true;
      finalStamp.classList.add('shown');
    }
  }
  window.addEventListener('scroll', updateSupport, { passive: true });
  updateSupport();

  /* ---------- Появление блоков + статы ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      el.classList.add('shown');
      io.unobserve(el);

      if (el.classList.contains('officer-card')) {
        var bars = el.querySelectorAll('.stat-bar');
        bars.forEach(function (bar) {
          var val = parseInt(bar.getAttribute('data-val'), 10) || 0;
          bar.style.setProperty('--fill', (val * 10) + '%');
        });
      }
      if (el.classList.contains('telegraph')) {
        var tgs = el.querySelectorAll('.telegram');
        tgs.forEach(function (tg, i) {
          setTimeout(function () { tg.classList.add('shown'); }, 350 + i * 700);
        });
      }
    });
  }, { threshold: 0.18 });

  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- Дела: раскрытие ---------- */
  document.querySelectorAll('[data-case] .case-head').forEach(function (head) {
    head.addEventListener('click', function () {
      head.closest('.case').classList.toggle('open');
    });
  });

  /* ---------- Карта: подсветка текущего тома ---------- */
  var districts = document.querySelectorAll('.district');
  var volumes = document.querySelectorAll('.volume');
  var ioMap = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var id = entry.target.id;
      districts.forEach(function (d) {
        d.classList.toggle('d-here', d.getAttribute('href') === '#' + id);
      });
    });
  }, { threshold: 0.35 });
  volumes.forEach(function (v) { ioMap.observe(v); });

  /* ---------- Дилемма продюсера ---------- */
  var verdict = document.getElementById('dVerdict');
  var chosenDilemma = null;
  var verdictTexts = {
    a: {
      ru: 'МИНИМУМ ВЫГОДЕН — КОГДА ДАННЫЕ НА ТВОЕЙ СТОРОНЕ. Чистая партия стали, прокачанный станок, отдохнувший оператор — тогда запас не нужен и минимум честно экономит металл. Но дешёвая партия с примесями плюс усталость — и брак съест всю экономию: переделка дороже запаса. В «Механизме» это считается заново для каждого заказа.',
      en: 'THE MINIMUM PAYS OFF — WHEN THE DATA IS ON YOUR SIDE. A clean steel batch, an upgraded machine, a rested operator — then the margin is dead weight and the minimum honestly saves metal. But a cheap impure batch plus fatigue, and scrap eats the savings: a rebuild costs more than the margin. In ‘Mekhanizm’ this is recalculated for every order.'
    },
    b: {
      ru: 'ВЕРНО ПО УМОЛЧАНИЮ. Запас страхует от брака на каждом этапе и приносит надбавку к оплате — заказчик платит за надёжность. Обратная сторона честная: детали реально становятся крупнее, металла и времени уходит больше. Именно этот обмен — решение игрока, а не поле ввода: так в «Механизме» размер изделия стал геймплейным решением.',
      en: 'CORRECT BY DEFAULT. The margin insures every stage against defects and earns a price premium — the client pays for reliability. The flip side is honest: parts physically grow, consuming more metal and time. That exact trade-off is the player’s decision, not a form field — that is how a part’s size became gameplay in ‘Mekhanizm’.'
    }
  };
  function bindChoice(btnId, key) {
    var btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('click', function () {
      chosenDilemma = key;
      renderVerdict();
    });
  }
  function renderVerdict() {
    if (!verdict || !chosenDilemma) return;
    verdict.hidden = false;
    verdict.textContent = verdictTexts[chosenDilemma][currentLang];
  }
  bindChoice('dChoiceA', 'a');
  bindChoice('dChoiceB', 'b');

  /* ---------- Печать ---------- */
  var printBtn = document.getElementById('printBtn');
  if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

  /* ---------- Обложка ---------- */
  var openCase = document.getElementById('openCase');
  if (openCase) {
    openCase.addEventListener('click', function () {
      var first = document.getElementById('vol1');
      if (first) first.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------- Смена языка: обновить зависимые тексты ---------- */
  if (langToggle) {
    langToggle.addEventListener('click', function () {
      updateCounters();
      renderVerdict();
    });
  }
})();
