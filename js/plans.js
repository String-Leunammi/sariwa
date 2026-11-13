(() => {
  const MEALS_PER_DAY = 3;   // breakfast, lunch, dinner

  const PLANS = {
    "3-day":  { label: "3-Day",    title: "Meal-Kit 3-Day Plan",    days: 3 },
    "week":   { label: "A Week",   title: "Meal-Kit A Week Plan",   days: 7 },
    "biweek": { label: "Bi-Week",  title: "Meal-Kit Bi-Week Plan",  days: 14 },
  };

  const $ = id => document.getElementById(id);
  const el = (tag, props = {}, children = []) => {
    const n = Object.assign(document.createElement(tag), props);
    children.forEach(c => n.append(c));
    return n;
  };

  const views = { choose: $("view-choose"), build: $("view-build"), checkout: $("view-checkout"), done: $("view-done") };

  /* ---------- state ---------- */
  const state = { planKey: null, pax: 1, qty: new Map(MEALS_BY_PHOTO.map(m => [m.id, 0])) };

  const plan = () => PLANS[state.planKey];
  const maxMeals = () => (plan() ? plan().days * MEALS_PER_DAY : 0);
  const total = () => [...state.qty.values()].reduce((a, b) => a + b, 0);

  /* ---------- view switching (hash-based so Back/Forward work) ---------- */
  function show(name, { push = true, focus = true } = {}) {
    if ((name === "build" || name === "checkout") && !state.planKey) name = "choose";
    if (name === "checkout" && total() === 0) name = "build";
    if (name === "done" && !state.orderRef) name = "choose";

    Object.entries(views).forEach(([k, v]) => { v.hidden = k !== name; });
    if (location.hash !== "#" + name) {
      history[push ? "pushState" : "replaceState"](null, "", "#" + name);
    }
    if (focus) {                       
      window.scrollTo(0, 0);
      const h = views[name].querySelector("h1, h2");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    }
  }
  window.addEventListener("popstate", () => show(location.hash.slice(1) || "choose", { push: false }));

  /* ---------- VIEW 2: meal picker ---------- */
  const foodGrid = $("food-grid");
  const rows = new Map();   

  MEALS_BY_PHOTO.forEach(meal => {
    const qtyEl = el("span", { className: "food-qty", hidden: true });
    const minus = el("button", { type: "button", className: "btn-minus", textContent: "−" });
    const plus  = el("button", { type: "button", className: "btn-plus",  textContent: "+" });
    minus.setAttribute("aria-label", `Remove one ${meal.name}`);
    plus.setAttribute("aria-label", `Add one ${meal.name}`);

    minus.addEventListener("click", () => change(meal.id, -1));
    plus.addEventListener("click",  () => change(meal.id, +1));

    foodGrid.append(el("li", { className: "food-item" }, [
      el("div", { className: "food-img-wrapper" }, [
        el("img", { src: MEAL_IMG_DIR + meal.photo, alt: "", loading: "lazy", width: 120, height: 120 }),
        qtyEl,
      ]),
      el("p", { className: "food-name", textContent: meal.name }),
      el("div", { className: "controls" }, [minus, plus]),
    ]));
    rows.set(meal.id, { qtyEl, minus, plus });
  });

  function change(id, delta) {
    const next = state.qty.get(id) + delta;
    if (next < 0 || (delta > 0 && total() >= maxMeals())) return;
    state.qty.set(id, next);
    render();
  }

  /* ---------- receipts (builder + checkout share the same renderer) ---------- */
  function fillReceipt(listEl) {
    const chosen = MEALS_BY_PHOTO.filter(m => state.qty.get(m.id) > 0);
    if (!chosen.length) {
      listEl.replaceChildren(el("li", { className: "receipt-empty", textContent: "No meals selected yet" }));
      return;
    }
    listEl.replaceChildren(...chosen.map(m => el("li", { className: "receipt-row" }, [
      el("span", { textContent: String(state.pax) }),
      el("span", { textContent: m.name }),
      el("span", { textContent: String(state.qty.get(m.id)) }),
    ])));
  }

  function render() {
    const max = maxMeals(), t = total();
    rows.forEach((r, id) => {
      const q = state.qty.get(id);
      r.qtyEl.hidden = q === 0;
      r.qtyEl.textContent = q;
      r.minus.disabled = q === 0;
      r.plus.disabled = t >= max;
    });
    document.querySelectorAll(".receipt-list").forEach(fillReceipt);
    document.querySelectorAll("[data-receipt-total]").forEach(n => { n.textContent = t; });
    document.querySelectorAll("[data-receipt-plan]").forEach(n => { n.textContent = plan() ? plan().label : "-"; });
    document.querySelectorAll("[data-receipt-pax]").forEach(n => { n.textContent = state.pax; });

    $("meter").textContent = `${t} of ${max} meals selected`;
    $("meter-hint").textContent = t >= max ? "Meal limit reached for this plan." : "";
    $("to-checkout-btn").disabled = t === 0;
  }

  /* ---------- VIEW 1: pick a plan ---------- */
  document.querySelectorAll(".select-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".plan");
      state.planKey = btn.dataset.plan;
      state.pax = parseInt(card.querySelector(".servings").value, 10) || 1;
      state.qty.forEach((_, k) => state.qty.set(k, 0));   
      $("builder-title").textContent = plan().title;
      render();
      show("build");
    });
  });

  $("back-to-plans").addEventListener("click", () => show("choose"));
  $("back-to-build").addEventListener("click", () => show("build"));
  $("to-checkout-btn").addEventListener("click", () => { if (total() > 0) show("checkout"); });

  /* ---------- VIEW 3: checkout ---------- */
  const form = $("order-form");
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);

    // NOTE: no backend yet, not sent anywhere.
    state.orderRef = "SRW-" + Date.now().toString(36).toUpperCase().slice(-6);
    $("done-ref").textContent = state.orderRef;
    $("done-name").textContent = (data.get("fullname") || "").toString().split(" ")[0];
    $("done-pay").textContent = data.get("payment") === "Card" ? "debit/credit card" : "cash on delivery";
    show("done");
  });

  $("new-order").addEventListener("click", () => {
    state.planKey = null; state.orderRef = null; state.pax = 1;
    state.qty.forEach((_, k) => state.qty.set(k, 0));
    form.reset();
    document.querySelectorAll(".servings").forEach(s => { s.value = "1"; });
    render();
    show("choose");
  });

  /* ---------- boot ---------- */
  render();
  const start = location.hash.slice(1);
  show(start in views ? start : "choose", { push: false, focus: false });
})();
