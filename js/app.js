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
      ru: 'НЕРФ ПРОВЁЛСЯ БЫ, НО… Прямой нерф обесценивает юнита для его игроков — «нашего героя порезали». Плейтесты показали, что проблема не в самом юните, а в его связке с ранней экономикой. Правильный ход был другой — см. вариант Б. Настоящий кейс: я изменил условие входа, а не силу персонажа, и доля побед вышла в коридор 45–55% без единого обиженного плейтестера.',
      en: 'A NERF WOULD WORK, BUT… A direct nerf devalues the unit for the players who love it — "they cut our hero." Playtests showed the problem wasn\'t the unit itself but its synergy with the early economy. The right move was the other one — see option B. The real case: I changed the cost of entry, not the character\'s power, and the win rate settled into 45–55% without a single offended playtester.'
    },
    b: {
      ru: 'ВЕРНО. Поднимая цену, я оставляю юнита таким же сильным и уважаю тех, кто за него играет, — но он перестаёт доминировать в ранней игре. Минимальное изменение, проверенное данными 15+ сессий: доля побед фракции вышла в коридор 45–55%. Это и есть мой подход к балансу: сначала данные, потом гипотеза, потом самая маленькая правка, которая решает проблему.',
      en: 'CORRECT. By raising the cost I keep the unit just as strong — respecting the players who love it — but it stops dominating the early game. A minimal change, backed by data from 15+ sessions: the faction\'s win rate settled into 45–55%. That is my approach to balance: data first, then a hypothesis, then the smallest patch that fixes the problem.'
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
