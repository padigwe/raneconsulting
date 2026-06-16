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
   Draws the animated connector wires between the centre box and the
   service pills. Anchors are MEASURED from the real DOM positions of
   the pills and the box, so every pill (including Tax Advisory) stays
   perfectly connected at any width. The SVG coordinate space is set
   to the stage's pixel size (1 unit = 1px), so wires and pills line up
   exactly. On mobile the same engine draws a compact central "spine"
   with branches to each pill, keeping the circuit identity.
-------------------------------------------------------------------- */
(function heroCircuit() {
  const svg   = document.getElementById("circuit");
  const stage = document.querySelector(".hero-stage");
  const box   = document.querySelector(".hero-box");
  if (!svg || !stage || !box) return;
  const NS = "http://www.w3.org/2000/svg";
  const pills = [...stage.querySelectorAll(".pill")];

  const DEFS = `
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

  // geometry of an element relative to the stage
  function rel(el) {
    const a = el.getBoundingClientRect(), s = stage.getBoundingClientRect();
    return {
      l: a.left - s.left, t: a.top - s.top,
      r: a.right - s.left, b: a.bottom - s.top,
      cx: a.left - s.left + a.width / 2,
      cy: a.top - s.top + a.height / 2,
      w: a.width, h: a.height
    };
  }

  // drop points that coincide with the previous one
  function dedupe(pts) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = out[out.length - 1], q = pts[i];
      if (Math.abs(p[0] - q[0]) > 0.5 || Math.abs(p[1] - q[1]) > 0.5) out.push(q);
    }
    return out;
  }

  // rounded orthogonal path through [x,y] waypoints
  function roundedPath(raw, r) {
    const pts = dedupe(raw);
    if (pts.length <= 2) return `M ${pts[0][0]} ${pts[0][1]} L ${pts[pts.length-1][0]} ${pts[pts.length-1][1]}`;
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
      const inLen = Math.hypot(cx - px, cy - py) || 1;
      const ri = Math.min(r, inLen / 2);
      const ix = cx - (cx - px) / inLen * ri, iy = cy - (cy - py) / inLen * ri;
      const outLen = Math.hypot(nx - cx, ny - cy) || 1;
      const ro = Math.min(r, outLen / 2);
      const ox = cx + (nx - cx) / outLen * ro, oy = cy + (ny - cy) / outLen * ro;
      d += ` L ${ix.toFixed(1)} ${iy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ox.toFixed(1)} ${oy.toFixed(1)}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last[0].toFixed(1)} ${last[1].toFixed(1)}`;
    return d;
  }

  function mk(tag, attrs) {
    const el = document.createElementNS(NS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }

  // one connector: dim base + animated flow + glowing nodes at each end
  function addWire(d, colour, startPt, endPt, delay, startR, endR) {
    svg.appendChild(mk("path", { d, class: "wire-base" }));
    const flow = mk("path", { d, pathLength: "100", class: "wire-flow " + colour });
    flow.style.animationDelay = delay + "s";
    svg.appendChild(flow);
    if (endPt)   svg.appendChild(mk("circle", { cx: endPt[0],   cy: endPt[1],   r: endR   || 2.6, class: "node-end" }));
    if (startPt) {
      const n = mk("circle", { cx: startPt[0], cy: startPt[1], r: startR || 4.5, class: "node " + colour });
      n.style.animationDelay = delay + "s";
      svg.appendChild(n);
    }
  }

  // evenly spaced port positions between lo and hi
  function ports(n, lo, hi) {
    if (n <= 1) return [(lo + hi) / 2];
    const out = [];
    for (let i = 0; i < n; i++) out.push(lo + (hi - lo) * i / (n - 1));
    return out;
  }

  function buildDesktop(b) {
    const left = [], right = [], bottom = [], top = [];
    pills.forEach(p => {
      const r = rel(p);
      r.colour = p.dataset.flow || "green";
      if (r.cx < b.l)      left.push(r);
      else if (r.cx > b.r) right.push(r);
      else if (r.cy > b.cy) bottom.push(r);
      else top.push(r);
    });
    const pad = 30;

    left.sort((a, c) => a.cy - c.cy);
    const lp = ports(left.length, b.t + pad, b.b - pad);
    left.forEach((r, i) => {
      const start = [r.r - 2, r.cy], end = [b.l, lp[i]];
      const trunk = b.l - 34 - i * 16;
      addWire(roundedPath([start, [trunk, start[1]], [trunk, end[1]], end], 14),
              r.colour, start, end, -i * 0.5);
    });

    right.sort((a, c) => a.cy - c.cy);
    const rp = ports(right.length, b.t + pad, b.b - pad);
    right.forEach((r, i) => {
      const start = [r.l + 2, r.cy], end = [b.r, rp[i]];
      const trunk = b.r + 34 + i * 16;
      addWire(roundedPath([start, [trunk, start[1]], [trunk, end[1]], end], 14),
              r.colour, start, end, -i * 0.5 - 0.25);
    });

    bottom.sort((a, c) => a.cx - c.cx);
    const bp = ports(bottom.length, b.l + b.w * 0.3, b.r - b.w * 0.3);
    bottom.forEach((r, i) => {
      const start = [r.cx, r.t + 2], end = [bp[i], b.b];
      const midY = (start[1] + end[1]) / 2;
      addWire(roundedPath([start, [start[0], midY], [end[0], midY], end], 14),
              r.colour, start, end, -i * 0.5 - 0.4);
    });

    top.sort((a, c) => a.cx - c.cx);
    const tp = ports(top.length, b.l + b.w * 0.3, b.r - b.w * 0.3);
    top.forEach((r, i) => {
      const start = [r.cx, r.b - 2], end = [tp[i], b.t];
      const midY = (start[1] + end[1]) / 2;
      addWire(roundedPath([start, [start[0], midY], [end[0], midY], end], 14),
              r.colour, start, end, -i * 0.5 - 0.6);
    });
  }

  function buildMobile(b) {
    const spineX = b.cx;
    let maxY = b.b;
    const branches = pills.map(p => {
      const r = rel(p);
      maxY = Math.max(maxY, r.cy);
      return { y: r.cy, innerX: r.cx < spineX ? r.r : r.l, colour: p.dataset.flow || "green" };
    });

    // central spine running down from the box
    const spineD = `M ${spineX.toFixed(1)} ${b.b.toFixed(1)} L ${spineX.toFixed(1)} ${maxY.toFixed(1)}`;
    svg.appendChild(mk("path", { d: spineD, class: "wire-base" }));
    const spineFlow = mk("path", { d: spineD, pathLength: "100", class: "wire-flow green" });
    spineFlow.style.animationDelay = "0s";
    svg.appendChild(spineFlow);
    const topNode = mk("circle", { cx: spineX, cy: b.b, r: 4.5, class: "node green" });
    svg.appendChild(topNode);

    // a branch taps off the spine to each pill
    branches.forEach((br, i) => {
      const d = `M ${spineX.toFixed(1)} ${br.y.toFixed(1)} L ${br.innerX.toFixed(1)} ${br.y.toFixed(1)}`;
      svg.appendChild(mk("path", { d, class: "wire-base" }));
      const flow = mk("path", { d, pathLength: "100", class: "wire-flow " + br.colour });
      flow.style.animationDelay = (-i * 0.32) + "s";
      svg.appendChild(flow);
      svg.appendChild(mk("circle", { cx: spineX, cy: br.y, r: 2.4, class: "node-end" }));
      const pn = mk("circle", { cx: br.innerX, cy: br.y, r: 4, class: "node " + br.colour });
      pn.style.animationDelay = (-i * 0.32) + "s";
      svg.appendChild(pn);
    });
  }

  function build() {
    const s = stage.getBoundingClientRect();
    if (!s.width || !s.height) return;
    svg.setAttribute("viewBox", `0 0 ${s.width.toFixed(1)} ${s.height.toFixed(1)}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.innerHTML = DEFS;
    const b = rel(box);
    if (window.matchMedia("(max-width: 880px)").matches) buildMobile(b);
    else buildDesktop(b);
  }

  // (re)build at the right moments: now, after fonts settle, on resize
  let raf = null;
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(build); }
  build();
  window.addEventListener("resize", schedule);
  window.addEventListener("orientationchange", schedule);
  window.addEventListener("load", schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
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
