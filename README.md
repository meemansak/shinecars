# ShineCars — Website (developer-editable static site)

Premium one-page website for **ShineCars**, Delhi NCR car detailing
specialist since 2014, with **Kafe ShineCars** next door.
Live at <https://meemansak.github.io/shinecars/> (repo: `meemansak/shinecars`).

No build step, no backend, no database. Plain HTML + CSS + JavaScript,
hostable anywhere that serves static files.

## File map

```
shinecars-site/
├── index.html                  # ALL page content (semantic HTML only)
├── .htaccess                   # Optional: compression + browser caching (Apache hosts)
├── api/
│   └── book.php                # Optional booking backend stub (PHP, see below)
├── README.md                   # This file
└── assets/
    ├── css/
    │   └── style.css           # ALL custom styles (variables, buttons, sections,
    │                           #   responsive + reduced-motion). Edit here, not in HTML.
    ├── js/
    │   ├── main.js             # ALL custom JavaScript, commented by section
    │   └── vendor/
    │       ├── gsap.min.js         # GSAP 3.13.0 (local copy)
    │       ├── ScrollTrigger.min.js# GSAP ScrollTrigger 3.13.0 (local copy)
    │       └── lenis.min.js        # Lenis 1.3.4 smooth scroll (local copy)
    └── images/
        ├── favicon.svg
        ├── hero-foam.jpg           # Hero background: foam-covered black car
        ├── foam-sedan.jpg          # Hero card + foam-wash service + process step 2
        ├── interior-leather.jpg    # About collage + interior service
        ├── polishing-gloss.jpg     # About float + graphene + before/after slider
        ├── ppf-application.jpg     # PPF service + process step 4
        ├── ceramic-coating.jpg     # Ceramic service + process step 3
        ├── cafe-interior.jpg       # Process step 1 + cafe main photo
        └── cafe-meal.webp          # Cafe meal photo
```

Images are the same photos as the original single-file site, extracted
from it (8 unique files, ~1.6 MB total) and referenced by relative path.
No base64 images remain in `index.html`.

## Libraries

| Library | Version | File | Purpose |
|---|---|---|---|
| GSAP | 3.13.0 | `assets/js/vendor/gsap.min.js` | Scroll reveals, counters, parallax, tilt, magnetic buttons |
| GSAP ScrollTrigger | 3.13.0 | `assets/js/vendor/ScrollTrigger.min.js` | Scroll-driven animations, pinned journey |
| Lenis | 1.3.4 | `assets/js/vendor/lenis.min.js` | Smooth scrolling + smooth anchor jumps |

Vendor files are stored **locally**, so the site works even if a CDN is
unreachable. If a local file ever fails to load, `main.js` tries the same
version from jsDelivr once, then falls back to native scrolling and the
original scroll handlers — content is never hidden and the page never
breaks.

## Typography (luxury system)

Loaded from Google Fonts with `preconnect` and `display=swap`,
with serif / sans fallbacks in the `--font-*` variables in
`assets/css/style.css`:

| Role | Font | Why |
|---|---|---|
| Big headlines, hero, logo, all section/service/step titles | **Bodoni Moda** 400/500/600 (opsz 6–96) | Didone high-fashion display face — Vogue / luxury-house register, uppercase with generous letter-spacing, sharp thick-thin contrast at large sizes |
| Accent words & quotes only | **Bodoni Moda** italic 400/500 | High-contrast serif italic for the accent phrase ("step by step", cafe headline) and the visitor quote — never a headline face any more |
| Eyebrow labels, nav, small caps, marquee | **Manrope** 500/600/700 | Clean geometric sans, uppercase with 0.18–0.28em letter-spacing |
| Body, buttons, UI, forms | **Manrope** 300/400/500/600 | Clean, modern, premium-feeling sans; wide tracking reads as luxury |
| Tiny notes only | **Manrope** | Used just for `.form-note` / `.shine-note` |

The luxury feel also comes from the gold accent (`--gold: #c98a2d`,
used for eyebrows on light sections), generous letter-spacing and
thin weights — not from changing the brand colours, which stay
orange `#f45d12`, deep navy `#0b1c24` and warm paper `#f7f3ec`.
To change a font, swap the Google Fonts link in `index.html` and
the matching `--font-*` variable in `style.css`.

## Booking backend (optional)

The booking form works **without any backend**: by default it opens
WhatsApp (`wa.me/919811924347`) with the booking details filled in.

### Payload shape

When a backend is configured, `assets/js/main.js` POSTs this JSON:

```json
{
  "customer_name": "Rohan Sharma",
  "car_model": "Hyundai Creta",
  "service": "ceramic-coating",
  "preferred_date": "2026-11-15",
  "location": "studio",
  "source": "website-booking",
  "submitted_at": "2026-11-10T10:30:00.000Z"
}
```

Field names in the form: `customer_name`, `car_model`, `service`,
`preferred_date`, `location` — each with a matching `id`, `label for`,
`type`, `required` and `autocomplete`. Service values are machine
values (`ppf`, `ceramic-coating`, `graphene-coating`, `foam-wash`,
`interior-detailing`, `paint-correction`, `complete-makeover`,
`home-office-cleaning`); the human labels are what the visitor sees.
Location values are `studio` ("At the studio (CR Park)") and
`doorstep` ("Doorstep service").

The form's submit handler validates with the browser (`required` +
`checkValidity()`), blocks double-submits, POSTs with an 8-second
timeout, and shows success/error states on the button and in the
`#form-status` line. **If no backend is configured, or the POST fails,
it falls back to opening WhatsApp** — so a booking is never lost.

### Switching from WhatsApp-only to backend

1. Upload the `api/` folder with the rest of the site
   (Hostinger/HostGator: inside `public_html`, next to `index.html`).
   `api/book.php` accepts POST JSON or form data, validates and
   sanitises the same fields, and returns
   `{"ok": true, "message": "..."}` (or `{"ok": false, ...}` with a
   per-field `errors` object on HTTP 400). It has clearly commented
   placeholders for saving to MySQL (PDO prepared statement) and
   sending an email — fill in your own credentials, never commit them.
2. In `index.html`, find the booking form and set:
   `data-backend-url="/api/book.php"` (it ships empty, which means
   WhatsApp-only). The `action="/api/bookings"` on the form is the
   logical endpoint name; `data-backend-url` is the switch the JS
   actually uses.
3. Test with a real booking; on success the button reads
   "✓ Booking sent" and the form resets.

To go back to WhatsApp-only, clear `data-backend-url` again.

## How to edit

| Change | Where |
|---|---|
| Text, services, phone, hours, links | `index.html` — search for the words; keep the structure |
| Colours, fonts, spacing, buttons | `assets/css/style.css` — change the `:root` variables at the top; button styles are in the "Premium buttons" section at the end |
| Animations, booking form, slider | `assets/js/main.js` — sections are numbered and commented |
| Photos | Replace the file in `assets/images/` with the same filename, or update the `src="assets/images/…"` in `index.html` |
| WhatsApp number | `assets/js/main.js` — `WA_NUMBER` at the top (currently `919811924347`); the floating WhatsApp button link is in `index.html` |
| Booking backend | `index.html` — form `data-backend-url` (empty = WhatsApp-only); `api/book.php` — validation, DB/email placeholders |
| Cafe website button | `index.html` — "Visit Kafe ShineCars Website" currently opens `@kafeshinecars` on Instagram; point it at the new cafe site URL when that site launches |

**Do not invent content:** prices, stats and testimonials on the page are
the ones from shinecars.in / the business's public listings. If the
business changes a price or phone number, update it in `index.html`
(and `WA_NUMBER` in `main.js` if the WhatsApp number changes).

## Test locally

```bash
cd shinecars-site
python3 -m http.server 8000
# open http://localhost:8000/ in a browser
```

Check: page loads, no console errors, no sideways scroll on mobile,
pinned makeover journey moves as you scroll, before/after slider drags,
booking form opens WhatsApp with the details filled in.

## Deploy

### Hostinger / HostGator (shared hosting)

1. In hPanel / cPanel, open **File Manager** → `public_html`
   (for an addon domain, that domain's document root instead).
2. Upload **everything** in this folder — `index.html`, `.htaccess`,
   `assets/` — keeping the folder structure.
3. No build, no Node, no database, no extra setup. Open the domain;
   the site is live.
4. `.htaccess` is safe on Apache hosts (Hostinger/HostGator) and only
   enables compression + caching. If your host is not Apache, delete
   `.htaccess` — the site works without it.

### GitHub Pages

1. Copy `index.html` and `assets/` into the repo (root, `main` branch).
   `.htaccess` is ignored by Pages and can be left out.
2. Repo → **Settings → Pages → Deploy from a branch → main, / (root) → Save**.
3. Site goes live at `https://<username>.github.io/<repo>/`.

### Custom domain (e.g. shinecars.in)

Point the domain's DNS at the host (Hostinger/HostGator nameservers or
an A/CNAME record per the host's guide), upload as above, and enable
the host's free SSL. No code changes are needed.
