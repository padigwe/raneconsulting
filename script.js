/* =====================================================================
   Rane Consulting Limited — script.js
   Sections: (1) Config  (2) Mobile nav  (3) Hero circuit
             (4) Inquiry modal  (5) StaticForms handling  (6) Year
   ===================================================================== */

/* ----- (1) CONFIG ---------------------------------------------------
   >>> EDIT THESE VALUES <<<
   - STATICFORMS_KEY : paste your StaticForms access key
   - WHATSAPP_NUMBER : digits only, international format (no + or spaces)
-------------------------------------------------------------------- */
const STATICFORMS_KEY  = "YOUR_STATICFORMS_ACCESS_KEY";        // <-- replace
const STATICFORMS_URL   = "https://api.staticforms.xyz/submit";
const WHATSAPP_NUMBER   = "2347031308317";                     // <-- replace if needed
const WHATSAPP_MESSAGE  = "Hello Rane Consulting, I would like to make an inquiry about your services.";

// Build the WhatsApp link once and apply to every [data-wa] element.
(function applyWhatsApp() {
  const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  document.querySelectorAll("[data-wa]").forEach(el => el.setAttribute("href", link));
})();


/* ----- (2) MOBILE NAVIGATION --------------------------------------- */
(function mobileNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  if (!header || !toggle) return;

  toggle.addEventListener("click", () => {
    const open = header.classList.toggle("menu-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  // Close the menu after tapping a link
  header.querySelectorAll(".nav-menu a").forEach(a =>
    a.addEventListener("click", () => header.classList.remove("menu-open"))
  );
})();


/* ----- (3) HERO CIRCUIT --------------------------------------------
   Builds the SVG connector wires between the centre box and the
   service pills. Everything lives in a 1120 x 520 coordinate space so
   the wires and the percentage-positioned pills stay aligned at any
   screen size.
-------------------------------------------------------------------- */
(function heroCircuit() {
  const svg = document.getElementById("circuit");
  if (!svg) return;

  // Each wire: pill anchor (near the pill) -> box edge anchor.
  // colour alternates green / orange to match the brand.
  const WIRES = [
    { s: [212, 108], e: [310, 130], side: "L", colour: "green"  }, // Bookkeeping
    { s: [188, 250], e: [310, 250], side: "L", colour: "orange" }, // Tax Advisory
    { s: [212, 398], e: [310, 360], side: "L", colour: "orange" }, // Payroll
    { s: [905, 108], e: [810, 122], side: "R", colour: "green"  }, // Auditing
    { s: [920, 205], e: [810, 200], side: "R", colour: "green"  }, // Financial Reporting
    { s: [912, 300], e: [810, 290], side: "R", colour: "orange" }, // CAC Registration
    { s: [898, 398], e: [810, 360], side: "R", colour: "green"  }, // Due Diligence
    { s: [560, 458], e: [560, 408], side: "B", colour: "orange" }  // Software Setup
  ];

  // --- defs (gradients + glow filter) ---
  const NS = "http://www.w3.org/2000/svg";
  svg.setAttribute("viewBox", "0 0 1120 520");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.innerHTML = `
    <defs>
      <linearGradient id="wireDim" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#1a7a47"/>
        <stop offset="1" stop-color="#2f9a5f"/>
      </linearGradient>
      <linearGradient id="flowGreen" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#1a7a47" stop-opacity="0"/>
        <stop offset=".5" stop-color="#5dffa0"/>
        <stop offset="1" stop-color="#eafff2"/>
      </linearGradient>
      <linearGradient id="flowOrange" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#f26b21" stop-opacity="0"/>
        <stop offset=".5" stop-color="#ff9b56"/>
        <stop offset="1" stop-color="#ffe7c7"/>
      </linearGradient>
      <filter id="wireGlow" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="2.4" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>`;

  // rounded orthogonal path through a list of [x,y] waypoints
  function roundedPath(pts, r) {
    if (pts.length === 2) return `M ${pts[0][0]} ${pts[0][1]} L ${pts[1][0]} ${pts[1][1]}`;
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
      // trim point coming in
      const inLen = Math.hypot(cx - px, cy - py);
      const ri = Math.min(r, inLen / 2);
      const ix = cx - (cx - px) / inLen * ri, iy = cy - (cy - py) / inLen * ri;
      // trim point going out
      const outLen = Math.hypot(nx - cx, ny - cy);
      const ro = Math.min(r, outLen / 2);
      const ox = cx + (nx - cx) / outLen * ro, oy = cy + (ny - cy) / outLen * ro;
      d += ` L ${ix.toFixed(1)} ${iy.toFixed(1)} Q ${cx} ${cy} ${ox.toFixed(1)} ${oy.toFixed(1)}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last[0]} ${last[1]}`;
    return d;
  }

  const wrap = document.createElementNS(NS, "g");
  svg.appendChild(wrap);

  WIRES.forEach((w, i) => {
    let pts;
    if (w.side === "B") {
      pts = [w.s, w.e];
    } else {
      const midX = w.s[0] + (w.e[0] - w.s[0]) * 0.45;
      pts = [w.s, [midX, w.s[1]], [midX, w.e[1]], w.e];
    }
    const d = roundedPath(pts, 16);

    const base = document.createElementNS(NS, "path");
    base.setAttribute("d", d); base.setAttribute("class", "wire-base");
    wrap.appendChild(base);

    const flow = document.createElementNS(NS, "path");
    flow.setAttribute("d", d);
    flow.setAttribute("pathLength", "100");
    flow.setAttribute("class", "wire-flow " + w.colour);
    flow.style.animationDelay = (-i * 0.42) + "s";
    wrap.appendChild(flow);

    // glowing node where the wire meets the pill
    const n = document.createElementNS(NS, "circle");
    n.setAttribute("cx", w.s[0]); n.setAttribute("cy", w.s[1]); n.setAttribute("r", "4");
    n.setAttribute("class", "node " + w.colour);
    n.style.animationDelay = (-i * 0.3) + "s";
    wrap.appendChild(n);

    // small node where the wire meets the box
    const n2 = document.createElementNS(NS, "circle");
    n2.setAttribute("cx", w.e[0]); n2.setAttribute("cy", w.e[1]); n2.setAttribute("r", "2.4");
    n2.setAttribute("class", "node-end");
    wrap.appendChild(n2);
  });
})();


/* ----- (4) INQUIRY MODAL ------------------------------------------- */
(function inquiryModal() {
  const overlay = document.getElementById("inquiryModal");
  if (!overlay) return;
  const select = overlay.querySelector('select[name="service"]');
  let lastFocused = null;

  function open(preselect) {
    lastFocused = document.activeElement;
    if (preselect && select) {
      [...select.options].forEach(o => { if (o.value === preselect) select.value = preselect; });
    }
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const first = overlay.querySelector("input, select, textarea");
    if (first) setTimeout(() => first.focus(), 60);
  }
  function close() {
    overlay.classList.remove("open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  }

  // Any element with data-open-modal opens it; an optional value pre-selects a service.
  document.querySelectorAll("[data-open-modal]").forEach(btn =>
    btn.addEventListener("click", e => { e.preventDefault(); open(btn.getAttribute("data-service")); })
  );
  overlay.querySelectorAll("[data-close-modal]").forEach(el =>
    el.addEventListener("click", close)
  );
  overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && overlay.classList.contains("open")) close(); });
})();


/* ----- (5) STATICFORMS SUBMISSION ----------------------------------
   Works for every form with class .sf-form (contact page + modal).
   Submits via fetch so the page never reloads, then shows a status
   message. The honeypot field blocks basic spam bots.
-------------------------------------------------------------------- */
(function staticForms() {
  document.querySelectorAll(".sf-form").forEach(form => {
    const status = form.querySelector(".form-status");
    const submit = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (status) { status.className = "form-status"; status.textContent = ""; }

      // honeypot: if filled, silently pretend success (it's a bot)
      const hp = form.querySelector('input[name="honeypot"]');
      if (hp && hp.value) { showOk(); return; }

      if (STATICFORMS_KEY === "YOUR_STATICFORMS_ACCESS_KEY") {
        showErr("Form not configured yet. Add your StaticForms access key in script.js.");
        return;
      }

      const original = submit ? submit.innerHTML : "";
      if (submit) { submit.disabled = true; submit.innerHTML = "Sending..."; }

      try {
        const data = new FormData(form);
        const res = await fetch(STATICFORMS_URL, {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: data
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && (json.success === undefined || json.success)) {
          form.reset();
          showOk();
        } else {
          showErr(json.message || "Something went wrong. Please try again or reach us on WhatsApp.");
        }
      } catch (err) {
        showErr("Network error. Please try again or reach us on WhatsApp.");
      } finally {
        if (submit) { submit.disabled = false; submit.innerHTML = original; }
      }
    });

    function showOk() {
      if (!status) return;
      status.className = "form-status ok show";
      status.textContent = "Thank you. Your message has been sent — our team will be in touch shortly.";
    }
    function showErr(msg) {
      if (!status) return;
      status.className = "form-status err show";
      status.textContent = msg;
    }
  });
})();


/* ----- (6) FOOTER YEAR --------------------------------------------- */
document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
