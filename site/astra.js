(function () {
  if (/^\/works(\/|$)/.test(location.pathname)) {
    location.replace("/");
    return;
  }

  var THEME_KEY = "astra-theme";
  var A11Y_KEY = "astra-a11y";
  var DAY_START = 7;
  var DAY_END = 19;

  function isDay(date) {
    var hour = (date || new Date()).getHours();
    return hour >= DAY_START && hour < DAY_END;
  }

  function themeSource() {
    try {
      localStorage.removeItem("al-theme");
      localStorage.removeItem("astra-cookie-consent");
    } catch (e) {}
    var saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark" || saved === "auto") return saved;
    return "auto";
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
      img.alt = "AstraeLink";
      img.classList.add("astraea-logo");
    });
  }

  function applyTheme(source) {
    var mode = resolvedTheme(source);
    var root = document.documentElement;
    root.setAttribute("data-theme", mode);
    root.setAttribute("data-theme-source", source || themeSource());
    root.classList.toggle("light", mode === "light");
    paintLogos();
    var tt = document.getElementById("tt");
    if (tt) {
      var use = tt.querySelector("use");
      if (use) use.setAttribute("href", mode === "light" ? "#i-moon" : "#i-sun");
      var label = mode === "light" ? "Switch to dark theme" : "Switch to light theme";
      tt.setAttribute("aria-label", label);
      tt.title = label;
    }
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
    try { localStorage.removeItem("al-theme"); } catch (e) {}
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

  var STEP_ICONS = {
    audit: '<circle cx="10.5" cy="10.5" r="6.5"></circle><path d="m15.4 15.4 5.6 5.6"></path><path class="astra-step-accent" d="m7.6 10.6 2 2 3.6-4"></path>',
    road: '<path d="M8 21 10.6 3M16 21 13.4 3"></path><path class="astra-step-accent" d="M12 5.5v2M12 10.5v2.5M12 16v3"></path><path d="M3 21h18"></path>',
    fix: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>',
    monitor: '<rect x="2.5" y="3.5" width="19" height="13" rx="2"></rect><path d="M8 20.5h8M12 16.5v4"></path><path class="astra-step-accent" d="M5.5 10.5h3l1.6-3 3 6 1.6-3h3.8"></path>'
  };

  function stepsHtml() {
    var steps = [
      ["audit", "WCAG Audit"],
      ["road", "Roadmap"],
      ["fix", "Fixes"],
      ["monitor", "Ongoing Monitoring"]
    ];
    return (
      '<ol class="astra-steps-list">' +
      steps.map(function (s) {
        return (
          '<li class="astra-step"><span class="astra-step-icon"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
          STEP_ICONS[s[0]] + '</svg></span><span class="astra-step-label">' + s[1] + "</span></li>"
        );
      }).join("") +
      "</ol>" +
      '<svg class="astra-steps-lines" viewBox="0 0 1000 120" preserveAspectRatio="none" aria-hidden="true" focusable="false">' +
      '<path d="M125 0V50L165 100H835L875 50V0M375 0V50L415 100M625 0V50L585 100M500 100V120"></path></svg>' +
      '<div class="astra-steps-site"><span class="astra-steps-plus" aria-hidden="true">+</span>Your website</div>'
    );
  }

  function mountSteps() {
    var box = document.querySelector(".services-content-container");
    if (!box || box.querySelector(".astra-steps")) return;
    if (window.__next_f && !Object.keys(box).some(function (k) { return k.indexOf("__reactFiber") === 0; })) return;
    var wrap = document.createElement("div");
    wrap.className = "astra-steps";
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Our process: WCAG audit, roadmap, fixes, ongoing monitoring for your website");
    wrap.innerHTML = stepsHtml();
    box.appendChild(wrap);
    var video = box.querySelector(".services-content-video");
    if (video) video.pause();
  }

  [600, 1500, 3000, 6000].forEach(function (ms) { setTimeout(mountSteps, ms); });
  setInterval(mountSteps, 2500);

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

    var root = document.createElement("div");
    root.id = "astra-a11y";
    root.className = "astra-dock";
    root.innerHTML =
      '<button type="button" class="astra-fab" id="astra-theme-toggle" aria-label="Choose color theme">' +
      icon("M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z") +
      "</button>" +
      '<button type="button" class="astra-fab astra-fab-accent" id="astra-open" aria-expanded="false" aria-controls="astra-panel" aria-label="Accessibility options">' +
      '<svg class="astra-a11y-figure" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      '<circle cx="12" cy="4.2" r="2.2"></circle>' +
      '<path d="M4.5 8.6 12 10l7.5-1.4M12 10v4.6M12 14.6 8.6 21M12 14.6l3.4 6.4"></path></svg>' +
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
    document.body.appendChild(panel);
    var backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "astra-panel-backdrop";
    backdrop.setAttribute("aria-label", "Close accessibility options");
    backdrop.hidden = true;
    document.body.insertBefore(backdrop, panel);

    var openBtn = document.getElementById("astra-open");
    var lastFocus = null;

    function setOpen(open) {
      panel.hidden = !open;
      backdrop.hidden = !open;
      document.documentElement.classList.toggle("astra-adjust-open", open);
      openBtn.setAttribute("aria-expanded", open ? "true" : "false");
      var adjust = document.getElementById("adjust-site");
      if (adjust) adjust.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        lastFocus = document.activeElement;
        var close = document.getElementById("astra-close");
        if (close) close.focus();
      } else if (lastFocus && lastFocus.focus) {
        lastFocus.focus();
      }
    }

    backdrop.addEventListener("click", function () {
      setOpen(false);
    });

    openBtn.addEventListener("click", function () {
      setOpen(panel.hidden);
    });
    var adjustBtn = document.getElementById("adjust-site");
    if (adjustBtn) {
      adjustBtn.setAttribute("aria-controls", "astra-panel");
      adjustBtn.addEventListener("click", function () {
        setOpen(panel.hidden);
      });
      openBtn.hidden = true;
      var themeFab = document.getElementById("astra-theme-toggle");
      if (themeFab) themeFab.hidden = true;
    }
    var headerTheme = document.getElementById("tt");
    if (headerTheme && !headerTheme.getAttribute("data-astra-theme")) {
      headerTheme.setAttribute("data-astra-theme", "1");
      headerTheme.addEventListener("click", function () {
        setThemeSource(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
      });
    }
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

    panel.querySelectorAll("[data-theme-choice]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setThemeSource(btn.getAttribute("data-theme-choice"));
      });
    });

    panel.querySelectorAll("[data-a11y]").forEach(function (btn) {
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

  /* Home adds .fade-out only when THREE load progress is exactly 100.
     A client-side return remounts .initial-loading-screen with that flag
     cleared, and an interrupted load never reaches 100 again, so the
     fixed overlay stays opacity 1. Let the intro play once, then keep
     every later loader off the page. */
  var loaderSel = ".initial-loading-screen, .loading-screen, .website-loading-screen";
  var loaderArmed = false;
  var loaderDone = false;

  function finishLoaders() {
    loaderDone = true;
    if (document.documentElement.getAttribute("data-astra-loader") !== "done") {
      document.documentElement.setAttribute("data-astra-loader", "done");
    }
  }

  function armLoaders() {
    if (loaderDone) {
      finishLoaders();
      return;
    }
    if (loaderArmed) return;
    if (!document.querySelector(loaderSel)) return;
    loaderArmed = true;
    setTimeout(finishLoaders, 3900);
  }

  armLoaders();
  if (typeof MutationObserver !== "undefined") {
    var loaderWatch = new MutationObserver(function () {
      if (loaderDone) finishLoaders();
      else armLoaders();
    });
    loaderWatch.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-astra-loader"]
    });
  }
  window.addEventListener("pageshow", armLoaders);
  window.addEventListener("popstate", armLoaders);

  var meetingScrolled = false;

  function meetingFormHtml() {
    return (
      '<form id="request-meeting" class="meeting-form" novalidate>' +
      '<p class="meeting-kicker">Meeting</p>' +
      '<h2 class="meeting-title">Book a meeting</h2>' +
      '<p class="meeting-lead" id="meeting-status" role="status">Pick a date and time. We confirm by email.</p>' +
      '<div class="form-group"><label class="form-label" for="meeting-name">Full name</label>' +
      '<input class="form-input" id="meeting-name" name="name" type="text" autocomplete="name" required aria-describedby="meeting-name-error">' +
      '<p class="meeting-error" id="meeting-name-error" hidden></p></div>' +
      '<div class="form-group"><label class="form-label" for="meeting-email">Email address</label>' +
      '<input class="form-input" id="meeting-email" name="email" type="email" autocomplete="email" required aria-describedby="meeting-email-error">' +
      '<p class="meeting-error" id="meeting-email-error" hidden></p></div>' +
      '<div class="form-row">' +
      '<div class="form-group"><label class="form-label" for="meeting-date">Meeting date</label>' +
      '<input class="form-input" id="meeting-date" name="preferredDate" type="date" required aria-describedby="meeting-date-error">' +
      '<p class="meeting-error" id="meeting-date-error" hidden></p></div>' +
      '<div class="form-group"><label class="form-label" for="meeting-time">Meeting time</label>' +
      '<select class="form-input" id="meeting-time" name="preferredTime" required aria-describedby="meeting-time-error">' +
      '<option value="">Select time</option>' +
      '<option value="09:00">9:00 AM</option><option value="10:00">10:00 AM</option>' +
      '<option value="11:00">11:00 AM</option><option value="12:00">12:00 PM</option>' +
      '<option value="13:00">1:00 PM</option><option value="14:00">2:00 PM</option>' +
      '<option value="15:00">3:00 PM</option><option value="16:00">4:00 PM</option>' +
      '<option value="17:00">5:00 PM</option></select>' +
      '<p class="meeting-error" id="meeting-time-error" hidden></p></div></div>' +
      '<div class="form-group"><label class="form-label" for="meeting-notes">Notes</label>' +
      '<textarea class="form-textarea" id="meeting-notes" name="notes" rows="4" placeholder="Tell us about your project or what you want to cover."></textarea></div>' +
      '<div class="form-actions"><button type="submit" class="btn-primary" id="meeting-submit">Book meeting</button></div>' +
      "</form>"
    );
  }

  function setMeetingError(id, message) {
    var input = document.getElementById(id);
    var error = document.getElementById(id + "-error");
    if (!input || !error) return;
    if (message) {
      input.classList.add("error");
      input.setAttribute("aria-invalid", "true");
      error.hidden = false;
      error.textContent = message;
    } else {
      input.classList.remove("error");
      input.removeAttribute("aria-invalid");
      error.hidden = true;
      error.textContent = "";
    }
  }

  function meetingPayload(form) {
    return {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      preferredDate: form.preferredDate.value,
      preferredTime: form.preferredTime.value,
      notes: form.notes.value.trim()
    };
  }

  function validateMeeting(data) {
    var errors = {};
    if (!data.name) errors["meeting-name"] = "Name is required";
    if (!data.email) errors["meeting-email"] = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors["meeting-email"] = "Please enter a valid email address";
    if (!data.preferredDate) errors["meeting-date"] = "Please select a preferred date";
    if (!data.preferredTime) errors["meeting-time"] = "Please select a preferred time";
    return errors;
  }

  function sendBooking(data) {
    var cfg = window.ASTRA_SUPABASE || {};
    var key = typeof cfg.anonKey === "string" ? cfg.anonKey.trim() : "";
    if (!cfg.url || !key) return Promise.reject(new Error("Booking is not configured"));
    return fetch(String(cfg.url).replace(/\/+$/, "") + "/rest/v1/contact_submissions", {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({
        form_type: "meeting",
        full_name: data.name,
        email: data.email,
        meeting_date: data.preferredDate || null,
        meeting_time: data.preferredTime || null,
        message: data.notes || null,
        page: location.pathname.slice(0, 200)
      })
    }).then(function (response) {
      if (!response.ok) throw new Error("Booking was not accepted");
    });
  }

  function onMeetingSubmit(event) {
    event.preventDefault();
    var form = event.currentTarget;
    var data = meetingPayload(form);
    var errors = validateMeeting(data);
    ["meeting-name", "meeting-email", "meeting-date", "meeting-time"].forEach(function (id) {
      setMeetingError(id, errors[id] || "");
    });
    var status = document.getElementById("meeting-status");
    if (Object.keys(errors).length) {
      if (status) status.textContent = "Add the missing details, then send the request again.";
      var first = form.querySelector("[aria-invalid='true']");
      if (first) first.focus();
      return;
    }
    var button = document.getElementById("meeting-submit");
    if (button) {
      button.disabled = true;
      button.textContent = "Submitting...";
    }
    sendBooking(data)
      .then(function () {
        if (status) status.textContent = "Request received. We'll contact you at " + data.email + " to confirm the meeting.";
        form.reset();
      })
      .catch(function () {
        if (status) status.textContent = "Couldn't send right now. Please try again in a moment or email us at info@astraealink.com.";
      })
      .then(function () {
        if (button) {
          button.disabled = false;
          button.textContent = "Book meeting";
        }
      });
  }

  function ensureMeetingForm() {
    if (location.pathname.indexOf("/contact") === -1) return;
    var slot = document.querySelector(".contact-content-right");
    if (!slot) return;
    var form = document.getElementById("request-meeting");
    if (!form || !slot.contains(form)) {
      if (form) form.remove();
      slot.insertAdjacentHTML("afterbegin", meetingFormHtml());
      form = document.getElementById("request-meeting");
    }
    if (form && form.getAttribute("data-wired") !== "true") {
      var date = document.getElementById("meeting-date");
      if (date && !date.min) {
        var today = new Date();
        var month = String(today.getMonth() + 1).padStart(2, "0");
        var day = String(today.getDate()).padStart(2, "0");
        date.min = today.getFullYear() + "-" + month + "-" + day;
      }
      form.addEventListener("submit", onMeetingSubmit);
      form.setAttribute("data-wired", "true");
    }
    document.querySelectorAll(".contact-content-item.clickable").forEach(function (item) {
      if (item.tagName === "A") item.setAttribute("href", "#request-meeting");
      else {
        item.setAttribute("role", "link");
        item.setAttribute("tabindex", "0");
      }
      if (!item.getAttribute("aria-label")) item.setAttribute("aria-label", "Book a videocall");
    });
    if (!meetingScrolled && location.hash === "#request-meeting" && form) {
      meetingScrolled = true;
      form.scrollIntoView({ block: "start" });
    }
  }

  document.addEventListener(
    "click",
    function (event) {
      var trigger = event.target.closest && event.target.closest(".contact-content-item.clickable");
      if (!trigger || !document.getElementById("request-meeting")) return;
      event.preventDefault();
      event.stopPropagation();
      var form = document.getElementById("request-meeting");
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      var name = document.getElementById("meeting-name");
      if (name) name.focus();
    },
    true
  );

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var trigger = event.target.closest && event.target.closest(".contact-content-item.clickable");
    if (!trigger || trigger.tagName === "A" || trigger.tagName === "BUTTON") return;
    event.preventDefault();
    trigger.click();
  });

  if (location.pathname.indexOf("/contact") !== -1) {
    ensureMeetingForm();
    window.addEventListener("load", ensureMeetingForm);
    setTimeout(ensureMeetingForm, 600);
    setTimeout(ensureMeetingForm, 1800);
    if (typeof MutationObserver !== "undefined") {
      var meetingWatch = new MutationObserver(ensureMeetingForm);
      meetingWatch.observe(document.documentElement, { childList: true, subtree: true });
      setTimeout(function () {
        meetingWatch.disconnect();
        ensureMeetingForm();
      }, 5000);
    }
  }
})();

