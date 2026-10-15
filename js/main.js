/* ===== مدونة أفق — الجافاسكربت ===== */

(function () {
  "use strict";

  /* ---------- 1. الوضع الليلي ---------- */
  var THEME_KEY = "ufuq-theme";
  var root = document.documentElement;

  function savedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }
  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
    } else {
      root.removeAttribute("data-theme");
    }
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* تجاهل */ }
    var btn = document.getElementById("themeToggle");
    if (btn) {
      var label = theme === "dark" ? "تبديل الوضع النهاري" : "تبديل الوضع الليلي";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    }
  }

  var initial = savedTheme();
  if (!initial) {
    initial = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  applyTheme(initial);

  /* ---------- 2. قائمة الهاتف ---------- */
  var navToggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  }

  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeNav();
    });
  }

  /* ---------- 3. زر العودة للأعلى ---------- */
  var toTop = document.getElementById("toTop");
  if (toTop) {
    window.addEventListener("scroll", function () {
      toTop.classList.toggle("is-visible", window.scrollY > 420);
    }, { passive: true });
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ---------- 4. السنة في التذييل ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) {
    var y = new Date().getFullYear();
    var arDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    yearEl.textContent = String(y).replace(/\d/g, function (d) { return arDigits[+d]; });
  }

  /* ---------- 5. الصفحة الرئيسية: بحث + تصفية ---------- */
  var cardsWrap = document.getElementById("cards");
  if (cardsWrap) {
    var cards = Array.prototype.slice.call(cardsWrap.querySelectorAll(".card"));
    var searchInput = document.getElementById("search");
    var clearBtn = document.getElementById("clearSearch");
    var countEl = document.getElementById("resultCount");
    var emptyState = document.getElementById("emptyState");
    var emptyTerm = document.getElementById("emptyTerm");
    var resetBtn = document.getElementById("resetFilters");
    var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));

    var state = { term: "", category: "all" };

    /* فهرس البحث: العنوان + الوصف + التصنيف */
    cards.forEach(function (card) {
      var title = card.querySelector("h3") ? card.querySelector("h3").textContent : "";
      var desc = card.querySelector("p") ? card.querySelector("p").textContent : "";
      var cat = card.getAttribute("data-category") || "";
      card.dataset.search = (title + " " + desc + " " + cat).toLowerCase();
    });

    function normalize(text) {
      return text
        .toLowerCase()
        .replace(/[\u064B-\u0652\u0670\u0640]/g, "")   /* تشكيل وتطويل */
        .replace(/[أإآٱ]/g, "ا")
        .replace(/ى/g, "ي")
        .replace(/ؤ/g, "و")
        .replace(/ئ/g, "ي")
        .replace(/ة/g, "ه")
        .replace(/\s+/g, " ")
        .trim();
    }

    function render() {
      var term = normalize(state.term);
      var shown = 0;

      cards.forEach(function (card) {
        var haystack = normalize(card.dataset.search || "");
        var matchesTerm = !term || haystack.indexOf(term) !== -1;
        var matchesCat = state.category === "all" || card.getAttribute("data-category") === state.category;
        var visible = matchesTerm && matchesCat;
        card.hidden = !visible;
        if (visible) shown++;
      });

      if (countEl) {
        if (shown === cards.length && !term && state.category === "all") {
          countEl.textContent = "كل المقالات (" + cards.length + ")";
        } else {
          countEl.textContent = "النتائج: " + shown + " من " + cards.length;
        }
      }

      if (emptyState) {
        emptyState.hidden = shown !== 0;
        if (shown === 0 && emptyTerm) {
          emptyTerm.textContent = state.term || state.category;
        }
      }
      if (clearBtn) clearBtn.hidden = state.term.length === 0;
    }

    var debounceId = null;
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        var value = searchInput.value;
        window.clearTimeout(debounceId);
        debounceId = window.setTimeout(function () {
          state.term = value;
          render();
        }, 120);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        searchInput.value = "";
        state.term = "";
        render();
        searchInput.focus();
      });
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.category = chip.getAttribute("data-filter");
        chips.forEach(function (c) {
          var active = c === chip;
          c.classList.toggle("is-active", active);
          c.setAttribute("aria-selected", active ? "true" : "false");
        });
        render();
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        state.term = "";
        state.category = "all";
        if (searchInput) searchInput.value = "";
        chips.forEach(function (c) {
          var active = c.getAttribute("data-filter") === "all";
          c.classList.toggle("is-active", active);
          c.setAttribute("aria-selected", active ? "true" : "false");
        });
        render();
      });
    }

    /* بطاقات التصنيفات: تفعّل التصفية وتنزل إلى المقالات */
    Array.prototype.slice.call(document.querySelectorAll(".cat-card")).forEach(function (catCard) {
      catCard.addEventListener("click", function () {
        var cat = catCard.getAttribute("data-cat");
        var target = chips.filter(function (c) { return c.getAttribute("data-filter") === cat; })[0];
        if (target) target.click();
      });
    });

    render();
  }

  /* ---------- 6. نموذج التواصل: تحقّق محلي ---------- */
  var form = document.getElementById("contactForm");
  if (form) {
    var statusEl = document.getElementById("formStatus");
    var fields = {
      name: { input: document.getElementById("cName"), error: document.getElementById("errName") },
      email: { input: document.getElementById("cEmail"), error: document.getElementById("errEmail") },
      message: { input: document.getElementById("cMsg"), error: document.getElementById("errMsg") }
    };

    function setError(key, hasError) {
      var f = fields[key];
      if (!f || !f.input) return;
      f.input.setAttribute("aria-invalid", hasError ? "true" : "false");
      if (f.error) f.error.hidden = !hasError;
    }

    function validate() {
      var ok = true;

      var name = fields.name.input.value.trim();
      var nameBad = name.length < 2;
      setError("name", nameBad);
      if (nameBad) ok = false;

      var email = fields.email.input.value.trim();
      var emailBad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      setError("email", emailBad);
      if (emailBad) ok = false;

      var msg = fields.message.input.value.trim();
      var msgBad = msg.length < 10;
      setError("message", msgBad);
      if (msgBad) ok = false;

      return ok;
    }

    Object.keys(fields).forEach(function (key) {
      var input = fields[key].input;
      if (!input) return;
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") setError(key, false);
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!statusEl) return;

      if (!validate()) {
        statusEl.hidden = false;
        statusEl.classList.add("is-error");
        statusEl.textContent = "راجع الحقول الملوّنة بالأحمر ثم أعد المحاولة.";
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      statusEl.hidden = false;
      statusEl.classList.remove("is-error");
      var sender = fields.name.input.value.trim();
      statusEl.textContent = "شكراً " + sender + "، الرسالة سليمة. لكن هذه الصفحة بلا خادم، فلم يُرسَل أي بريد فعلاً — اربط النموذج بخدمة بريدية ليصل فعلاً.";
      form.reset();
    });
  }

  /* ---------- 7. صفحة المقال: شريط التقدّم وفهرس المحتوى ---------- */
  var progress = document.getElementById("progressBar");
  var articleBody = document.querySelector(".article-body");
  if (progress && articleBody) {
    var updateProgress = function () {
      var rect = articleBody.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var done = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 1;
      progress.style.width = (done * 100) + "%";
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
  if (tocLinks.length) {
    var headings = tocLinks
      .map(function (link) {
        var id = link.getAttribute("href").slice(1);
        return document.getElementById(id);
      })
      .filter(Boolean);

    if (headings.length) {
      var highlight = function () {
        var pos = window.scrollY + 140;
        var current = headings[0];
        headings.forEach(function (h) { if (h.offsetTop <= pos) current = h; });
        tocLinks.forEach(function (link) {
          link.classList.toggle("is-current", link.getAttribute("href") === "#" + current.id);
        });
      };
      window.addEventListener("scroll", highlight, { passive: true });
      highlight();
    }
  }
})();