# Nandan Hegde — Portfolio

[![Deploy](https://github.com/Nandanhegde1/portfolio/actions/workflows/deploy.yml/badge.svg)](https://github.com/Nandanhegde1/portfolio/actions/workflows/deploy.yml)
[![Live Site](https://img.shields.io/badge/live-nandanhegde1.github.io%2Fportfolio-6c63ff?logo=github)](https://nandanhegde1.github.io/portfolio/)
[![Angular](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A data-rich, interactive developer portfolio built with **Angular 19** + **SCSS** + **Three.js** + **Express** + **Supabase** + **Anthropic Claude**.

> **Live:** https://nandanhegde1.github.io/portfolio/

---

## ✨ Features

| | |
|---|---|
| 🎨 **Interactive 3D Hero** | Three.js particles with mouse parallax, theme-reactive |
| 🔥 **Roast My Stack** | Claude roasts your tech choices with 3 intensity levels (token streaming) |
| 📊 **Dashboard (demo)** | A UI playground — tech orbit, animations, and live GitHub stats |
| 📈 **Visitor Analytics** | Self-hosted via Supabase, no cookies, GDPR-friendly |
| 📝 **Guestbook** | Backed by Supabase, optimistic UI, DiceBear avatars |
| 💌 **Contact Form** | Persisted to Supabase, rate-limited, validated |
| 🎴 **Card Forge** | Generate & download a custom holographic dev card (Canvas API) |
| 🌗 **5 Themes** | Light · Dark · Synthwave · Nord · Dracula |
| ⌨️ **Terminal Palette** | `Ctrl+K` opens a CLI with autocomplete & easter eggs |
| 📄 **Print to PDF** | One-click clean PDF export of the About page |
| 🔍 **SEO Ready** | Per-route meta, JSON-LD Person schema, sitemap, robots |
| 📱 **PWA** | Installable, offline-capable, manifest + icons |

---

## 🛠️ Stack

```
Frontend  ─ Angular 19, TypeScript, SCSS, RxJS, Signals, Three.js
Backend   ─ Express 4, Supabase (Postgres), Helmet, rate limiting
AI        ─ Anthropic Claude (Roast My Stack — token streaming)
Hosting   ─ GitHub Pages (frontend) + Render (API)
CI/CD     ─ GitHub Actions
```

## 🏗️ Architecture

```
src/app/
├── core/             # Singleton services, models, interceptors
├── shared/           # Reusable components, directives, pipes
├── features/         # Lazy-loaded route features
│   ├── hero/         # 3D Three.js scene
│   ├── about/        # Character sheet + card forge
│   ├── dashboard/    # GitHub stats, code vitals, live stats
│   ├── chatbot/      # Claude-powered AI
│   ├── roast/        # AI tech-stack roaster
│   ├── guestbook/    # Supabase-backed guestbook
│   ├── contact/      # Backend-wired contact form
│   ├── blog/         # "Under the Hood" build doc
│   ├── quiz/         # "How well do you know me?" quiz
│   └── pitch/        # 60-second hire-me pitch
└── layouts/          # Main + dashboard layouts

backend/
├── server.js         # Express app, all endpoints
└── supabase.js       # Lazy Supabase client
```

## 🚀 Local Development

```bash
# Frontend
npm install --legacy-peer-deps
npx ng serve         # http://localhost:4200

# Backend
cd backend
npm install
cp .env.example .env # fill in the vars (see backend/.env.example — every var is documented)
npm run dev          # http://localhost:3000
npm test             # 5 smoke tests against the real app on an ephemeral port
```

## 🚢 Deploy

- **Frontend** — push to `main`; the CI workflow lints, tests, builds, and deploys to GitHub Pages *only if all checks pass*.
- **Backend** — Render auto-deploys `backend/` (root dir `backend`, uses the Dockerfile) on push to `main`. Secrets (`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `ADMIN_TOKEN`, `ALLOWED_ORIGINS`) live in the Render dashboard, never in the repo.
- **Uptime** — a 6-hourly workflow pings all live surfaces and opens a GitHub issue if anything is down.

## 🪪 License

MIT — feel free to fork, learn from, or steal ideas. Just don't impersonate me 😉
