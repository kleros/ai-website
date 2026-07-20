const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const header = document.querySelector("[data-header]");
const onScroll = () => header?.classList.toggle("is-scrolled", window.scrollY > 18);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");

menuToggle?.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  mobileMenu?.classList.toggle("is-open", !open);
});

mobileMenu?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    mobileMenu.classList.remove("is-open");
  });
});

const revealItems = document.querySelectorAll(".reveal");
revealItems.forEach((item) => {
  const delay = item.dataset.delay;
  if (delay) item.style.setProperty("--delay", `${delay}ms`);
});

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14 },
  );
  revealItems.forEach((item) => revealObserver.observe(item));
}

const lifecycleLinks = [...document.querySelectorAll(".lifecycle-nav a")];
const lifecycleSections = [...document.querySelectorAll("[data-lifecycle-section]")];

if (lifecycleLinks.length && lifecycleSections.length && "IntersectionObserver" in window) {
  const lifecycleObserver = new IntersectionObserver(
    (entries) => {
      const active = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      lifecycleLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${active.target.id}`);
      });
    },
    { rootMargin: "-30% 0px -48%", threshold: [0.15, 0.35, 0.6] },
  );
  lifecycleSections.forEach((section) => lifecycleObserver.observe(section));
}

const activateLifecycleHash = () => {
  if (!["#verify", "#transact", "#resolve", "#connect"].includes(location.hash)) return;
  const target = document.querySelector(location.hash);
  if (!target?.matches("[data-lifecycle-section]")) return;
  target.querySelectorAll(".reveal").forEach((item) => item.classList.add("is-visible"));
  lifecycleLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === location.hash);
  });
};

activateLifecycleHash();
window.addEventListener("hashchange", activateLifecycleHash);

const wait = (milliseconds) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

const runScenarioButton = document.querySelector("[data-run-scenario]");
const consoleSteps = [...document.querySelectorAll("[data-console-step]")];
const runLabel = document.querySelector("[data-run-label]");

runScenarioButton?.addEventListener("click", async () => {
  runScenarioButton.disabled = true;
  consoleSteps.forEach((step) => step.classList.remove("is-active", "is-complete", "is-alert"));

  const states = [
    { className: "is-complete", state: "PASS", label: "Verifying agent…" },
    { className: "is-complete", state: "LOCKED", label: "Protecting payment…" },
    { className: "is-alert", state: "FAIL", label: "Detecting delivery…" },
    { className: "is-active", state: "RECOVERED", label: "Routing dispute…" },
  ];

  for (let index = 0; index < consoleSteps.length; index += 1) {
    const step = consoleSteps[index];
    const state = states[index];
    runLabel.textContent = state.label;
    step.classList.add(state.className);
    step.querySelector(".flow-state").textContent = state.state;
    if (!reduceMotion) await wait(620);
  }

  runLabel.textContent = "Resolved · funds recovered";
  if (!reduceMotion) await wait(900);
  runLabel.textContent = "Run the resolution again";
  runScenarioButton.disabled = false;
});

const policyButtons = [...document.querySelectorAll("[data-policy]")];
const agentTags = document.querySelector("[data-agent-tags]");
const matchScore = document.querySelector("[data-match-score]");
const permissionStatus = document.querySelector("[data-permission-status]");

const updatePolicy = () => {
  if (!agentTags || !matchScore || !permissionStatus) return;
  const selected = policyButtons.filter((button) => button.classList.contains("is-selected"));
  agentTags.replaceChildren(
    ...selected.map((button) => {
      const tag = document.createElement("span");
      tag.textContent = button.dataset.policy;
      return tag;
    }),
  );
  const score = Math.min(99, 42 + selected.length * 18);
  matchScore.textContent = String(score);
  const granted = selected.length >= 3;
  permissionStatus.textContent = granted ? "GRANTED" : "NEEDS REVIEW";
  permissionStatus.style.color = granted ? "var(--mint)" : "var(--orange)";
};

policyButtons.forEach((button) => {
  button.addEventListener("click", () => {
    button.classList.toggle("is-selected");
    const selected = button.classList.contains("is-selected");
    button.querySelector("span").textContent = selected ? "✓" : "+";
    updatePolicy();
  });
});

const escrowDemo = document.querySelector("[data-escrow-demo]");
const escrowButtons = [...document.querySelectorAll("[data-escrow-outcome]")];
const escrowResult = document.querySelector("[data-escrow-result]");
const vaultState = document.querySelector("[data-vault-state]");

const setEscrowOutcome = (outcome) => {
  if (!escrowDemo || !escrowResult || !vaultState) return;
  const success = outcome === "success";
  escrowDemo.classList.toggle("is-success", success);
  escrowDemo.classList.toggle("is-failure", !success);
  escrowButtons.forEach((button) => button.classList.toggle("is-active", button.dataset.escrowOutcome === outcome));
  escrowResult.classList.toggle("is-success", success);
  escrowResult.classList.toggle("is-failure", !success);
  escrowResult.querySelector(".result-icon").textContent = success ? "→" : "↩";
  escrowResult.querySelector("strong").textContent = success ? "Payment released to seller" : "Recovery path opened";
  escrowResult.querySelector(".result-badge").textContent = success ? "SETTLED" : "DISPUTABLE";
  vaultState.textContent = success ? "RELEASED" : "RETURN ROUTE";
};

escrowButtons.forEach((button) => button.addEventListener("click", () => setEscrowOutcome(button.dataset.escrowOutcome)));
if (escrowDemo) setEscrowOutcome("failure");

const triageLab = document.querySelector("[data-triage-lab]");
const matrix = document.querySelector("[data-matrix]");
const caseButtons = [...document.querySelectorAll("[data-case]")];

const cases = {
  clear: {
    title: "Paid dataset never arrived",
    values: [88, 82, 91, 86, 89, 84, 92, 80, 85],
    score: 86,
    route: "Strong convergence → auto-resolve",
    pill: "AUTOMATED",
    color: "var(--mint)",
  },
  uncertain: {
    title: "Report delivered, but scope is disputed",
    values: [72, 44, 59, 33, 68, 49, 61, 38, 55],
    score: 53,
    route: "Material disagreement → human court",
    pill: "ESCALATE",
    color: "var(--purple-bright)",
  },
  respondent: {
    title: "Buyer changed terms after delivery",
    values: [14, 21, 17, 26, 11, 19, 23, 16, 13],
    score: 18,
    route: "Strong convergence → auto-resolve",
    pill: "AUTOMATED",
    color: "var(--cyan)",
  },
};

const renderCase = (key) => {
  if (!triageLab || !matrix) return;
  const item = cases[key];
  matrix.replaceChildren(
    ...item.values.map((value) => {
      const cell = document.createElement("div");
      cell.className = `matrix-cell ${value <= 30 ? "is-low" : value < 75 ? "is-uncertain" : ""}`;
      cell.style.setProperty("--fill", `${Math.max(12, value)}%`);
      const score = document.createElement("strong");
      score.textContent = String(value);
      cell.append(score);
      return cell;
    }),
  );

  triageLab.querySelector("[data-case-title]").textContent = item.title;
  triageLab.querySelector("[data-case-score]").textContent = String(item.score);
  triageLab.querySelector("[data-route-label]").textContent = item.route;
  triageLab.querySelector("[data-route-pill]").textContent = item.pill;
  triageLab.querySelector("[data-route-pill]").style.color = item.color;
  const routeMeter = triageLab.querySelector(".route-meter");
  routeMeter.style.background = `conic-gradient(${item.color} ${item.score}%, rgba(255,255,255,.08) 0)`;
  triageLab.querySelector("[data-route-meter]").textContent = `${item.score}%`;
  triageLab.querySelector("[data-route-meter]").style.color = item.color;
  triageLab.querySelector(".verdict-score").style.color = item.color;
  caseButtons.forEach((button) => {
    const active = button.dataset.case === key;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
};

caseButtons.forEach((button) => button.addEventListener("click", () => renderCase(button.dataset.case)));
if (triageLab) renderCase("clear");

const terminal = document.querySelector("[data-terminal]");
const terminalRun = document.querySelector("[data-terminal-run]");
const terminalLines = [...document.querySelectorAll(".terminal-line")];
const terminalOutcome = document.querySelector("[data-terminal-outcome]");

const runTerminal = async () => {
  if (!terminalRun || !terminalOutcome) return;
  terminalRun.disabled = true;
  terminalLines.forEach((line) => line.classList.remove("is-visible"));
  const outcomes = [
    "Agent verified. Ready to transact.",
    "Funds locked. Delivery can begin.",
    "Failure detected. Evidence captured.",
    "Dispute opened. Correct court selected.",
    "Ruling received. Funds recovered.",
  ];
  for (let index = 0; index < terminalLines.length; index += 1) {
    terminalLines[index].classList.add("is-visible");
    terminalOutcome.textContent = outcomes[index];
    if (!reduceMotion) await wait(560);
  }
  terminalRun.disabled = false;
};

terminalRun?.addEventListener("click", runTerminal);

const demoGates = [...document.querySelectorAll("[data-interaction-gate]")];

demoGates.forEach((gate) => {
  const host = gate.closest("[data-demo]");
  const unlockButton = gate.querySelector("[data-unlock-demo]");
  if (!host || !unlockButton) return;

  const demoControls = [...host.querySelectorAll("button:not([data-unlock-demo])")];
  demoControls.forEach((control) => {
    control.disabled = true;
  });

  unlockButton.addEventListener("click", () => {
    host.classList.add("is-unlocked");
    gate.setAttribute("aria-hidden", "true");
    demoControls.forEach((control) => {
      control.disabled = false;
    });

    if (host.dataset.demo === "scenario") {
      runScenarioButton?.click();
      return;
    }

    if (host.dataset.demo === "terminal") {
      runTerminal();
      return;
    }

    window.setTimeout(() => demoControls[0]?.focus(), reduceMotion ? 0 : 420);
  });
});

const contactForm = document.querySelector("[data-contact-form]");
const contactSubmit = document.querySelector("[data-contact-submit]");
const contactSubmitLabel = document.querySelector("[data-contact-submit-label]");
const contactStatus = document.querySelector("[data-contact-status]");

const setContactStatus = (message, type = "") => {
  if (!contactStatus) return;
  contactStatus.textContent = message;
  contactStatus.classList.toggle("is-success", type === "success");
  contactStatus.classList.toggle("is-error", type === "error");
};

contactForm?.querySelectorAll("input, select, textarea").forEach((field) => {
  const clearInvalid = () => field.classList.remove("is-invalid");
  field.addEventListener("input", clearInvalid);
  field.addEventListener("change", clearInvalid);
});

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fields = [...contactForm.querySelectorAll("input, select, textarea")];
  const invalidFields = fields.filter((field) => !field.checkValidity());
  fields.forEach((field) => field.classList.toggle("is-invalid", invalidFields.includes(field)));

  if (invalidFields.length) {
    setContactStatus("Please complete the highlighted fields.", "error");
    invalidFields[0].focus();
    return;
  }

  contactSubmit.disabled = true;
  contactSubmitLabel.textContent = "Sending…";
  setContactStatus("Sending securely…");

  try {
    const payload = Object.fromEntries(new FormData(contactForm).entries());
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));

    if (!response.ok) throw new Error(result.error || "Message could not be sent.");

    contactForm.reset();
    setContactStatus("Message sent. Fortunato will receive it directly.", "success");
  } catch (error) {
    setContactStatus(error.message || "Message could not be sent. Email fortunato@kleros.io directly.", "error");
  } finally {
    contactSubmit.disabled = false;
    contactSubmitLabel.textContent = "Send to Kleros";
  }
});
