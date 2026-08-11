# 🎮 Billy Store — PlayStation Games & Subscriptions

A modern storefront for PlayStation 4/5 games and PS Plus subscriptions, built for the Saudi market. Features a clean Arabic RTL interface, admin panel, and real-time product management.

---

## 🖥️ Live Demo

> Coming soon

---

## 📸 Screenshots

> *(Add screenshots here)*

---

## ✨ Features

- **Product Catalog** — Browse PS4/PS5 games and PS Plus subscriptions with category filtering and price sorting
- **Product Detail Pages** — Full descriptions, pricing, view counter, and related products
- **Global Discount System** — Apply store-wide percentage discounts instantly from the admin panel
- **Announcement Bar** — Promote deals and offers across the entire site
- **Bulk Import** — Import products in bulk via Excel or CSV files
- **Admin Dashboard** — Manage all products, images, discounts, and announcements
- **Scroll Animations** — Smooth reveal animations as you scroll
- **Mobile-First Design** — Two-column product grid optimized for mobile users
- **Full RTL Support** — Native Arabic right-to-left layout
- **Spatial UI Light** — Light theme with floating white cards, a blue/lavender gradient background, and a self-hosted Arabic font (STC)

---

## 📄 Pages

| Page | Description |
|------|-------------|
| **Home** | Hero banner, featured products, store highlights, and CTA section |
| **Products** | Full product grid with category filter, price sorting, and search |
| **Product Detail** | Large image, full description, pricing with discount, share and copy buttons |
| **About** | Store story, mission, trust signals, and contact links |
| **FAQ** | Accordion-style answers to common customer questions |
| **Admin Dashboard** | Protected panel for managing all store content |

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 | Full-stack framework |
| TypeScript | Type safety |
| TailwindCSS | Styling |
| Turso (SQLite) | Cloud database |
| bcryptjs | Password hashing |
| JSON Web Tokens | Authentication |

---

## 🔒 Security Highlights

- Rate limiting on admin login
- httpOnly + SameSite cookies
- File upload validation (MIME type + magic bytes)
- Parameterized SQL queries
- Security headers (CSP, HSTS, X-Frame-Options)
- No secrets in source code

---

*© 2026 Billy Store. All rights reserved.*
