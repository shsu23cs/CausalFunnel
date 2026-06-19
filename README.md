# CausalFunnel — Session Tracking & Analytics

A full-stack application that tracks user interactions on a webpage and displays them in a real-time analytics dashboard.

📺 **[Watch the YouTube Demo Video](https://youtu.be/HulgscnPPwQ)**

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Dashboard** | React 19, TanStack Router (Start), TanStack Query, Tailwind CSS v4 |
| **Backend API** | Node.js, Express |
| **Database** | MongoDB (via Mongoose ODM) |
| **Client Tracker** | Vanilla JavaScript snippet (framework-agnostic) |
| **Demo Site** | Plain HTML/CSS/JS e-commerce mockup |
| **Runtime / Bundler** | Vite 8, Bun (for frontend deps) |

---

## Setup Steps

### Prerequisites
- **Node.js** v18+
- **MongoDB** running locally on port `27017` (or a MongoDB Atlas URI)
- **Bun** (for the frontend — install from [bun.sh](https://bun.sh)) or use npm

---

### 1. Backend

```bash
cd backend

# Install dependencies (if not already done)
npm install

# (Optional) Edit .env to point to your MongoDB instance
# Default: mongodb://localhost:27017/causalfunnel

# Start the server
node server.js
# or, with auto-restart on changes:
node --watch server.js
```

Backend runs at **http://localhost:3001**

The demo e-commerce page is served at **http://localhost:3001/** — open it in a browser, click around, and navigate between pages to generate tracking events.

---

### 2. Frontend Dashboard

```bash
cd frontend

# Install dependencies
bun install   # or: npm install

# Start dev server
bun run dev   # or: npm run dev
```

Dashboard runs at **http://localhost:8080** (or whichever port Vite assigns).

The dashboard will automatically connect to `http://localhost:3001`. If the backend is unreachable it falls back to rich mock data so you can still explore the UI.

---

### 3. Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/causalfunnel` | MongoDB connection string |
| `PORT` | `3001` | Backend server port |
| `VITE_API_BASE_URL` | `http://localhost:3001` | Backend URL used by the dashboard |

Create `backend/.env` (copy from `backend/.env.example`) to override defaults.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/events` | Ingest a tracking event |
| `GET` | `/api/sessions` | List all sessions with event counts |
| `GET` | `/api/sessions/:id` | All events for a session (ordered by time) |
| `GET` | `/api/pages` | Distinct tracked page URLs |
| `GET` | `/api/heatmap?page=<url>` | Click coordinates for a page |

### Event Payload (POST /api/events)
```json
{
  "session_id": "sess_abc123",
  "type": "page_view",
  "pageUrl": "/products",
  "timestamp": "2026-06-20T00:00:00.000Z",
  "x": 540,
  "y": 320
}
```
`x` and `y` are required only for `type: "click"`.

---

## Client Tracker Usage

Add the snippet to any HTML page:

```html
<script src="http://localhost:3001/tracker.js" defer></script>
```

The tracker automatically:
- Assigns a unique `session_id` (persisted in `localStorage` as `cf_session_id`)
- Fires a `page_view` on load and on every SPA navigation (`pushState` / `popstate`)
- Fires a `click` event with `clientX` / `clientY` on every document click
- Sends events via `fetch` (with `sendBeacon` fallback for page unload)

---

## Project Structure

```
causalfunnel/
├── backend/
│   ├── server.js          # Express API + Mongoose models
│   ├── package.json
│   ├── .env               # Local environment config
│   └── public/
│       ├── index.html     # Demo e-commerce SPA
│       └── tracker.js     # Client-side event tracker
└── frontend/
    ├── src/
    │   ├── routes/        # TanStack Router file-based routes
    │   │   ├── __root.tsx # App shell with Sidebar layout
    │   │   ├── sessions.tsx
    │   │   └── heatmap.tsx
    │   ├── components/
    │   │   ├── SessionsPage.tsx
    │   │   ├── HeatmapPage.tsx
    │   │   └── Sidebar.tsx
    │   ├── hooks/
    │   │   ├── useSessions.ts  # TanStack Query hooks (with mock fallback)
    │   │   └── useHeatmap.ts
    │   └── lib/
    │       ├── api.ts          # Typed fetch wrappers
    │       └── mockData.ts     # Demo data when backend is offline
    └── package.json
```

---

## Assumptions & Trade-offs

1. **Single-event POST model**: Each event is sent immediately as it occurs rather than batched. This is simpler to implement and sufficient for a prototype; a production system would batch events and flush periodically to reduce request overhead.

2. **No authentication**: The API accepts events from any origin (CORS `*`). A production deployment would require API key validation or origin allowlisting.

3. **Session scoping**: A session is defined by a single `session_id` in `localStorage`. A new session is started if the user clears their browser storage or opens a new private window. There is no server-side session expiry logic.

4. **Heatmap coordinates are viewport-relative**: Click `x`/`y` values are `clientX`/`clientY` — relative to the visible viewport at the time of the click. The heatmap canvas in the dashboard renders them on a 1280×720 coordinate space. A production system would normalize coordinates to a percentage of the document dimensions.

5. **Mock data fallback**: The frontend dashboard includes a rich generated mock dataset. If the backend is unreachable (e.g. during demo or development), the dashboard degrades gracefully and shows demo data with a warning banner.

6. **SPA navigation tracking**: The tracker monkey-patches `history.pushState` and `history.replaceState` to detect client-side navigation. This covers most React/Vue/Angular routers. Server-side navigations fire a natural page load which also triggers the initial `page_view`.
