# CityVerse AI

**AI-Powered Smart Transportation & Environmental Intelligence Platform for Smart City Command Centers**

A real-time command-center dashboard that fuses urban mobility telemetry, environmental
sensor data and AI-generated operational briefings for three smart cities:
**Singapore**, **Taipei** and **Bengaluru**.

---

## Quick start

```bash
npm install
npm run setup     # creates .env.local and reports your AI provider
npm run dev       # http://localhost:3000
```

That's it. **The app runs with no API key at all** — it falls back to a built-in
offline briefing engine, so a live demo never breaks because of missing keys,
rate limits or bad conference wifi.

**Prerequisites:** Node.js 18 or newer.

---

## AI provider setup

The default provider is **Groq** (free tier, fast). A minimal `.env.local` is
just two lines:

```bash
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

Get a key at [console.groq.com/keys](https://console.groq.com/keys). Everything
else has a sane default.

### Switching providers

CityVerse AI is provider-agnostic. Change `AI_PROVIDER` and set the matching
key — no code changes needed.

| Provider | Env variable | Get a key | Notes |
|---|---|---|---|
| **Groq** | `GROQ_API_KEY` | [console.groq.com/keys](https://console.groq.com/keys) | Generous free tier, very fast — easy pick for a hackathon |
| **Anthropic Claude** | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | Strong structured-JSON reliability |
| **OpenAI** | `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) | |
| **OpenRouter** | `OPENROUTER_API_KEY` | [openrouter.ai/keys](https://openrouter.ai/keys) | One key, many models |
| **Ollama** | *none* | [ollama.com](https://ollama.com) | Fully local, offline, zero cost |
| **Offline** | *none* | — | Built-in deterministic briefing engine |

### Example — free Groq setup

```bash
# .env.local
AI_PROVIDER=groq
GROQ_API_KEY=gsk_your_key_here
```

### Example — fully local, no internet

```bash
ollama pull llama3.2
ollama serve
```

```bash
# .env.local
AI_PROVIDER=ollama
```

### Optional overrides

| Variable | Purpose | Default |
|---|---|---|
| `AI_PROVIDER` | Force a provider instead of auto-detecting | auto-detect |
| `AI_MODEL` | Override the model for your provider | per-provider default |
| `AI_TIMEOUT_MS` | Give up on a slow AI call and use the offline briefing | `20000` |
| `PORT` | Server port | `3000` |

Whichever provider is active is printed at startup, exposed at `/api/ai/info`,
and shown live in the **Settings** screen of the dashboard.

---

## Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Express API + Vite HMR) on port 3000 |
| `npm run setup` | Verify Node version, create `.env.local`, report AI provider |
| `npm run build` | Production build (client bundle + bundled server) |
| `npm start` | Run the production server from `dist/` |
| `npm run lint` | TypeScript type check (`tsc --noEmit`) |
| `npm run clean` | Remove build output |

---

## Architecture

```
server/
  index.ts        Express REST API + Vite middleware (single port, no CORS setup)
  aiProvider.ts   Provider-agnostic AI adapter (fetch-based, zero SDK dependencies)
  cityData.ts     Simulation engine: telemetry, sensors, incidents for 3 cities
scripts/
  check-env.mjs   Setup checker
src/
  components/     Shared UI: map, header, sidebar, metrics, AI panel
  modules/        Dashboard, Transportation, Environment, Analytics, Reports, Settings
  hooks/          useAiProvider - reports the live AI engine
  store/          Zustand global state
  types/          Shared TypeScript types
```

**Stack:** React 19, TypeScript, Vite 6, Tailwind CSS 4, Zustand, Leaflet, Recharts, Express.

The client and API are served from **one process on one port**, so there is no
proxy or CORS configuration to get wrong during setup.

---

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard?city=` | Full dashboard payload |
| `GET` | `/api/transportation/status?city=` | Traffic + transit status |
| `GET` | `/api/transportation/incidents?city=` | Active incidents |
| `POST` | `/api/transportation/incidents/:id/resolve` | Resolve an incident |
| `GET` | `/api/environment/current?city=` | Environment + sensors |
| `GET` | `/api/environment/forecast?city=` | Hourly trends + 3-day forecast |
| `GET` | `/api/environment/aqi?city=` | AQI detail and breakdown |
| `GET` | `/api/analytics?city=` | Trends and cross-metric correlations |
| `GET` | `/api/reports?city=` | Report archive |
| `POST` | `/api/ai/analyze` | AI operational briefing |
| `GET` | `/api/ai/info` | Active AI provider and model |
| `POST` | `/api/simulation/inject` | Inject a simulated incident |

Valid `city` values: `singapore`, `taipei`, `bengaluru` (defaults to `singapore`).

### Sample AI briefing request

```bash
curl -X POST http://localhost:3000/api/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"cityId":"bengaluru","userQuery":"Assess monsoon flood risk on key corridors"}'
```

Returns `summary`, `riskAssessment`, `recommendations[]` and `suggestedDispatch[]`.
This shape is identical whether the response came from a live model or the offline
engine, so the UI never has to special-case it.

---

## Deployment

```bash
npm run build
NODE_ENV=production npm start
```

Outputs a static client bundle plus `dist/server.cjs`. Runs on any Node host
(Render, Railway, Fly.io, a container, or a plain VPS). Set your provider key
as an environment variable on the host.

---

## Troubleshooting

**Port 3000 already in use** — set `PORT=3001` in `.env.local`.

**AI panel shows generic advice** — no provider key detected. Run `npm run setup`
to see what the server resolved, or check the startup log line beginning
`[CityVerse AI] AI engine:`.

**Auth or quota errors** — the server logs the provider's exact status code and
message, then serves the offline briefing so the UI keeps working.
