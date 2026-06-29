# StudentWorks — Frontend UI Design Specification

## Project Identity

- **Name:** StudentWorks
- **Tagline:** Kuliah. Kerja. Berkembang.
- **Language:** Indonesian (Bahasa Indonesia) — all UI text must be in Indonesian
- **Purpose:** Freelance marketplace connecting university students with clients. Features include verified academic skills, escrow payments, Safe Zone (exam lock), and project-based chat.

---

## Tech Stack

| Technology | Purpose | Version / Source |
|---|---|---|
| **Tailwind CSS** | Utility-first CSS framework | CDN (`cdn.tailwindcss.com`) |
| **EJS** | Server-side templating | npm package, rendered via Express |
| **GSAP + ScrollTrigger** | Landing page scroll animations | `3.12.5` via cdnjs CDN |
| **Lucide Icons** | SVG icon library (replaces all emojis) | `latest` via unpkg CDN |
| **Google Fonts** | Typography | Plus Jakarta Sans + Inter |
| **Unsplash** | Stock photos for hero and talent cards | Direct image URLs |

### CDN Script Order (in `partials/header.ejs`)
```html
<script src="https://cdn.tailwindcss.com"></script>
<!-- Google Fonts link -->
<script> tailwind.config = { ... } </script>
<style> /* All custom CSS */ </style>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```

---

## Design System

### Color Palette (Tailwind custom tokens)

| Token | Hex | Usage |
|---|---|---|
| `idb-blue` | `#0F4C81` | Primary brand, buttons, links |
| `idb-blue-dark` | `#1A365D` | Headings, dark backgrounds, CTA gradient |
| `idb-blue-light` | `#2B6CB0` | Accent, hover states, gradients |
| `idb-orange` | `#FF6B35` | Primary CTA, highlights, role badge (Klien) |
| `idb-orange-light` | `#E28743` | Secondary orange |
| `idb-charcoal` | `#2D3748` | Body text |
| `idb-gray` | `#F7FAFC` | Page background, alternate sections |
| `idb-green` | `#48BB78` | Success states, released payments |
| `idb-amber` | `#ECC94B` | Warnings, Safe Zone indicator |

### Typography

| Role | Font Family | Tailwind Class |
|---|---|---|
| **Headings** | Plus Jakarta Sans (400–800) | `font-heading` |
| **Body** | Inter (300–700) | `font-body` |

- Headings: `letter-spacing: -0.02em`
- Body: `line-height: 1.7`
- All text uses `idb-charcoal` on `idb-gray` or white backgrounds

### Border Radius

| Token | Value | Usage |
|---|---|---|
| `rounded-card` | 8px | Cards, panels |
| `rounded-btn` | 6px | Buttons, inputs |

---

## Component Library

All components are defined as custom CSS classes in `partials/header.ejs` `<style>` block.

### Buttons

```css
.btn          /* Base: inline-flex, 600 weight, 0.875rem, 6px radius, 10px 20px padding */
.btn-blue     /* #0F4C81 bg, white text → hover: #1A365D */
.btn-orange   /* #FF6B35 bg, white text → hover: #E2582A */
.btn-green    /* #48BB78 bg, white text → hover: #38A169 */
.btn-red      /* #E53E3E bg, white text → hover: #C53030 */
.btn-ghost    /* Transparent bg, gray border → hover: idb-gray bg */
.btn-disabled /* Gray bg, muted text, not-allowed cursor */
```

### Cards

```css
.card       /* White bg, 8px radius, border #E2E8F0, subtle shadow, hover: lift shadow */
.card-flat  /* White bg, 8px radius, border #E2E8F0, no shadow */
```

### Badges & Chips

```css
.badge-verified       /* Blue pill: #0F4C81, white text, 0.675rem */
.status-chip          /* Pill badge: 0.7rem, 600 weight */
.status-chip--gray    /* Gray: #EDF2F7 / #4A5568 */
.status-chip--blue    /* Blue: #0F4C81 / white */
.status-chip--amber   /* Amber: #ECC94B / #744210 */
.status-chip--green   /* Green: #48BB78 / white */
.status-chip--red     /* Red: #FED7D7 / #C53030 */
```

### Inputs

```css
.input  /* Full width, 10px 14px padding, border #E2E8F0, focus: #0F4C81 border + ring */
```

### Dropzone

```css
.dropzone  /* 2px dashed border #CBD5E0, 8px radius, 24px padding, hover: blue border */
```

### Banners

```css
.safe-zone-banner         /* Gradient amber bg, yellow border, flex with icon */
.escrow-banner            /* 12px 16px padding, 8px radius */
.escrow-banner--locked    /* Green bg + border */
.escrow-banner--pending   /* Amber bg + border */
.escrow-banner--released  /* Green bg + border */
```

### Toast Notifications

```css
.toast             /* Fixed top-right, z-9999, 8px radius, slideIn animation, auto-fade after 3s */
.toast--success    /* Green bg */
.toast--error      /* Red bg */
```

### Calendar (Dashboard)

```css
.cal-day              /* 36×36px, 8px radius, centered text */
.cal-day--exam        /* Orange border, light orange bg */
.cal-day--project     /* Light blue bg with blue dot */
.cal-day--today       /* Blue bg, white bold text */
```

---

## Landing Page Specific Components

Defined in `header.ejs` under `/* ── Landing Page Styles ── */`:

```css
.landing-navbar       /* Transparent → solid on scroll (via .scrolled class added by JS) */
.hero-image-wrapper   /* 16px radius, overflow hidden, deep shadow */
.glass-card           /* Frosted glass: rgba white bg, backdrop-blur, 12px radius */
.feature-icon-box     /* 56×56px, 14px radius icon container */
.step-circle          /* 48×48px circle for numbered steps */
.talent-photo         /* 56×56px circle, 3px border */
.cta-section          /* Blue gradient bg with decorative pseudo-element circles */
.section-divider      /* 64×4px gradient bar, centered, 1rem bottom margin */
.hero-float-card      /* Absolute positioned card with gentleFloat animation (3.5s loop) */
```

---

## Responsive Design Strategy

### Breakpoint: `768px` (md)

| Element | Mobile (< 768px) | Desktop (≥ 768px) |
|---|---|---|
| **Navbar links** | Hidden (`hidden`) | Visible (`md:flex md:flex-wrap md:items-center`) |
| **Hamburger button** | Visible (`display: flex`) | Hidden (`display: none`) |
| **Sidebar** | Slide-in from left, 280px, z-9999 | Not rendered |
| **Landing sections** | `py-12` (48px) | `md:py-24` (96px) |
| **Section headers** | `mb-8` (32px) | `md:mb-16` (64px) |

### Mobile Navbar Pattern

Every page's navbar uses this structure:
```html
<nav class="bg-white border-b border-gray-100 sticky top-0 z-40">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex flex-wrap justify-between items-center gap-2 py-2 min-h-[3.5rem]">
      <button class="hamburger-btn" aria-label="Menu"><span></span><span></span><span></span></button>
      <a href="..." class="flex items-center gap-2"><!-- Brand --></a>
      <div class="hidden md:flex md:flex-wrap md:items-center md:gap-4">
        <!-- Desktop nav links -->
      </div>
    </div>
  </div>
</nav>
```

### Sidebar System

- **CSS:** Defined in `header.ejs` under `/* ── Mobile Sidebar ── */`
- **JS:** Defined in `partials/footer.ejs` — auto-builds sidebar from navbar links at runtime
- **Behavior:**
  - Slides from left (`translateX(-100%)` → `translateX(0)`), 300ms cubic-bezier
  - Semi-transparent overlay with `backdrop-filter: blur(2px)`
  - Close on: overlay click, close button, link click, or Escape key
  - Animates hamburger spans into an X when active
  - Body scroll locked (`overflow: hidden`) while open

### Mobile CSS Adjustments (≤ 640px)

```css
.toast { right: 10px; left: 10px; top: 12px; font-size: 0.8rem; padding: 12px 18px; }
.safe-zone-banner { flex-direction: column; align-items: flex-start; gap: 6px; font-size: 0.85rem; }
.escrow-banner { font-size: 0.8rem; padding: 10px 12px; flex-wrap: wrap; }
.btn { font-size: 0.8rem; padding: 9px 16px; }
```

---

## Landing Page Structure

The landing page (`views/landing.ejs`) is a single-scroll page with 8 sections:

### 1. Navbar
- `position: fixed`, transparent background
- On scroll (via JS): adds `.scrolled` class → solid white bg with `backdrop-filter: blur(12px)`
- Links: Fitur, Talenta, Cara Kerja, Masuk/Daftar (or user greeting + Keluar)

### 2. Hero Section
- Two-column layout: left text + right stock photo (Unsplash)
- 3 floating glass-cards with `gentleFloat` animation
- GSAP: staggered entrance from bottom (badge → title → subtitle → CTAs → trust text)
- Stock photo: `https://images.unsplash.com/photo-1522202176988-66273c2fd55f`

### 3. Stats Bar
- Dark blue (`idb-blue-dark`) background
- 4 animated counters: Talenta Terdaftar, Klien Terdaftar, Proyek Terselesaikan, Rata-rata Rating
- GSAP: `ScrollTrigger` count-up from 0, 1.8s `power2.out`, stagger slide-up

### 4. Value Proposition — "Mengapa StudentWorks?"
- 3 feature cards with Lucide icons in colored `feature-icon-box`
- Responsive: `py-12 sm:py-16 md:py-24`, `mb-8 sm:mb-12 md:mb-16`
- GSAP: header fade-in, cards stagger slide-up

### 5. Featured Talents — "Talenta Mahasiswa Unggulan"
- Grid of student cards with Unsplash portrait photos
- Each card: photo, name, skills, verified skill badges, rating
- GSAP: header fade-in, cards stagger slide-up

### 6. How It Works — "Cara Kerja"
- 3 numbered step cards with `step-circle` and connector lines
- GSAP: header fade-in, cards stagger with `back.out(1.4)` bounce

### 7. Testimonials — "Apa Kata Mereka"
- 3 testimonial cards with star ratings and user avatars
- GSAP: header fade-in, cards stagger slide-up

### 8. CTA Section
- Blue gradient background (`#1A365D → #0F4C81 → #2B6CB0`)
- Decorative pseudo-element circles
- Orange CTA button + secondary login link
- GSAP: staggered fade-in (title → subtitle → buttons)

### 9. Footer
- 4-column grid: brand + tagline, Platform links, Informasi links, Contact/social
- Light gray background

---

## Animation System

### GSAP Configuration

All animations are on `views/landing.ejs` inside a `DOMContentLoaded` listener:

```js
gsap.registerPlugin(ScrollTrigger);
```

### Hero Timeline
```js
heroTl
  .from('#hero-badge', { y: 20, opacity: 0, duration: 0.5 })
  .from('#hero-title', { y: 50, opacity: 0, duration: 0.9 }, '-=0.3')
  .from('#hero-sub', { y: 35, opacity: 0, duration: 0.7 }, '-=0.5')
  .from('#hero-ctas', { y: 25, opacity: 0, duration: 0.6 }, '-=0.4')
  .from('#hero-trust', { y: 15, opacity: 0, duration: 0.5 }, '-=0.3');
```

### Scroll-Triggered Animations

| Selector | Trigger | Animation |
|---|---|---|
| `#stats-bar .stat-item` | `top 85%` | y:30, opacity:0, stagger:0.1 |
| `.stat-item p[data-count]` | `top 80%` | Count-up from 0, 1.8s, snap to integer |
| `#value-header` | `top 80%` | y:30, opacity:0 |
| `.feature-card` | `top 85%` | y:60, opacity:0, stagger:0.15 |
| `#talenta-header` | `top 80%` | y:30, opacity:0 |
| `.talent-card` | `top 85%` | y:50, opacity:0, stagger:0.1 |
| `#steps-header` | `top 80%` | y:30, opacity:0 |
| `.step-card` | `top 85%` | y:50, opacity:0, scale:0.9, stagger:0.12, `back.out(1.4)` |
| `#testimonial-header` | `top 80%` | y:30, opacity:0 |
| `.testimonial-card` | `top 85%` | y:50, opacity:0, stagger:0.15 |
| `#cta-title/sub/btns` | `top 80%` | Staggered y+opacity with delays |

All animations use `once: true` — they only fire once on initial scroll.

### Navbar Scroll Effect
```js
// Adds/removes .scrolled class for transparent→solid transition
window.addEventListener('scroll', () => {
  document.getElementById('landing-nav').classList.toggle('scrolled', window.scrollY > 50);
});
```

### Smooth Scroll
All `a[href^="#"]` links use `scrollIntoView({ behavior: 'smooth', block: 'start' })`.

---

## File Structure

```
views/
├── partials/
│   ├── header.ejs        ← All CSS, CDNs, toast notifications, <body> open
│   └── footer.ejs        ← Sidebar JS, </body></html>
├── landing.ejs           ← Public landing page (8 sections + GSAP)
├── login.ejs             ← Login form
├── register.ejs          ← Registration form
├── 404.ejs               ← Not found page
├── admin/
│   └── dashboard.ejs     ← Admin panel: stats, user management, Safe Zone toggle
├── mahasiswa/
│   ├── dashboard.ejs     ← Student dashboard: projects, calendar, stats
│   └── proyek.ejs        ← Browse available projects
├── klien/
│   ├── dashboard.ejs     ← Client dashboard: projects, stats
│   ├── proyek-list.ejs   ← Project list (public view)
│   ├── proyek-baru.ejs   ← Create new project form
│   └── talenta.ejs       ← Browse student talents
└── chat/
    └── index.ejs         ← Project-based chat interface
```

---

## Key Rules

1. **No emojis as icons.** Use Lucide Icons (`<i data-lucide="icon-name">`) for all iconography. Emojis are only acceptable in toast messages and decorative text.
2. **All UI text in Indonesian.** Buttons, labels, placeholders, error messages — everything visible to users.
3. **Icons must call `lucide.createIcons()`** after DOM insertion (already called in header.ejs on DOMContentLoaded).
4. **Mobile navigation uses sidebar only.** No inline nav links on mobile. The sidebar JS in `footer.ejs` auto-generates from navbar links at runtime.
5. **Landing page sections use responsive padding:** `py-12 sm:py-16 md:py-24` and `mb-8 sm:mb-12 md:mb-16`.
6. **GSAP animations use `once: true`** — never replay on scroll back.
7. **All pages include `partials/header.ejs` first** and **`partials/footer.ejs` last**.
8. **Tailwind custom colors are prefixed with `idb-`** (e.g., `bg-idb-blue`, `text-idb-charcoal`).
9. **Cards use `card` class** (with hover shadow) for interactive elements, **`card-flat`** for static content.
10. **Buttons always use `btn` base class** + color variant (e.g., `btn btn-orange`).
