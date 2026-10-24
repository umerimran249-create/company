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
    setTimeout(finishLoaders, 1600);
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
      '<h2 class="meeting-title">Book a video call</h2>' +
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
      '<div class="form-actions"><button type="submit" class="btn-primary" id="meeting-submit">Book video call</button></div>' +
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

  function mailtoBooking(data) {
    var subject = "Video Call Booking Request from " + data.name;
    var body =
      "Hello Astraealink Team,\n\nI would like to book a video call with the following details:\n\nName: " +
      data.name +
      "\nEmail: " +
      data.email +
      "\nPreferred Date: " +
      data.preferredDate +
      "\nPreferred Time: " +
      data.preferredTime +
      "\nAdditional Notes: " +
      (data.notes || "No additional notes") +
      "\n\nPlease confirm the booking at your earliest convenience.\n\nBest regards,\n" +
      data.name;
    window.location.href =
      "mailto:infinitivee.co@gmail.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function sendBooking(data) {
    return fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lib_version: "4.4.1",
        user_id: "mbeVTD5d5ABZKTvNe",
        service_id: "service_infinitivee",
        template_id: "template_booking",
        template_params: {
          to_email: "infinitivee.co@gmail.com",
          from_name: data.name,
          from_email: data.email,
          preferred_date: data.preferredDate,
          preferred_time: data.preferredTime,
          notes: data.notes || "No additional notes provided",
          booking_type: "Video Call Booking",
          submitted_at: new Date().toLocaleString(),
          reply_to: data.email
        }
      })
    }).then(function (response) {
      if (!response.ok) throw new Error("Booking email was not accepted");
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
        mailtoBooking(data);
        if (status) {
          status.textContent =
            "The booking service did not accept the request, so your email app should open a draft. Send that message to finish. If it does not open, email infinitivee.co@gmail.com.";
        }
      })
      .then(function () {
        if (button) {
          button.disabled = false;
          button.textContent = "Book video call";
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

/* ===== Cookie consent: bottom banner + settings dialog =====
   localStorage "astra-cookie-consent" holds
   { version, necessary, analytics, marketing, method, timestamp }.
   The site ships no analytics or marketing tags. Add future ones as
   <script type="text/plain" data-astra-consent="analytics|marketing"> and
   they run once that category is allowed. React drops foreign nodes while it
   hydrates, so the UI is re-ensured on a timer, never from a MutationObserver. */
(function () {
  var KEY = "astra-cookie-consent";
  var VERSION = 1;
  var choice = readChoice();
  var lastTrigger = null;
  var resizeWatch = null;

  function readChoice() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || "null");
      if (data && data.version === VERSION) return data;
    } catch (e) {}
    return null;
  }

  function allows(category) {
    return category === "necessary" || !!(choice && choice[category]);
  }

  function expose() {
    var api = { decided: !!choice };
    if (choice) {
      Object.keys(choice).forEach(function (key) {
        api[key] = choice[key];
      });
    }
    Object.defineProperties(api, {
      allows: { value: allows },
      openSettings: {
        value: function () {
          openDialog(document.activeElement);
        }
      },
      reset: {
        value: function () {
          try {
            localStorage.removeItem(KEY);
          } catch (e) {}
          choice = null;
          expose();
          emit();
          showBanner();
        }
      }
    });
    window.astraCookieConsent = api;
  }

  function emit() {
    document.dispatchEvent(new CustomEvent("astra:cookie-consent", { detail: choice, bubbles: true }));
  }

  function activateScripts() {
    document.querySelectorAll('script[type="text/plain"][data-astra-consent]').forEach(function (held) {
      if (!allows(held.getAttribute("data-astra-consent"))) return;
      var live = document.createElement("script");
      Array.prototype.forEach.call(held.attributes, function (attr) {
        if (attr.name !== "type") live.setAttribute(attr.name, attr.value);
      });
      live.text = held.text;
      held.parentNode.replaceChild(live, held);
    });
  }

  function save(prefs, method) {
    choice = {
      version: VERSION,
      necessary: true,
      analytics: !!prefs.analytics,
      marketing: !!prefs.marketing,
      method: method,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(choice));
    } catch (e) {}
    expose();
    activateScripts();
    emit();
    announce(
      method === "accept-all"
        ? "All cookies accepted."
        : method === "reject"
          ? "Non-essential cookies rejected."
          : "Cookie preferences saved."
    );
    hideBanner();
  }

  function bannerHtml() {
    return (
      '<div class="astra-cookie-inner">' +
      '<div class="astra-cookie-text">' +
      '<h2 class="astra-cookie-title">Cookies on this site</h2>' +
      '<p class="astra-cookie-msg">We use cookies to improve your experience, analyse traffic and personalise content. ' +
      'You can accept all cookies or manage your preferences. Questions? <a href="/contact/">Contact us</a>.</p>' +
      "</div>" +
      '<div class="astra-cookie-actions">' +
      '<button type="button" class="astra-cookie-btn" data-cookie-action="manage" aria-haspopup="dialog">Manage settings</button>' +
      '<button type="button" class="astra-cookie-btn" data-cookie-action="reject">Reject non-essential</button>' +
      '<button type="button" class="astra-cookie-btn astra-cookie-primary" data-cookie-action="accept">Accept All Cookies</button>' +
      "</div></div>"
    );
  }

  function categoryHtml(id, name, text, locked) {
    return (
      '<li class="astra-cookie-cat">' +
      '<div class="astra-cookie-cat-text">' +
      '<label class="astra-cookie-cat-name" for="astra-cc-' + id + '">' + name + "</label>" +
      '<p class="astra-cookie-cat-desc" id="astra-cc-' + id + '-desc">' + text + "</p></div>" +
      '<span class="astra-switch">' +
      '<input type="checkbox" role="switch" id="astra-cc-' + id + '" aria-describedby="astra-cc-' + id + '-desc"' +
      (locked ? " checked disabled" : ' data-cookie-category="' + id + '"') + ">" +
      '<span class="astra-switch-track" aria-hidden="true"></span>' +
      (locked ? '<span class="astra-switch-note" aria-hidden="true">Always on</span>' : "") +
      "</span></li>"
    );
  }

  function dialogHtml() {
    return (
      '<div class="astra-cookie-backdrop" data-cookie-action="close"></div>' +
      '<div class="astra-cookie-dialog" role="dialog" aria-modal="true" aria-labelledby="astra-cookie-dialog-title" aria-describedby="astra-cookie-dialog-desc" tabindex="-1">' +
      '<div class="astra-cookie-dialog-head"><div><p class="astra-kicker">Privacy</p>' +
      '<h2 id="astra-cookie-dialog-title">Cookie settings</h2></div>' +
      '<button type="button" class="astra-cookie-close" data-cookie-action="close" aria-label="Close cookie settings">×</button></div>' +
      '<p class="astra-cookie-note" id="astra-cookie-dialog-desc">Choose which cookies we may use. Strictly necessary cookies keep the site working and cannot be switched off. You can change this later from Cookie settings.</p>' +
      '<ul class="astra-cookie-cats">' +
      categoryHtml("necessary", "Strictly necessary", "Remember your theme, accessibility options and this cookie choice. Always on.", true) +
      categoryHtml("analytics", "Analytics", "Count visits and see which pages help people, so we can improve the site.", false) +
      categoryHtml("marketing", "Marketing and personalisation", "Show content and offers that match your interests, here and on other sites.", false) +
      "</ul>" +
      '<div class="astra-cookie-dialog-actions">' +
      '<button type="button" class="astra-cookie-btn" data-cookie-action="reject">Reject non-essential</button>' +
      '<button type="button" class="astra-cookie-btn" data-cookie-action="save">Save preferences</button>' +
      '<button type="button" class="astra-cookie-btn astra-cookie-primary" data-cookie-action="accept">Accept all</button>' +
      "</div></div>"
    );
  }

  function ensureUi() {
    if (!document.body) return;
    if (!document.getElementById("astra-cookie-status")) {
      var status = document.createElement("div");
      status.id = "astra-cookie-status";
      status.className = "astra-cookie-sr";
      status.setAttribute("role", "status");
      document.body.appendChild(status);
    }
    if (!document.getElementById("astra-cookie-modal")) {
      var modal = document.createElement("div");
      modal.id = "astra-cookie-modal";
      modal.className = "astra-cookie-modal";
      modal.hidden = true;
      modal.innerHTML = dialogHtml();
      document.body.appendChild(modal);
    }
    if (!choice) showBanner();
    ensurePanelLink();
    ensureFooterLink();
  }

  function showBanner() {
    if (!document.body) return;
    var banner = document.getElementById("astra-cookie");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "astra-cookie";
      banner.className = "astra-cookie";
      banner.setAttribute("role", "region");
      banner.setAttribute("aria-label", "Cookie consent");
      banner.innerHTML = bannerHtml();
      var dock = document.getElementById("astra-a11y");
      document.body.insertBefore(banner, dock || null);
      if (typeof ResizeObserver !== "undefined") {
        if (resizeWatch) resizeWatch.disconnect();
        resizeWatch = new ResizeObserver(syncBannerHeight);
        resizeWatch.observe(banner);
      }
    }
    banner.hidden = false;
    document.documentElement.classList.add("astra-cookie-open");
    syncBannerHeight();
  }

  function hideBanner() {
    var banner = document.getElementById("astra-cookie");
    if (banner) banner.hidden = true;
    document.documentElement.classList.remove("astra-cookie-open");
    document.documentElement.style.removeProperty("--astra-cookie-h");
  }

  function syncBannerHeight() {
    var banner = document.getElementById("astra-cookie");
    if (!banner || banner.hidden) return;
    var value = banner.offsetHeight + "px";
    if (document.documentElement.style.getPropertyValue("--astra-cookie-h") !== value) {
      document.documentElement.style.setProperty("--astra-cookie-h", value);
    }
  }

  function announce(text) {
    var status = document.getElementById("astra-cookie-status");
    if (!status) return;
    status.textContent = "";
    setTimeout(function () {
      status.textContent = text;
    }, 60);
  }

  function isVisible(el) {
    return !!(el && el.isConnected && el.getClientRects().length);
  }

  function focusables(dialog) {
    return Array.prototype.filter.call(
      dialog.querySelectorAll("button:not([disabled]), input:not([disabled]), a[href]"),
      isVisible
    );
  }

  function openDialog(trigger) {
    ensureUi();
    var modal = document.getElementById("astra-cookie-modal");
    if (!modal) return;
    var a11yPanel = document.getElementById("astra-panel");
    if (a11yPanel && !a11yPanel.hidden) {
      var a11yClose = document.getElementById("astra-close");
      if (a11yClose) a11yClose.click();
      trigger = document.getElementById("astra-open") || trigger;
    }
    lastTrigger = trigger && trigger !== document.body ? trigger : null;
    modal.querySelectorAll("[data-cookie-category]").forEach(function (input) {
      input.checked = allows(input.getAttribute("data-cookie-category"));
    });
    modal.hidden = false;
    document.documentElement.classList.add("astra-cookie-modal-open");
    modal.querySelector(".astra-cookie-dialog").focus();
  }

  function closeDialog() {
    var modal = document.getElementById("astra-cookie-modal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.documentElement.classList.remove("astra-cookie-modal-open");
    if (isVisible(lastTrigger)) {
      lastTrigger.focus();
    } else {
      var main = document.getElementById("astra-main") || document.querySelector("main");
      if (main) {
        if (!main.hasAttribute("tabindex")) {
          main.setAttribute("tabindex", "-1");
          main.setAttribute("data-astra-focus-target", "");
        }
        main.focus({ preventScroll: true });
      }
    }
    lastTrigger = null;
  }

  function ensurePanelLink() {
    var panel = document.getElementById("astra-panel");
    if (!panel || document.getElementById("astra-cookie-panel-link")) return;
    var btn = document.createElement("button");
    btn.type = "button";
    btn.id = "astra-cookie-panel-link";
    btn.className = "astra-reset astra-cookie-panel-link";
    btn.setAttribute("aria-haspopup", "dialog");
    btn.setAttribute("data-cookie-action", "manage");
    btn.textContent = "Cookie settings";
    panel.appendChild(btn);
  }

  function isHydrated(el) {
    if (!window.__next_f) return true;
    return Object.keys(el).some(function (key) {
      return key.indexOf("__reactFiber") === 0;
    });
  }

  function ensureFooterLink() {
    var footer = document.querySelector(".footer");
    if (!footer || footer.querySelector(".astra-cookie-footer-link") || !isHydrated(footer)) return;
    var columns = footer.querySelectorAll(".footer-column-contents");
    var target = null;
    columns.forEach(function (col) {
      if (/Cookie Policy/i.test(col.textContent)) target = col;
    });
    if (!target && columns.length) target = columns[columns.length - 1];
    var item = document.createElement("div");
    item.className = "footer-column-contents-item";
    item.innerHTML =
      '<p class="description grey hover-text-grey"><button type="button" class="astra-cookie-footer-link" data-cookie-action="manage" aria-haspopup="dialog">Cookie settings</button></p>';
    if (target) {
      target.appendChild(item);
    } else {
      var bottom = footer.querySelector(".footer-content-bottom") || footer;
      bottom.appendChild(item);
    }
  }

  document.addEventListener("click", function (event) {
    var el = event.target.closest && event.target.closest("[data-cookie-action]");
    if (!el) return;
    var action = el.getAttribute("data-cookie-action");
    var modal = document.getElementById("astra-cookie-modal");
    var fromDialog = !!(modal && modal.contains(el));
    if (action === "manage") {
      openDialog(el);
      return;
    }
    if (action === "close") {
      closeDialog();
      return;
    }
    if (action === "accept") save({ analytics: true, marketing: true }, "accept-all");
    else if (action === "reject") save({ analytics: false, marketing: false }, "reject");
    else if (action === "save") {
      var prefs = {};
      modal.querySelectorAll("[data-cookie-category]").forEach(function (input) {
        prefs[input.getAttribute("data-cookie-category")] = input.checked;
      });
      save(prefs, "custom");
    } else return;
    if (fromDialog) closeDialog();
    else {
      lastTrigger = null;
      var main = document.getElementById("astra-main");
      if (main && document.activeElement === el) {
        if (!main.hasAttribute("tabindex")) {
          main.setAttribute("tabindex", "-1");
          main.setAttribute("data-astra-focus-target", "");
        }
        main.focus({ preventScroll: true });
      }
    }
  });

  document.addEventListener("keydown", function (event) {
    var modal = document.getElementById("astra-cookie-modal");
    if (!modal || modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;
    var items = focusables(modal);
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    var active = document.activeElement;
    var inside = modal.contains(active) && items.indexOf(active) !== -1;
    if (event.shiftKey && (!inside || active === first)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (!inside && active !== modal.querySelector(".astra-cookie-dialog") || active === last)) {
      event.preventDefault();
      first.focus();
    }
  }, true);

  window.addEventListener("storage", function (event) {
    if (event.key !== KEY) return;
    choice = readChoice();
    expose();
    activateScripts();
    emit();
    if (choice) hideBanner();
    else showBanner();
  });
  window.addEventListener("resize", syncBannerHeight);

  expose();
  activateScripts();
  if (document.readyState === "complete") ensureUi();
  else window.addEventListener("load", ensureUi);
  setTimeout(ensureUi, 800);
  setTimeout(ensureUi, 2200);
  setInterval(ensureUi, 1500);
})();
