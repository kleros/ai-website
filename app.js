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

const stageRail = document.querySelector("[data-stage-rail]");
const stageLinks = [...document.querySelectorAll("[data-stage-rail] a")];
const lifecycleSections = [...document.querySelectorAll("[data-lifecycle-section]")];
const lifecycleSection = document.querySelector(".lifecycle");

if (stageRail && stageLinks.length && lifecycleSections.length && lifecycleSection) {
  const markActive = (id) => {
    stageLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  const syncRail = () => {
    const band = lifecycleSection.getBoundingClientRect();
    // The rail only means anything inside the lifecycle; elsewhere it fades out.
    const inside = band.top < window.innerHeight * 0.7 && band.bottom > window.innerHeight * 0.3;
    stageRail.classList.toggle("is-visible", inside);
    if (!inside) return;

    // The stage whose top has most recently passed the reading line wins.
    const readingLine = window.scrollY + window.innerHeight * 0.42;
    let active = lifecycleSections[0];
    lifecycleSections.forEach((section) => {
      if (section.getBoundingClientRect().top + window.scrollY <= readingLine) active = section;
    });
    markActive(active.id);
  };

  markActive(lifecycleSections[0].id);
  syncRail();
  window.addEventListener("scroll", syncRail, { passive: true });
  window.addEventListener("resize", syncRail);
}

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


document.querySelectorAll("[data-checkout-cli]").forEach((terminal) => {
  const replay = () => {
    terminal.classList.remove("is-running");
    void terminal.offsetWidth;
    terminal.classList.add("is-running");
  };

  terminal.querySelector("[data-cli-replay]")?.addEventListener("click", replay);

  if (reduceMotion || !("IntersectionObserver" in window)) {
    terminal.classList.add("is-running");
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      replay();
      observer.disconnect();
    },
    { threshold: 0.35 },
  );
  observer.observe(terminal);
});

document.querySelectorAll("[data-checkout-demo]").forEach((demo) => {
  const buttons = [...demo.querySelectorAll("[data-checkout-state]")];
  const result = demo.querySelector("[data-checkout-result]");

  const setCheckoutState = (state) => {
    const delivered = state === "delivered";
    buttons.forEach((button) => {
      const active = button.dataset.checkoutState === state;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    result?.classList.toggle("is-problem", !delivered);
    if (result) {
      result.querySelector("span").textContent = delivered ? "✓" : "↗";
      result.querySelector("strong").textContent = delivered ? "Payment settles automatically" : "Support path opens automatically";
    }
  };

  buttons.forEach((button) => button.addEventListener("click", () => setCheckoutState(button.dataset.checkoutState)));
  setCheckoutState("delivered");
});

document.querySelectorAll("[data-verify-demo]").forEach((demo) => {
  const rules = [...demo.querySelectorAll("[data-verify-rule]")];
  const score = demo.querySelector("[data-verify-score]");
  const result = demo.querySelector("[data-verify-result]");

  const updateVerification = () => {
    const activeRules = rules.filter((rule) => rule.classList.contains("is-active")).length;
    const scores = [0, 62, 81, 99];
    if (score) score.textContent = `${scores[activeRules]}%`;
    const granted = activeRules === rules.length;
    result?.classList.toggle("is-review", !granted);
    if (result) result.querySelector("strong").textContent = granted ? "ACCESS GRANTED" : "NEEDS REVIEW";
    rules.forEach((rule) => rule.setAttribute("aria-pressed", String(rule.classList.contains("is-active"))));
  };

  rules.forEach((rule) => {
    rule.addEventListener("click", () => {
      rule.classList.toggle("is-active");
      updateVerification();
    });
  });
  updateVerification();
});

const reviewRoutes = [
  { tier: "LIGHTWEIGHT", reviewer: "Fast agent review" },
  { tier: "ADVANCED", reviewer: "Advanced agent panel" },
  { tier: "HUMAN", reviewer: "Human jurors" },
];

document.querySelectorAll("[data-route-demo]").forEach((demo) => {
  const input = demo.querySelector("[data-route-input]");
  const tier = demo.querySelector("[data-route-tier]");
  const result = demo.querySelector("[data-route-result]");
  const updateRoute = () => {
    const route = reviewRoutes[Number(input?.value || 0)];
    if (tier) tier.textContent = route.tier;
    if (result) result.textContent = route.reviewer;
  };
  input?.addEventListener("input", updateRoute);
  updateRoute();
});

document.querySelectorAll("[data-adoption-switcher]").forEach((switcher) => {
  const tabs = [...switcher.querySelectorAll("[data-adoption-tab]")];
  const panels = [...switcher.querySelectorAll("[data-adoption-panel]")];

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const selected = tab.dataset.adoptionTab;
      tabs.forEach((candidate) => {
        const active = candidate === tab;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-selected", String(active));
        candidate.tabIndex = active ? 0 : -1;
      });
      panels.forEach((panel) => { panel.hidden = panel.dataset.adoptionPanel !== selected; });
    });
  });
});

const productSelect = document.querySelector("[data-product-select]");
document.querySelectorAll("[data-product-interest]").forEach((link) => {
  link.addEventListener("click", () => {
    if (!productSelect) return;
    productSelect.value = link.dataset.productInterest;
    productSelect.classList.remove("is-invalid");
  });
});

const interestSelect = document.querySelector("[data-interest-select]");
const organizationLabel = document.querySelector("[data-organization-label]");
const organizationInput = document.querySelector("[data-organization-input]");
const JUROR_WAITLIST = "AI Juror Waitlist";

const syncOrganizationField = () => {
  if (!interestSelect || !organizationLabel || !organizationInput) return;
  const waitlist = interestSelect.value === JUROR_WAITLIST;
  organizationLabel.innerHTML = waitlist
    ? "Telegram or X handle <em>Optional</em>"
    : "Company or project <em>Optional</em>";
  organizationInput.placeholder = waitlist ? "@yourhandle" : "Project name";
  organizationInput.autocomplete = waitlist ? "off" : "organization";
};

interestSelect?.addEventListener("change", syncOrganizationField);
syncOrganizationField();

document.querySelectorAll("[data-interest-preset]").forEach((link) => {
  link.addEventListener("click", () => {
    if (!interestSelect) return;
    interestSelect.value = link.dataset.interestPreset;
    interestSelect.classList.remove("is-invalid");
    syncOrganizationField();
  });
});

const contactForm = document.querySelector("[data-contact-form]");
const contactSubmit = document.querySelector("[data-contact-submit]");
const contactSubmitLabel = document.querySelector("[data-contact-submit-label]");
const contactSubmitDefaultLabel = contactSubmitLabel?.textContent || "Send to Kleros";
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
    const formData = new FormData(contactForm);
    formData.set("form-name", contactForm.getAttribute("name") || "contact");

    const response = await fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    });

    if (!response.ok) throw new Error("Message could not be sent.");

    contactForm.reset();
    setContactStatus("Message sent. The Kleros team will be in touch.", "success");
  } catch (error) {
    console.error("Contact form submission failed", error);
    setContactStatus("Message could not be sent. Email ai@kleros.io directly.", "error");
  } finally {
    contactSubmit.disabled = false;
    contactSubmitLabel.textContent = contactSubmitDefaultLabel;
  }
});
