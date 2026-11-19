# Project Summary: Codeial Social Media Platform

## 1. Project Overview & Context
- **Repository:** [neelesh0406/codeial-react-social-media](https://github.com/neelesh0406/codeial-react-social-media)
- **Live Deployment:** [https://codeial-social.vercel.app/](https://codeial-social.vercel.app/)
- **Core Stack:** React 17.0.2, Redux 4.1.1, React Router 5.3.0, Create React App (CRA).
- **Core Objective:** Revive and modernize an older React social media repository for resume and recruiter showcases with zero breaking migrations, ensuring instant visual appeal, ambient music, live simulation, and real-time visitor tracking.

---

## 2. Key Accomplishments

### A. Build & Tooling Stabilization
- Configured Node 22 OpenSSL legacy provider compatibility (`NODE_OPTIONS=--openssl-legacy-provider`) in `package.json`.
- Removed deprecated `react-app/jest` overrides resolving ESLint/Jest environment errors.
- Added `.npmrc` (`node-linker=hoisted`) and `pnpm-lock.yaml` for stable builds.
- Added `vercel.json` with client-side SPA rewrites to eliminate 404s on page refresh.

### B. Smart Geolocation Audio Player (`MusicPlayer.js`)
- Integrated IP-based regional track selection via `ipwho.is`:
  - **South India (`KA`, `TN`, `KL`, `TS`, `AP`, `PY`) & Global:** English track (*Cheri Cheri Lady*).
  - **North / Rest of India:** Hindi track (*Russian Bandana*).
- **Audio Autoplay & Volume Control:**
  - Strictly capped volume at **50% (`0.5`)** with metadata and change clamping.
  - Transparent autoplay fallbacks: tries unmuted playback; if browser policy blocks it, falls back to muted autoplay and seamlessly unmutes on the first interaction (`pointerdown`, `click`, `scroll`, `keypress`).
  - Red close button (`✕`) immediately halts playback, resets time, and minimizes to a floating note button.

### C. Recruiter & Reference URL Tracking
- Query parameter detection for resume, Naukri, and LinkedIn links:
  - `?source=naukri` → "👋 Naukri Hiring Team"
  - `?source=linkedin` → "👋 LinkedIn Recruiter"
  - `?source=resume-frontend` / `?source=resume-fullstack` → "👋 Frontend / Fullstack Hiring Team"
- Displays a dismissible top banner above the feed with session persistence (`sessionStorage`).

### D. Discord Real-Time Recruiter Notification Bot
- Integrated webhook in `src/helpers/discordNotifier.js` triggered on initial page load via `App.js`.
- Dispatches rich embed alert to `#recruiter-alerts` with:
  - 🎯 Source (`naukri`, `linkedin`, etc.)
  - 📍 Geolocation (City, State, Country via IP lookup)
  - 🏢 ISP / Corporate Network
  - 📱 Device / OS / Browser
  - ⏰ Timestamp
- Session de-duplication prevents repeat alerts during continuous browsing.

### E. Feed Polish & Simulated Activity
- **Safe Markdown Rendering:** Custom parser in `Post.js` supports `**bold**`, `*italic*`, and `> blockquotes` with 0 XSS risk.
- **Live Feed Simulation:** Injects an Osho quote post after 3.5s with an audible notification pop chime.
- **Floating Typing Badge:** Glassmorphic badge cycling every 6s with zero layout shift.
- **Reference Users:** Enforced reference users strictly: `Osho`, `Elon Bhadwa`, and `Neelesh (Author)`.

### F. Layout, Design System & Brand Identity
- CSS design system with `:root` variables in `App.css`.
- Header baseline alignment between "Posts" and "Connections".
- Sidebar width tightened to 220px, eliminating excess whitespace.
- Updated browser tab title to `Codeial | Social Networking Platform`.
- Replaced default React favicon with custom sunset gradient Codeial SVG squircle (`public/favicon.svg`).
- Cleaned `README.md` to showcase the live demo link and visual feature GIFs.
