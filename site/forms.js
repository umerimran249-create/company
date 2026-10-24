(function () {
  "use strict";

  var CONTACT_EMAIL = "Astraealink@gmail.com";
  var HONEYPOT_NAME = "company_website";
  var REQUEST_TIMEOUT_MS = 15000;

  function config() {
    var cfg = window.ASTRA_SUPABASE || {};
    var key = typeof cfg.anonKey === "string" ? cfg.anonKey.trim() : "";
    if (!cfg.url || !key || key.indexOf("PASTE_") === 0) return null;
    return { url: String(cfg.url).replace(/\/+$/, ""), key: key };
  }

  function todayIso() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }

  function value(form, name) {
    var field = form.elements[name];
    return field && typeof field.value === "string" ? field.value.trim() : "";
  }

  // Each entry describes one site form: how to find it, read it, validate it and report status.
  var FORMS = [
    {
      selector: "#request-meeting",
      statusId: "meeting-status",
      buttonId: "meeting-submit",
      fieldIds: ["meeting-name", "meeting-email", "meeting-date", "meeting-time"],
      read: function (form) {
        return {
          form_type: "meeting",
          full_name: value(form, "name"),
          email: value(form, "email"),
          meeting_date: value(form, "preferredDate") || null,
          meeting_time: value(form, "preferredTime") || null,
          message: value(form, "notes") || null,
          page: location.pathname.slice(0, 200)
        };
      },
      validate: function (data) {
        var errors = {};
        if (!data.full_name) errors["meeting-name"] = "Name is required";
        else if (data.full_name.length > 120) errors["meeting-name"] = "Name must be 120 characters or fewer";
        if (!data.email) errors["meeting-email"] = "Email is required";
        else if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
          errors["meeting-email"] = "Please enter a valid email address";
        if (!data.meeting_date) errors["meeting-date"] = "Please select a preferred date";
        else if (data.meeting_date < todayIso()) errors["meeting-date"] = "Please choose today or a future date";
        if (!data.meeting_time) errors["meeting-time"] = "Please select a preferred time";
        if (data.message && data.message.length > 5000) errors["meeting-notes"] = "Notes must be 5000 characters or fewer";
        return errors;
      },
      idleLabel: "Book video call",
      busyLabel: "Sending...",
      success: function (data) {
        return "Request received. We'll contact you at " + data.email + " to confirm the meeting.";
      }
    }
  ];

  function specFor(form) {
    for (var i = 0; i < FORMS.length; i++) {
      if (form.matches && form.matches(FORMS[i].selector)) return FORMS[i];
    }
    return null;
  }

  function setFieldError(id, message) {
    var input = document.getElementById(id);
    if (!input) return;
    var error = document.getElementById(id + "-error");
    if (message) {
      input.classList.add("error");
      input.setAttribute("aria-invalid", "true");
    } else {
      input.classList.remove("error");
      input.removeAttribute("aria-invalid");
    }
    if (error) {
      error.hidden = !message;
      error.textContent = message || "";
    }
  }

  function setStatus(spec, text, kind, withEmail) {
    var status = document.getElementById(spec.statusId);
    if (!status) return;
    status.setAttribute("aria-live", "polite");
    status.setAttribute("data-state", kind || "");
    status.textContent = text;
    if (withEmail) {
      var link = document.createElement("a");
      link.href = "mailto:" + CONTACT_EMAIL;
      link.textContent = CONTACT_EMAIL;
      status.appendChild(link);
      status.appendChild(document.createTextNode("."));
    }
  }

  function ensureHoneypot(form) {
    if (form.querySelector('[name="' + HONEYPOT_NAME + '"]')) return;
    var wrap = document.createElement("div");
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.cssText = "position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden;";
    var input = document.createElement("input");
    input.type = "text";
    input.name = HONEYPOT_NAME;
    input.tabIndex = -1;
    input.autocomplete = "off";
    wrap.appendChild(input);
    form.appendChild(wrap);
  }

  function insertSubmission(cfg, payload) {
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS) : null;
    return fetch(cfg.url + "/rest/v1/contact_submissions", {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: "Bearer " + cfg.key,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Submission rejected (" + response.status + ")");
      })
      .finally(function () {
        if (timer) clearTimeout(timer);
      });
  }

  function onSubmit(event) {
    var form = event.target;
    if (!form || form.tagName !== "FORM") return;
    var spec = specFor(form);
    if (!spec) return;

    // Take over this form so older handlers (EmailJS / mailto) don't also fire.
    event.preventDefault();
    event.stopImmediatePropagation();
    ensureHoneypot(form);
    if (form.getAttribute("aria-busy") === "true") return;

    var data = spec.read(form);
    var errors = spec.validate(data);
    spec.fieldIds.concat(["meeting-notes"]).forEach(function (id) {
      setFieldError(id, errors[id] || "");
    });
    if (Object.keys(errors).length) {
      setStatus(spec, "Add the missing details, then send the request again.", "error");
      var first = form.querySelector("[aria-invalid='true']");
      if (first) first.focus();
      return;
    }

    var button = document.getElementById(spec.buttonId);
    function done() {
      form.removeAttribute("aria-busy");
      if (button) {
        button.disabled = false;
        button.textContent = spec.idleLabel;
      }
    }

    if (value(form, HONEYPOT_NAME)) {
      form.reset();
      setStatus(spec, spec.success(data), "success");
      return;
    }

    var cfg = config();
    if (!cfg) {
      setStatus(spec, "Couldn't send right now. Please email us at ", "error", true);
      return;
    }

    form.setAttribute("aria-busy", "true");
    if (button) {
      button.disabled = true;
      button.textContent = spec.busyLabel;
    }
    setStatus(spec, "Sending your request...", "pending");

    insertSubmission(cfg, data)
      .then(function () {
        form.reset();
        setStatus(spec, spec.success(data), "success");
      })
      .catch(function () {
        setStatus(spec, "Couldn't send right now. Please try again in a moment or email us at ", "error", true);
      })
      .then(done);
  }

  window.addEventListener("submit", onSubmit, true);
  document.addEventListener(
    "focusin",
    function (event) {
      var form = event.target && event.target.form;
      if (form && specFor(form)) ensureHoneypot(form);
    },
    true
  );
})();
