/* ============================================================================
   ShineCars — assets/js/main.js
   ----------------------------------------------------------------------------
   ALL custom JavaScript for the ShineCars site lives here. No inline
   <script> blocks in index.html (except the vendor <script src> tags).

   Sections:
     0. Setup + helpers (reduced motion, CDN fallback loader)
     1. Mobile menu
     2. Services marquee (seamless loop)
     3. Scroll reveals (GSAP ScrollTrigger, with no-JS-safe fallback)
     4. Animated counters
     5. Hero parallax
     6. 3D tilt cards
     7. Pinned horizontal makeover journey
     8. Before / after shine slider
     9. Service quick-book links (preselect the booking form)
    10. Booking form: validate -> backend POST -> WhatsApp fallback
    11. Active nav / scrollspy + smooth anchor scrolling (Lenis)
    12. Magnetic premium buttons
    13. Motion bootstrap: Lenis + GSAP, with graceful fallbacks
    14. Cursor trail + hero/logo glow (canvas 2D; word reveal lives in §3)

   Libraries (local files, loaded before this file in index.html):
     - GSAP 3.13.0            assets/js/vendor/gsap.min.js
     - ScrollTrigger 3.13.0   assets/js/vendor/ScrollTrigger.min.js
     - Lenis 1.3.4            assets/js/vendor/lenis.min.js
   If a local vendor file fails to load, section 0 tries the same
   version from the jsDelivr CDN once, then falls back to the
   native (no-library) behaviours below — the page never breaks
   and content is never left hidden.
   ========================================================================== */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* 0. Setup + helpers                                                  */
  /* ------------------------------------------------------------------ */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var WA_NUMBER = '919811924347'; /* ShineCars WhatsApp number, no "+" */

  document.documentElement.classList.add('js');

  function $(id) { return document.getElementById(id); }
  function on(el, evt, fn, opts) { if (el) el.addEventListener(evt, fn, opts || false); }

  /* Load a script from a URL once; resolves true on load, false on error. */
  function loadScript(src) {
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = function () { resolve(true); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
    });
  }

  /* ------------------------------------------------------------------ */
  /* 1. Mobile menu                                                      */
  /* ------------------------------------------------------------------ */
  var burger = $('burger');
  var navLinks = $('navLinks');
  on(burger, 'click', function () {
    var open = navLinks.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.textContent = open ? '\u2715' : '\u2630';
  });
  on(navLinks, 'click', function (e) {
    if (e.target.tagName === 'A') {
      navLinks.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
      burger.textContent = '\u2630';
    }
  });

  /* ------------------------------------------------------------------ */
  /* 2. Services marquee — duplicate the track for a seamless loop      */
  /*    (the loop itself is the CSS animation in style.css)              */
  /* ------------------------------------------------------------------ */
  var mq = $('mqTrack');
  if (mq) mq.innerHTML += mq.innerHTML;

  /* ------------------------------------------------------------------ */
  /* 8. Before / after shine slider (no library needed)                  */
  /* ------------------------------------------------------------------ */
  var range = $('baRange'), after = $('baAfter'),
      handle = $('baHandle'), knob = $('baKnob'),
      afterImg = $('baAfterImg'), baBox = $('baBox');
  function baSet(v) {
    if (!range) return;
    after.style.clipPath = 'inset(0 0 0 ' + v + '%)';
    handle.style.left = v + '%';
    knob.style.left = v + '%';
    afterImg.style.width = baBox.clientWidth + 'px';
  }
  on(range, 'input', function () { baSet(range.value); });
  on(window, 'resize', function () { baSet(range.value); });
  baSet(55);

  /* ------------------------------------------------------------------ */
  /* 9. Service quick-book links preselect the booking form             */
  /*    (matches the human option label; the option *value* is the     */
  /*    machine value sent to the backend, e.g. "ceramic-coating")      */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = $('service'), want = a.getAttribute('data-service');
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].text.replace(/\s+/g, ' ').trim().indexOf(want.split(' (')[0]) === 0 ||
            sel.options[i].text.indexOf(want) > -1) {
          sel.selectedIndex = i;
          break;
        }
      }
    });
  });

  /* ------------------------------------------------------------------ */
  /* 10. Booking form: validate -> backend POST -> WhatsApp fallback     */
  /*     Payload: {customer_name, car_model, service, preferred_date,   */
  /*     location, source: "website-booking", submitted_at}              */
  /*     Backend is OFF by default: the form's data-backend-url is      */
  /*     empty, so bookings go straight to WhatsApp (today's flow).     */
  /*     Set data-backend-url="/api/book.php" (see api/book.php and     */
  /*     README > Booking backend) to POST to a backend instead; if     */
  /*     that POST fails, the form still falls back to WhatsApp so no   */
  /*     booking is ever lost. No payment is taken here; the slot is    */
  /*     confirmed on chat.                                              */
  /* ------------------------------------------------------------------ */
  var bookForm = $('booking-form');
  var submitBtn = $('booking-submit');
  var formStatus = $('form-status');
  var submitDefaultLabel = submitBtn ? submitBtn.textContent : '';
  var submitting = false;

  /* Don't let the date picker offer past dates. */
  (function () {
    var dateInput = $('preferred_date');
    if (dateInput && !dateInput.min) {
      dateInput.min = new Date().toISOString().slice(0, 10);
    }
  })();

  function setStatus(msg, kind) {
    if (!formStatus) return;
    formStatus.textContent = msg;
    formStatus.classList.remove('is-success', 'is-error');
    if (kind) formStatus.classList.add(kind);
  }
  function setSubmitting(on, label) {
    submitting = on;
    if (!submitBtn) return;
    submitBtn.disabled = on;
    submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
    if (label) submitBtn.textContent = label;
  }
  function selectedLabel(id) {
    var sel = $(id);
    return sel.options[sel.selectedIndex].text;
  }
  function openWhatsApp(payload) {
    var lines = ['Hi ShineCars! I want to book a detailing service.'];
    lines.push('Service: ' + selectedLabel('service'));
    if (payload.car_model) lines.push('Car: ' + payload.car_model);
    if (payload.preferred_date) lines.push('Preferred date: ' + payload.preferred_date);
    lines.push('Location: ' + selectedLabel('location'));
    if (payload.customer_name) lines.push('Name: ' + payload.customer_name);
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.join('\n')), '_blank');
  }
  function postBooking(payload, url) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 8000);
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw new Error('Backend returned HTTP ' + res.status);
      return res.json().catch(function () { return {}; });
    }).then(function (data) {
      if (data && data.ok === false) throw new Error(data.message || 'Backend rejected the booking');
      return data;
    }).catch(function (err) { clearTimeout(timer); throw err; });
  }
  on(bookForm, 'submit', function (e) {
    e.preventDefault();
    if (submitting) return; /* prevent double-submit */
    bookForm.classList.add('was-validated');
    if (!bookForm.checkValidity()) {
      bookForm.reportValidity();
      setStatus('Please fill in the highlighted fields.', 'is-error');
      return;
    }
    var payload = {
      customer_name: $('customer_name').value.trim(),
      car_model: $('car_model').value.trim(),
      service: $('service').value,
      preferred_date: $('preferred_date').value,
      location: $('location').value,
      source: 'website-booking',
      submitted_at: new Date().toISOString()
    };
    var backendUrl = (bookForm.getAttribute('data-backend-url') || '').trim();
    if (!backendUrl) {
      /* No backend configured (default): WhatsApp-only flow. */
      setSubmitting(true, 'Opening WhatsApp\u2026');
      openWhatsApp(payload);
      setStatus('Opening WhatsApp with your booking ready to send.', 'is-success');
      setTimeout(function () { setSubmitting(false, submitDefaultLabel); }, 2500);
      return;
    }
    setSubmitting(true, 'Sending\u2026');
    setStatus('', '');
    postBooking(payload, backendUrl).then(function () {
      setStatus('\u2713 Booking sent \u2014 we will confirm your slot on WhatsApp shortly.', 'is-success');
      submitBtn.textContent = '\u2713 Booking sent';
      bookForm.reset();
      setTimeout(function () { setSubmitting(false, submitDefaultLabel); setStatus('', ''); }, 5000);
    }).catch(function () {
      /* Backend failed: fall back to WhatsApp so no booking is lost. */
      openWhatsApp(payload);
      setStatus('Our booking system did not respond \u2014 opening WhatsApp instead so your booking still reaches us.', 'is-error');
      setSubmitting(false, submitDefaultLabel);
    });
  });

  /* ------------------------------------------------------------------ */
  /* 11a. Active nav / scrollspy (works with or without Lenis)          */
  /* ------------------------------------------------------------------ */
  var sectionIds = ['home', 'about', 'services', 'process', 'cafe', 'reviews', 'book'];
  var navAnchors = document.querySelectorAll('nav.links a');
  function updateActiveNav() {
    var cur = 'home';
    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.getBoundingClientRect().top < window.innerHeight * 0.45) cur = id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + cur);
    });
  }
  on(window, 'scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  /* ------------------------------------------------------------------ */
  /* 13. Motion bootstrap: Lenis smooth scroll + GSAP ScrollTrigger     */
  /*     Everything in here degrades gracefully — see the fallbacks.    */
  /* ------------------------------------------------------------------ */
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var lenis = null; /* exposed for anchor scrolling in section 11b */

  function ensureLibraries() {
    var jobs = [];
    if (!window.gsap) {
      jobs.push(loadScript(CDN + 'gsap@3.13.0/dist/gsap.min.js')
        .then(function (ok) { return ok ? loadScript(CDN + 'gsap@3.13.0/dist/ScrollTrigger.min.js') : false; }));
    }
    if (!window.Lenis) {
      jobs.push(loadScript(CDN + 'lenis@1.3.4/dist/lenis.min.js'));
    }
    if (!jobs.length) return Promise.resolve();
    /* Don't block the page on a slow CDN: 4s, then proceed regardless. */
    return Promise.race([
      Promise.all(jobs),
      new Promise(function (res) { setTimeout(res, 4000); })
    ]);
  }

  function initMotion() {
    var hasGsap = !!(window.gsap && window.ScrollTrigger);
    var hasLenis = !!window.Lenis;
    if (hasGsap) window.gsap.registerPlugin(window.ScrollTrigger);

    /* ---- Lenis smooth scroll -------------------------------------- */
    if (hasLenis && !reduceMotion) {
      lenis = new window.Lenis({ duration: 1.15, smoothWheel: true });
      if (hasGsap) {
        lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      } else {
        (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
      }
    }

    /* ---- 3. Scroll reveals ---------------------------------------- */
    if (hasGsap && !reduceMotion) {
      /* GSAP animates *from* hidden; CSS never hides .reveal, so a
         failed load can never leave content invisible. */
      window.gsap.utils.toArray('.reveal').forEach(function (el) {
        window.gsap.from(el, {
          y: 28, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      });
      /* Word-by-word headline reveal (borrowed from the Wedditors
         reference .note-word): each word lifts from opacity .22 /
         y 22px, staggered — a one-time entrance, not scrubbed, so
         it never fights the short pin. Without GSAP the words
         simply render normally; CSS never hides them. */
      var headWords = document.querySelectorAll('.word-reveal .w-word');
      if (headWords.length) {
        window.gsap.from(headWords, {
          y: 22, opacity: 0.22, duration: 0.7, ease: 'power3.out', stagger: 0.07,
          scrollTrigger: { trigger: '.pin-head', start: 'top 85%', once: true }
        });
      }
      /* Fail-safe: anything still transparent in the viewport after
         4s (e.g. a missed trigger) is shown immediately. */
      setTimeout(function () {
        document.querySelectorAll('.reveal').forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight &&
              window.getComputedStyle(el).opacity === '0') {
            window.gsap.set(el, { clearProps: 'all' });
          }
        });
      }, 4000);
    } else {
      /* No-library fallback: the original IntersectionObserver that
         adds .in (a no-op visually — content is visible by default). */
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.05, rootMargin: '0px 0px 18% 0px' });
      document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
      setTimeout(function () {
        document.querySelectorAll('.reveal:not(.in)').forEach(function (el) { el.classList.add('in'); });
      }, 3500);
    }

    /* ---- 4. Animated counters -------------------------------------- */
    var counters = document.querySelectorAll('[data-count]');
    if (hasGsap && !reduceMotion) {
      counters.forEach(function (el) {
        var end = parseInt(el.getAttribute('data-count'), 10);
        var obj = { v: 0 };
        window.gsap.to(obj, {
          v: end, duration: 1.2, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: function () { el.textContent = Math.round(obj.v); }
        });
      });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          cio.unobserve(en.target);
          var end = parseInt(en.target.getAttribute('data-count'), 10);
          if (reduceMotion) { en.target.textContent = end; return; }
          var t0 = null;
          (function tick(ts) {
            if (!t0) t0 = ts;
            var p = Math.min((ts - t0) / 1100, 1);
            en.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
          })(performance.now());
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }

    /* ---- 5. Hero parallax ------------------------------------------ */
    var heroImg = $('heroImg');
    if (heroImg && hasGsap && !reduceMotion) {
      window.gsap.to(heroImg, {
        yPercent: 18, scale: 1.06, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
      });
    } else if (heroImg && !reduceMotion) {
      on(window, 'scroll', function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          heroImg.style.transform = 'translateY(' + (y * 0.22) + 'px) scale(1.06)';
        }
      }, { passive: true });
    }

    /* ---- 6. 3D tilt cards ------------------------------------------ */
    if (!reduceMotion && canHover) {
      document.querySelectorAll('[data-tilt]').forEach(function (card) {
        if (hasGsap) {
          var rX = window.gsap.quickTo(card, 'rotationX', { duration: 0.5, ease: 'power3' });
          var rY = window.gsap.quickTo(card, 'rotationY', { duration: 0.5, ease: 'power3' });
          card.addEventListener('mousemove', function (e) {
            var r = card.getBoundingClientRect();
            rY(((e.clientX - r.left) / r.width - 0.5) * 9);
            rX(-((e.clientY - r.top) / r.height - 0.5) * 9);
          });
          card.addEventListener('mouseleave', function () { rX(0); rY(0); });
        } else {
          card.addEventListener('mousemove', function (e) {
            var r = card.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            card.style.transform = 'rotateY(' + (x * 9) + 'deg) rotateX(' + (-y * 9) + 'deg)';
          });
          card.addEventListener('mouseleave', function () {
            card.style.transform = 'rotateY(0deg) rotateX(0deg)';
            card.style.transition = 'transform .5s ease';
            setTimeout(function () { card.style.transition = ''; }, 500);
          });
        }
      });
    }

    /* ---- 7. Pinned horizontal makeover journey --------------------- */
    /* The pin itself stays CSS `position: sticky` (see .pin-sticky in
       style.css) — GSAP only drives the horizontal travel + progress
       bar, so the layout is identical with or without the library. */
    var pinWrap = document.querySelector('.pin-wrap');
    var track = $('pinTrack');
    var bar = $('pinProgress');
    if (pinWrap && track && bar) {
      /* FIX (2026-11-10): pin distance is computed from the real
         horizontal travel instead of a fixed 340vh. 100vh to show
         the section + ~0.9x the travel distance, clamped to
         150-210vh, so the sideways journey finishes quickly and
         the page releases into the next section right away.
         The no-GSAP fallback below derives its progress from
         pinWrap.offsetHeight, so it follows this height too. */
      var pinSetHeight = function () {
        if (window.innerWidth <= 860 || reduceMotion) { pinWrap.style.height = ''; return; }
        var travel = Math.max(track.scrollWidth - track.parentElement.clientWidth + 40, 0);
        var h = Math.round(window.innerHeight + travel * 0.9);
        h = Math.max(Math.min(h, window.innerHeight * 2.1), window.innerHeight * 1.5);
        pinWrap.style.height = h + 'px';
      };
      pinSetHeight();
      on(window, 'resize', function () {
        pinSetHeight();
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      });
      if (hasGsap && !reduceMotion) {
        window.gsap.matchMedia().add('(min-width: 861px)', function () {
          window.gsap.to(track, {
            x: function () {
              return -Math.max(track.scrollWidth - track.parentElement.clientWidth + 40, 0);
            },
            ease: 'none',
            scrollTrigger: {
              trigger: pinWrap, start: 'top top', end: 'bottom bottom',
              scrub: 0.3, invalidateOnRefresh: true,
              onUpdate: function (self) { bar.style.width = (self.progress * 100) + '%'; }
            }
          });
          return function () {
            window.gsap.set(track, { x: 0 });
            bar.style.width = '0%';
            pinWrap.style.height = '';
          };
        });
      } else {
        /* No-library fallback: the original scroll-driven translation. */
        var pinUpdate = function () {
          if (reduceMotion || window.innerWidth <= 860) return;
          var rect = pinWrap.getBoundingClientRect();
          var total = pinWrap.offsetHeight - window.innerHeight;
          var p = Math.min(Math.max(-rect.top / total, 0), 1);
          var max = track.scrollWidth - track.parentElement.clientWidth + 40;
          track.style.transform = 'translateX(' + (-p * Math.max(max, 0)) + 'px)';
          bar.style.width = (p * 100) + '%';
        };
        on(window, 'scroll', pinUpdate, { passive: true });
        on(window, 'resize', pinUpdate);
        pinUpdate();
      }
    }

    /* ---- 12. Magnetic premium buttons ------------------------------- */
    /* Small pull toward the cursor; hover devices only, never with
       reduced motion. Uses GSAP quickTo when available. */
    if (hasGsap && canHover && !reduceMotion) {
      document.querySelectorAll('.btn').forEach(function (btn) {
        var xTo = window.gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3' });
        var yTo = window.gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3' });
        btn.addEventListener('mousemove', function (e) {
          var r = btn.getBoundingClientRect();
          xTo((e.clientX - r.left - r.width / 2) * 0.18);
          yTo((e.clientY - r.top - r.height / 2) * 0.28);
        });
        btn.addEventListener('mouseleave', function () { xTo(0); yTo(0); });
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* 11b. Smooth anchor scrolling (needs Lenis if present)               */
  /* ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -72, duration: 1.2 });
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      /* Move keyboard focus to the section for accessibility. */
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });

  /* ------------------------------------------------------------------ */
  /* 11c. Back-to-top button: appears after scrolling down, smooth     */
  /*     scrolls to the top via Lenis when present.                     */
  /* ------------------------------------------------------------------ */
  var toTop = $('toTop');
  if (toTop) {
    var SHOW_AFTER = 600;
    function updateToTop() {
      toTop.classList.toggle('show', window.scrollY > SHOW_AFTER);
    }
    on(window, 'scroll', updateToTop, { passive: true });
    updateToTop();
    toTop.addEventListener('click', function () {
      if (lenis) lenis.scrollTo(0, { duration: reduceMotion ? 0 : 1.2 });
      else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

    /* ------------------------------------------------------------------ */
  /* 14. Tyre-track cursor trail + per-letter glow (rework 2026-11-10)  */
  /*     The old glowing water droplets read as FIRE, so they are gone  */
  /*     entirely. The trail is now fading tyre tread: as the cursor   */
  /*     moves it stamps small dark tread blocks in two parallel       */
  /*     lines, each rotated to the direction of travel — like a wheel  */
  /*     rolling past and leaving skid marks on the road. Warm-grey    */
  /*     tread + mix-blend-mode:difference (see #trailCanvas in        */
  /*     style.css) reads on light sections (it darkens) and on the    */
  /*     dark hero (it lightens). No glow, no bright orange, no fire.  */
  /*     Canvas 2D only, no new dependency. Hover devices only, never  */
  /*     with reduced motion; the rAF loop sleeps when idle.           */
  /* ------------------------------------------------------------------ */

  /* ---- 14a. Tyre tread trail -------------------------------------- */
  var trail = (function () {
    if (!canHover || reduceMotion) return null;
    var canvas = $('trailCanvas');
    if (!canvas) return null;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var marks = [], rafId = 0, running = false, lastMove = 0;
    var lastX = null, lastY = null, acc = 0;
    function resize() {
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    on(window, 'resize', resize);
    /* One tread stamp: two blocks, one per wheel line, offset
       perpendicular to the direction of travel. */
    function stamp(x, y, angle, speed) {
      if (marks.length > 120) marks.splice(0, marks.length - 120);
      var len = 9 + Math.min(speed * 0.12, 6); /* faster = longer skid */
      var px = Math.cos(angle + Math.PI / 2), py = Math.sin(angle + Math.PI / 2);
      [-7, 7].forEach(function (off) {
        marks.push({
          x: x + px * off, y: y + py * off,
          a: angle + (Math.random() - 0.5) * 0.08,
          len: len, w: 4.5, life: 1,
          decay: 0.009 + Math.random() * 0.004 /* ~1.5-2s fade */
        });
      });
    }
    function drawMark(m) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.a);
      var l = m.len / 2, w = m.w / 2;
      ctx.beginPath();
      ctx.moveTo(-l + 2, -w);
      ctx.lineTo(l - 2, -w);
      ctx.quadraticCurveTo(l, -w, l, -w + 2);
      ctx.lineTo(l, w - 2);
      ctx.quadraticCurveTo(l, w, l - 2, w);
      ctx.lineTo(-l + 2, w);
      ctx.quadraticCurveTo(-l, w, -l, w - 2);
      ctx.lineTo(-l, -w + 2);
      ctx.quadraticCurveTo(-l, -w, -l + 2, -w);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    function tick(now) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.globalCompositeOperation = 'difference';
      for (var i = marks.length - 1; i >= 0; i--) {
        var m = marks[i];
        m.life -= m.decay;
        if (m.life <= 0) { marks.splice(i, 1); continue; }
        ctx.globalAlpha = m.life * 0.21; /* 2026-11-10: halved again from 0.42 — user asked to reduce the trail by another 50% */
        /* Warm mid-grey: with 'difference' it darkens light
           backgrounds and lightens dark ones — one style, both. */
        ctx.fillStyle = '#8f8578';
        drawMark(m);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      if (marks.length === 0 && now - lastMove > 2000) {
        running = false; rafId = 0; return; /* sleep until next move */
      }
      rafId = requestAnimationFrame(tick);
    }
    function wake() {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    }
    on(document, 'mousemove', function (e) {
      var now = performance.now();
      lastMove = now;
      if (lastX === null) { lastX = e.clientX; lastY = e.clientY; return; }
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) return;
      acc += dist;
      var angle = Math.atan2(dy, dx);
      /* Stamp every ~26px of travel so the tread stays evenly spaced. */
      while (acc >= 26) {
        acc -= 26;
        var t = 1 - acc / dist;
        stamp(lastX + dx * t, lastY + dy * t, angle, dist);
      }
      lastX = e.clientX; lastY = e.clientY;
      wake();
    }, { passive: true });
    return { wake: wake };
  })();

  /* ---- 14b. Per-letter glow ---------------------------------------- */
  /* The old .glow-on lit the whole hero h1 / logo at once. Letters
     are now split into .ltr spans; on hover the glow sweeps through
     them one by one (~55ms stagger), each letter cycling orange ->
     gold -> warm white (dark backgrounds) or orange -> gold -> ink
     (light backgrounds), with a small jelly lift. The outlined
     "DELHI–NCR" letters keep their transparent fill + orange
     stroke and only gain a soft glow, never a fill. Section h2s
     (except the pin-head h2, which already has its word-by-word
     entrance) get the same letter-wave hover. The jelly is pure
     CSS (.ltr.lit transform with an overshoot easing) on purpose:
     GSAP inline transforms would fight the CSS transition. */
  (function () {
    if (!canHover || reduceMotion) return;
    function splitLetters(el, extraCls) {
      var nodes = Array.prototype.slice.call(el.childNodes);
      nodes.forEach(function (node) {
        if (node.nodeType === 3) {
          /* Split into WORDS first, then letters inside each word:
             every word lives in a .word span (white-space:nowrap),
             so a word can only wrap as a whole — its letters can
             never split across lines on resize. Spaces stay as
             bare text nodes between words, which is where wrapping
             is allowed to happen. */
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(part));
              return;
            }
            var w = document.createElement('span');
            w.className = 'word';
            part.split('').forEach(function (ch) {
              var sp = document.createElement('span');
              sp.className = 'ltr' + (extraCls ? ' ' + extraCls : '');
              sp.textContent = ch;
              w.appendChild(sp);
            });
            frag.appendChild(w);
          });
          el.replaceChild(frag, node);
        } else if (node.nodeType === 1) {
          if (node.classList.contains('w-word')) return; /* pin-head word reveal owns these */
          var cls = extraCls || '';
          if (node.classList.contains('out')) cls = (cls ? cls + ' ' : '') + 'out';
          splitLetters(node, cls);
        }
      });
    }
    function armWave(el, paletteCls) {
      splitLetters(el, '');
      var letters = el.querySelectorAll('.ltr');
      if (!letters.length) return;
      var timers = [];
      function clearTimers() { timers.forEach(clearTimeout); timers = []; }
      el.addEventListener('mouseenter', function () {
        clearTimers();
        letters.forEach(function (ltr, i) {
          timers.push(setTimeout(function () {
            ltr.classList.add('lit');
            var c = paletteCls[i % 3];
            if (c) ltr.classList.add(c);
          }, i * 55));
        });
      });
      el.addEventListener('mouseleave', function () {
        clearTimers();
        letters.forEach(function (ltr, i) {
          timers.push(setTimeout(function () {
            ltr.classList.remove('lit', 'c-gold', 'c-white', 'c-ink');
          }, i * 30));
        });
      });
    }
    var darkWave = ['', 'c-gold', 'c-white']; /* hero, footer logo: on dark */
    var lightWave = ['', 'c-gold', 'c-ink']; /* logo, h2s: on light */
    var h1 = document.querySelector('.hero h1');
    if (h1) armWave(h1, darkWave);
    var logo = document.querySelector('.logo .l1');
    if (logo) armWave(logo, lightWave);
    var footLogo = document.querySelector('.foot-logo .l1');
    if (footLogo) armWave(footLogo, darkWave);
    document.querySelectorAll('h2').forEach(function (h2) {
      if (h2.closest('.pin-head')) return;
      armWave(h2, h2.closest('.services, .shine, .cafe') ? darkWave : lightWave);
    });
  })();

/* ---- Boot: try the local vendor files first (already in the page);
     if any failed, try the CDN once, then run with what's available. -- */
  ensureLibraries().then(initMotion);
})();
