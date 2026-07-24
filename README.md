# CityVerse AI

Split into two independent applications:

```
cityverse-ai/
├── backend/    Express API server        (port 3000)
└── frontend/   React + Vite dashboard    (port 5173)
```

## Run locally (two terminals)

**Terminal 1 - backend:**
```bash
cd backend
npm install
cp .env.example .env.local      # optional: add GROQ_API_KEY / TOMTOM_API_KEY
npm run dev                     # http://localhost:3000
```

**Terminal 2 - frontend:**
```bash
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

Open http://localhost:5173. The frontend's Vite dev server proxies every `/api`
request to the backend, so no CORS setup is needed locally.

## Real road geometry (optional)
```bash
cd backend
npm run fetch-geometry          # downloads OSM data -> server/data/*.json
```

## Deploy separately

**Backend** (Render / Railway / Fly):
```bash
cd backend && npm run build && npm start
```
Set env vars on the host. Set `FRONTEND_ORIGIN` to your deployed frontend URL to
lock down CORS.

**Frontend** (Vercel / Netlify / any static host):
```bash
cd frontend && npm run build    # outputs dist/
```
Set `VITE_API_URL` to your deployed backend URL (e.g.
`https://cityverse-api.onrender.com`) before building.

## How the two connect
- **Dev:** Vite proxy (`frontend/vite.config.ts`) forwards `/api` -> `localhost:3000`.
- **Prod:** frontend calls `VITE_API_URL` directly; backend allows it via `FRONTEND_ORIGIN` CORS.
- Shared TypeScript types live in `frontend/src/types/index.ts`. The backend keeps a
  copy in `backend/shared/types.ts` - if you change one, copy it to the other.
