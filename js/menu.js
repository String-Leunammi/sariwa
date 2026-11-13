/* SARIWA · menu.js  — filters, meal grid, recipe popup.  Needs meals.js first. */
(() => {
  const filtersEl = document.getElementById("filters");
  const gridEl = document.getElementById("grid");
  const statusEl = document.getElementById("menu-status");
  const popup = document.getElementById("infopopup");
  const closeBtn = document.getElementById("close");
  const active = new Set();
  let lastFocus = null;

  /* ----------  DOM helper  ---------- */
  const el = (tag, props = {}, children = []) => {
    const node = Object.assign(document.createElement(tag), props);
    children.forEach(c => node.append(c));
    return node;
  };

  /* ---------- filter buttons ---------- */
  MEAL_FILTERS.forEach(name => {
    const btn = el("button", { type: "button", textContent: name });
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      active.has(name) ? active.delete(name) : active.add(name);
      btn.setAttribute("aria-pressed", String(active.has(name)));
      applyFilters();
    });
    filtersEl.append(btn);
  });

  /* ---------- meal grid ---------- */
  const boxes = MEALS.map(meal => {
    const box = el("button", { type: "button", className: "mealbox" }, [
      el("img", { className: "plate", src: MEAL_IMG_DIR + meal.photo, alt: "", loading: "lazy", width: 300, height: 300 }),
      el("div", { className: "label", textContent: meal.name }),
    ]);
    box.setAttribute("aria-label", `${meal.name} – view recipe`);
    box.addEventListener("click", () => openPopup(meal));
    gridEl.append(box);
    return { meal, box };
  });

  const emptyEl = el("p", { className: "empty", hidden: true }, [
    "No meal matches every selected filter. ",
    el("button", { type: "button", textContent: "Clear filters", onclick: clearFilters, style: "background:none;border:0;color:inherit;font:inherit;text-decoration:underline;cursor:pointer" }),
  ]);
  gridEl.append(emptyEl);

  function clearFilters() {
    active.clear();
    filtersEl.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", "false"));
    applyFilters();
  }

  function applyFilters() {
    let shown = 0;
    boxes.forEach(({ meal, box }) => {
      const matches = [...active].every(f => meal.tags.includes(f));
      box.hidden = active.size > 0 && !matches;
      box.classList.toggle("match", active.size > 0 && matches);
      if (!box.hidden) shown++;
    });
    emptyEl.hidden = shown > 0;
    statusEl.textContent = active.size
      ? `Showing ${shown} of ${MEALS.length} meals`
      : "";
  }

  /* ---------- popup ---------- */
  const $ = id => document.getElementById(id);

  function openPopup(meal) {
    $("popup-img").src = MEAL_IMG_DIR + meal.photo;
    $("popup-img").alt = meal.name;
    $("popup-name").textContent = meal.name;
    $("popup-desc").textContent = meal.description;

    $("popup-ingredients").replaceChildren(...meal.ingredients.map(i => el("li", { textContent: i })));

    $("popup-steps").replaceChildren(...meal.steps.flatMap((step, i) => [
      el("h4", { textContent: `${i + 1}. ${step.title}` }),
      el("ul", {}, step.items.map(t => el("li", { textContent: t }))),
    ]));

    $("popup-allergens").textContent = "Contains: " + meal.allergens.join(", ");

    lastFocus = document.activeElement;
    popup.hidden = false;
    document.body.style.overflow = "hidden";
    popup.scrollTop = 0;
    closeBtn.focus();
  }

  function closePopup() {
    if (popup.hidden) return;
    popup.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }

  closeBtn.addEventListener("click", closePopup);
  popup.addEventListener("click", e => { if (e.target === popup) closePopup(); });

  document.addEventListener("keydown", e => {
    if (popup.hidden) return;
    if (e.key === "Escape") return closePopup();
    if (e.key === "Tab") {                     
      const f = [...popup.querySelectorAll("button, [href]")].filter(n => !n.hidden);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
