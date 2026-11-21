# Forward Engineering Plan & Roadmap: Codeial

This document outlines the architectural roadmap and planned enhancements for future iterations of Codeial.

---

## Completed Milestones

### 1. Silent Recruiter Attribution & Zero-Clutter UI
- **Removed Visible Banner:** Eliminated the visible query parameter greeting banner (`?source=naukri`, `?source=linkedin`, etc.) from the feed UI to maintain a clean, authentic social platform interface.
- **Silent Parameter Ingestion:** Query parameters (`?source=`, `?ref=`, `?utm_source=`) are parsed on first load and stored in `sessionStorage` for frictionless background attribution.

### 2. Strict 2-Notification Discord Telemetry Architecture
- **Consolidated Notification Architecture:** Replaced ad-hoc event messages with a high-signal 2-notification design:
  - **Notification 1 (Landing Alert):** Real-time arrival ping containing candidate source, geolocation, corporate ISP, device/OS, and screen specs.
  - **Notification 2 (Consolidated Session Digest):** Single exit digest dispatched via `sendBeacon` / `keepalive` containing session duration, active focus time, scroll depth milestones, engagement verdict, and an activity timeline log.
- **Micro-Event Instrumentation:** Integrated `logUserActivity()` across `MusicPlayer`, `CreatePost`, `Post`, `Navbar`, and `FriendsList`.
- **Engagement Truth Metric:** Active vs. background tab tracking via the Page Visibility API to verify whether recruiters genuinely viewed and interacted with the project.

---

## Phase 1: Backend Architecture & Database

### Option A: Serverless Backend on Vercel (Fastest & Free)
- Implement `/api/posts`, `/api/users`, and `/api/auth` using Vercel Serverless Functions (`api/` folder).
- Keep frontend and backend deployed under the same domain (`codeial-social.vercel.app/api/...`), eliminating CORS overhead.
- Database: Supabase PostgreSQL or MongoDB Atlas (free tiers).

### Option B: Standalone Node.js / Express Backend
- Create an independent Express REST API repository or monorepo folder.
- Deploy for free on **Render** or **Railway**.
- Decoupled from the Vercel frontend: frontend simply reads `process.env.REACT_APP_API_URL`.

---

## Phase 2: Learning Docker & Kubernetes (Zero Cost Setup)

### Goal: Containerize and Orchestrate Codeial for Resume & DevOps Learning

```mermaid
flowchart TD
    subgraph Local Development / Learning
        A["React Frontend (Dockerfile)"]
        B["Node.js Backend (Dockerfile)"]
        C["PostgreSQL / MongoDB (Container)"]
    end
    D["Docker Compose (Local Multi-Container Test)"] --> A & B & C
    E["Minikube / Kind / K3s (Local Kubernetes Cluster)"] --> F["Deployments & Services (YAML)"]
    G["Free Cloud Sandbox (Killercoda / Play with K8s)"] --> H["Cluster Practice with Zero Machine Load"]
```

### 1. Docker Implementation
1. **Frontend Dockerfile**: Multi-stage build (Node build stage → Nginx alpine image serving static `/build`).
2. **Backend Dockerfile**: Lightweight Node Alpine image.
3. **docker-compose.yml**: Orchestrate Frontend, Backend, and Database on a single local network.

### 2. Free Kubernetes Learning Options (No Personal Machine Load)
- **Killercoda (killercoda.com)**: Free browser-based interactive Kubernetes clusters running Ubuntu 22.04 with standard `kubectl`.
- **Play with Kubernetes (labs.play-with-k8s.com)**: Free Docker-sponsored interactive K8s sandbox.
- **Local Alternative (Lightweight)**: `k3d` or `Kind` (Kubernetes in Docker), consuming significantly fewer resources than Minikube.

---

## Phase 3: Feature Enhancements

### 1. Real-Time Chat Revival (Optional)
- Replace legacy Socket.io client with Supabase Realtime or Pusher (free tier, no persistent Node WebSocket server needed).
- Real-time direct messaging between active connections.

### 2. Recruiter Analytics Dashboard (Optional UI Overlay)
- Private `/admin` or `/recruiter-stats` route displaying visit counts by source (`naukri`, `linkedin`, `resume-frontend`, `resume-fullstack`) and session engagement stats.

### 3. Post Feed Enhancements
- Image uploads via Cloudinary / Supabase Storage.
- Pagination or infinite scrolling for mock and live posts.
- Comment threading and reaction emojis.

---

## Summary Checklist for Next Session
- [x] Remove visible recruiter banner while maintaining silent tracking.
- [x] Implement strict 2-notification Discord telemetry (Landing Alert + Consolidated Session Digest).
- [x] Instrument granular component micro-actions and scroll depth tracking.
- [ ] Connect custom backend endpoint via `REACT_APP_API_URL`.
- [ ] Add Dockerfile and docker-compose configurations.
- [ ] Implement Vercel serverless API or Render backend.
- [ ] Wire Supabase authentication and database models.
