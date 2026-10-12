(function () {
  var THEME_KEY = "astra-theme";
  var A11Y_KEY = "astra-a11y";
  var DAY_START = 7;
  var DAY_END = 19;

  function isDay(date) {
    var hour = (date || new Date()).getHours();
    return hour >= DAY_START && hour < DAY_END;
  }

  function themeSource() {
    var saved = localStorage.getItem(THEME_KEY);
    return saved === "light" || saved === "dark" || saved === "auto" ? saved : "auto";
  }

  function resolvedTheme(source) {
    var mode = source || themeSource();
    return mode === "light" || mode === "dark" ? mode : isDay() ? "light" : "dark";
  }

  function logoSrc(mode) {
    return mode === "light" ? "/logos/astraea-logo.png" : "/logos/astraea-logo-on-dark.png";
  }

  function paintLogos() {
    var src = logoSrc(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
    document.querySelectorAll("img").forEach(function (img) {
      var current = img.getAttribute("src") || "";
      if (current.indexOf("infinitivee") === -1 && current.indexOf("astraea-logo") === -1) return;
      if (current !== src) img.setAttribute("src", src);
      img.alt = "Astraea Labs";
      img.classList.add("astraea-logo");
    });
  }

  function applyTheme(source) {
    var mode = resolvedTheme(source);
    document.documentElement.setAttribute("data-theme", mode);
    document.documentElement.setAttribute("data-theme-source", source || themeSource());
    paintLogos();
    var btn = document.getElementById("astra-theme-toggle");
    if (btn) {
      var src = source || themeSource();
      btn.setAttribute("aria-pressed", mode === "light" ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        src === "auto"
          ? "Theme follows time of day. It is " + mode + " now. Choose a theme."
          : "Theme is " + mode + ". Choose a theme."
      );
    }
    document.querySelectorAll("[data-theme-choice]").forEach(function (el) {
      var choice = el.getAttribute("data-theme-choice");
      var on = choice === (source || themeSource());
      el.setAttribute("aria-pressed", on ? "true" : "false");
      el.classList.toggle("is-on", on);
    });
  }

  function setThemeSource(source) {
    localStorage.setItem(THEME_KEY, source);
    applyTheme(source);
  }

  window.__astraSetTheme = setThemeSource;
  window.__astraApplyTheme = applyTheme;
  applyTheme(themeSource());
  setTimeout(paintLogos, 400);
  setTimeout(paintLogos, 1600);
  if (typeof MutationObserver !== "undefined") {
    var logoWatch = new MutationObserver(paintLogos);
    logoWatch.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
    setTimeout(function () { logoWatch.disconnect(); }, 4000);
  }

  setInterval(function () {
    if (themeSource() === "auto") applyTheme("auto");
  }, 60000);

  var defaults = {
    font: 0,
    readable: false,
    links: false,
    headings: false,
    contrast: false,
    spacing: false,
    leading: false,
    motion: false,
    cursor: false,
    guide: false
  };

  function loadA11y() {
    try {
      return Object.assign({}, defaults, JSON.parse(localStorage.getItem(A11Y_KEY) || "{}"));
    } catch (e) {
      return Object.assign({}, defaults);
    }
  }

  var settings = loadA11y();

  function saveA11y() {
    localStorage.setItem(A11Y_KEY, JSON.stringify(settings));
    applyA11y();
  }

  function applyA11y() {
    var root = document.documentElement;
    root.classList.remove("astra-font-1", "astra-font-2", "astra-font-3", "astra-readable", "astra-links", "astra-headings", "astra-contrast", "astra-spacing", "astra-leading", "astra-motion", "astra-cursor", "astra-guide");
    if (settings.font) root.classList.add("astra-font-" + settings.font);
    ["readable", "links", "headings", "contrast", "spacing", "leading", "motion", "cursor", "guide"].forEach(function (key) {
      if (settings[key]) root.classList.add("astra-" + key);
    });
    document.querySelectorAll("video").forEach(function (video) {
      if (settings.motion) video.pause();
    });
    document.querySelectorAll("[data-a11y]").forEach(function (el) {
      var key = el.getAttribute("data-a11y");
      var on = key === "font" ? settings.font > 0 : !!settings[key];
      el.setAttribute("aria-pressed", on ? "true" : "false");
      el.classList.toggle("is-on", on);
    });
    var fontBtn = document.querySelector("[data-a11y='font']");
    if (fontBtn) fontBtn.textContent = "Text size" + (settings.font ? " " + settings.font : "");
    var guide = document.getElementById("astra-guide-line");
    if (guide) guide.hidden = !settings.guide;
  }

  function icon(path) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + path + '"></path></svg>';
  }

  function mount() {
    if (document.getElementById("astra-a11y")) return;

    if (!document.getElementById("astra-skip")) {
      var skip = document.createElement("a");
      skip.id = "astra-skip";
      skip.className = "astra-skip";
      skip.href = "#astra-main";
      skip.textContent = "Skip to content";
      document.body.prepend(skip);
      var main = document.querySelector("section") || document.querySelector("main");
      if (main && !main.id) main.id = "astra-main";
    }

    var root = document.createElement("div");
    root.id = "astra-a11y";
    root.className = "astra-dock";
    root.innerHTML =
      '<button type="button" class="astra-fab" id="astra-theme-toggle" aria-label="Choose color theme">' +
      icon("M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z") +
      "</button>" +
      '<button type="button" class="astra-fab astra-fab-accent" id="astra-open" aria-expanded="false" aria-controls="astra-panel" aria-label="Accessibility options">' +
      icon("M12 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM4 9h16M12 6v14M7 20l5-6 5 6") +
      "</button>" +
      '<div id="astra-panel" class="astra-panel" role="dialog" aria-modal="true" aria-labelledby="astra-panel-title" hidden>' +
      '<div class="astra-panel-head"><div><p class="astra-kicker">Accessibility</p><h2 id="astra-panel-title">Adjust this site</h2></div>' +
      '<button type="button" class="astra-close" id="astra-close" aria-label="Close accessibility options">×</button></div>' +
      '<p class="astra-note">Light runs 7:00 a.m. to 7:00 p.m. unless you pick a theme.</p>' +
      '<div class="astra-group" role="group" aria-label="Color theme">' +
      '<button type="button" data-theme-choice="auto">Day & night</button>' +
      '<button type="button" data-theme-choice="light">Light</button>' +
      '<button type="button" data-theme-choice="dark">Dark</button>' +
      "</div>" +
      '<div class="astra-options">' +
      '<button type="button" data-a11y="font">Text size</button>' +
      '<button type="button" data-a11y="readable">Readable font</button>' +
      '<button type="button" data-a11y="links">Highlight links</button>' +
      '<button type="button" data-a11y="headings">Highlight headings</button>' +
      '<button type="button" data-a11y="contrast">Higher contrast</button>' +
      '<button type="button" data-a11y="spacing">Text spacing</button>' +
      '<button type="button" data-a11y="leading">Line height</button>' +
      '<button type="button" data-a11y="motion">Pause motion</button>' +
      '<button type="button" data-a11y="cursor">Bigger cursor</button>' +
      '<button type="button" data-a11y="guide">Reading guide</button>' +
      "</div>" +
      '<button type="button" class="astra-reset" id="astra-reset">Reset options</button>' +
      "</div>" +
      '<div class="astra-guide-line" id="astra-guide-line" hidden></div>';

    document.body.appendChild(root);

    var panel = document.getElementById("astra-panel");
    var openBtn = document.getElementById("astra-open");
    var lastFocus = null;

    function setOpen(open) {
      panel.hidden = !open;
      openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        lastFocus = document.activeElement;
        var close = document.getElementById("astra-close");
        if (close) close.focus();
      } else if (lastFocus && lastFocus.focus) {
        lastFocus.focus();
      }
    }

    openBtn.addEventListener("click", function () {
      setOpen(panel.hidden);
    });
    document.getElementById("astra-close").addEventListener("click", function () {
      setOpen(false);
    });
    document.getElementById("astra-theme-toggle").addEventListener("click", function () {
      setOpen(true);
    });
    document.getElementById("astra-reset").addEventListener("click", function () {
      settings = Object.assign({}, defaults);
      saveA11y();
    });

    root.querySelectorAll("[data-theme-choice]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setThemeSource(btn.getAttribute("data-theme-choice"));
      });
    });

    root.querySelectorAll("[data-a11y]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-a11y");
        if (key === "font") settings.font = (settings.font + 1) % 4;
        else settings[key] = !settings[key];
        saveA11y();
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !panel.hidden) {
        setOpen(false);
      }
      if (event.key !== "Tab" || panel.hidden) return;
      var items = panel.querySelectorAll("button");
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    var guide = document.getElementById("astra-guide-line");
    document.addEventListener("mousemove", function (event) {
      if (!settings.guide) return;
      guide.hidden = false;
      guide.style.top = event.clientY + "px";
    });

    applyA11y();
    applyTheme(themeSource());
  }

  if (document.readyState === "complete") mount();
  else window.addEventListener("load", mount);
  setTimeout(mount, 800);
  setTimeout(mount, 2200);
})();
