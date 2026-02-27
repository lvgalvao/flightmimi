# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Alerta de Viagem** — a flight price monitoring web app. Users set price alerts for routes (e.g., "Rio de Janeiro → Greece, max R$3,200") and the system polls the Skyscanner API every 4 hours, tracking prices and notifying when the target is reached.

Full PRD with API response schemas, DB schema, and UI wireframes: `.llm/prd.md`

## Tech Stack

- **Backend**: Node.js + Express, SQLite (better-sqlite3), node-cron, axios
- **Frontend**: React 18 + Vite, React Router, Recharts, Tailwind CSS, Lucide icons
- **External API**: Flights Scraper Sky (RapidAPI) — `flights-sky.p.rapidapi.com`

## Commands

```bash
# Backend
cd backend && npm install
cp .env.example .env          # Add RAPIDAPI_KEY
npm run dev                   # nodemon on port 3001

# Frontend
cd frontend && npm install
npm run dev                   # Vite on port 5173
npm run build                 # Production build
```

## Architecture

```
backend/src/
  index.js              # Express setup + cron init
  config.js             # Centralized env config
  routes/               # Express routes: alerts, airports, notifications
  services/
    flightSearchApi.js  # RapidAPI client with retry/backoff
    priceChecker.js     # Price comparison + trigger logic
    cronJob.js          # Scheduled polling (every N hours)
  db/
    database.js         # better-sqlite3 connection
    migrate.js          # Table creation on startup
    queries.js          # Encapsulated SQL queries

frontend/src/
  pages/                # Dashboard, AlertDetail, CreateAlert
  components/           # AlertCard, PriceChart, AirportSearch, etc.
  services/api.js       # Axios client to backend
```

**Key data flow**: Cron job → fetches active alerts from SQLite → calls Skyscanner API per alert (with 2s delay between) → saves price to `price_history` → triggers notification if price <= target.

## API Conventions

- Backend base URL: `http://localhost:3001/api`
- Frontend proxies `/api` to backend via Vite config
- Airport entity IDs are **not** IATA codes — must use `/flights/auto-complete` to resolve city/airport names to Skyscanner `entityId` values
- API response structure may vary; parse resilently by trying multiple paths (`data.everywhereDestination.buckets`, `data.itineraries.buckets`, `data.buckets`)

## Database

Three SQLite tables: `alerts` (monitoring configs + state), `price_history` (price snapshots per alert), `notifications` (triggered alerts). Schema defined in PRD section 5.1.

## Environment Variables

Required in `backend/.env`:
- `RAPIDAPI_KEY` — API key for flights-sky.p.rapidapi.com
- `CRON_INTERVAL_HOURS` (default: 4)
- `MAX_ACTIVE_ALERTS` (default: 5) — controls API consumption
- `PORT` (default: 3001)

## Language

The app UI and user-facing content are in **Brazilian Portuguese (pt-BR)**. Code (variables, comments, API) should be in English.
