(() => {
  const form = document.getElementById("auth-form");
  const title = document.getElementById("auth-title");
  const subtitle = document.getElementById("auth-subtitle");
  const submit = document.getElementById("auth-submit");
  const switchText = document.getElementById("switch-text");
  const switchBtn = document.getElementById("switch-btn");
  const nameRow = document.getElementById("name-row");
  const terms = document.getElementById("terms");
  const status = document.getElementById("form-status");
  const pw = document.getElementById("password");
  const pwToggle = document.getElementById("pw-toggle");

  const COPY = {
    signup: { title: "Sign up for an account", sub: "Fresh meals, delivered to your door.", btn: "Sign Up", sw: "Already have an account?", swBtn: "Log In", pwAuto: "new-password" },
    login:  { title: "Welcome back",           sub: "Log in to pick up where you left off.", btn: "Log In",  sw: "New to Sariwa?",          swBtn: "Sign Up", pwAuto: "current-password" },
  };
  let mode = "signup";

  function setMode(next) {
    mode = next;
    const c = COPY[mode], isSignup = mode === "signup";
    title.textContent = c.title;
    subtitle.textContent = c.sub;
    submit.textContent = c.btn;
    switchText.textContent = c.sw + " ";
    switchBtn.textContent = c.swBtn;
    nameRow.hidden = !isSignup;
    terms.hidden = !isSignup;
    nameRow.querySelectorAll("input").forEach(i => { i.required = isSignup; });
    pw.autocomplete = c.pwAuto;
    status.hidden = true;
    clearErrors();
    document.title = "Sariwa – " + c.btn;
    history.replaceState(null, "", isSignup ? "#signup" : "#login");
  }

  /* ---------- validation ---------- */
  const errorFor = input => document.getElementById(input.id + "-error");

  function clearErrors() {
    form.querySelectorAll("input").forEach(i => {
      i.removeAttribute("aria-invalid");
      const e = errorFor(i); if (e) e.textContent = "";
    });
  }

  function validate(input) {
    let msg = "";
    const v = input.value.trim();
    if (input.required && !v) msg = "This field is required.";
    else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = "Enter a valid email address.";
    else if (input.type === "password" && mode === "signup" && v.length < 8) msg = "Use at least 8 characters.";
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    const e = errorFor(input); if (e) e.textContent = msg;
    return !msg;
  }

  form.querySelectorAll("input").forEach(i => i.addEventListener("blur", () => { if (i.value) validate(i); }));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const inputs = [...form.querySelectorAll("input")].filter(i => !i.closest("[hidden]"));
    const results = inputs.map(validate);
    const firstBad = inputs[results.indexOf(false)];
    if (firstBad) { firstBad.focus(); return; }
    status.hidden = false;
    status.textContent = "Demo mode: your details were not sent or saved because this site has no account system connected yet.";
  });

  /* ---------- controls ---------- */
  switchBtn.addEventListener("click", () => setMode(mode === "signup" ? "login" : "signup"));

  pwToggle.addEventListener("click", () => {
    const show = pw.type === "password";
    pw.type = show ? "text" : "password";
    pwToggle.textContent = show ? "Hide" : "Show";
    pwToggle.setAttribute("aria-pressed", String(show));
  });

  document.querySelectorAll(".social-btn").forEach(b => b.addEventListener("click", () => {
    status.hidden = false;
    status.textContent = `${b.dataset.provider} sign-in isn't connected yet (demo mode).`;
  }));

  setMode(location.hash === "#login" ? "login" : "signup");
})();
