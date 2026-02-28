# Alerta de Viagem

A flight price monitoring web app (Brazilian Portuguese UI). Users set price alerts for routes (e.g., "Rio de Janeiro → Greece, max R$3,200") and the system polls the Skyscanner API every 4 hours, tracking prices and notifying when the target is reached.

## Tech Stack

- **Backend**: Node.js + Express, SQLite (better-sqlite3), node-cron, axios — port 3001
- **Frontend**: React 18 + Vite, React Router, Recharts, Tailwind CSS, Lucide icons — port 5000
- **External API**: Flights Scraper Sky (RapidAPI) — `flights-sky.p.rapidapi.com`

## Project Layout

```
backend/
  src/
    index.js         # Express entry point
    config.js        # Centralized env config
    routes/          # alerts, airports, notifications
    services/        # flightSearchApi, priceChecker, cronJob
    db/              # database.js, migrate.js, queries.js
  data/              # SQLite database (alerts.db)
  .env               # Environment variables (gitignored)
frontend/
  src/
    pages/           # Dashboard, AlertDetail, CreateAlert
    components/      # AlertCard, PriceChart, AirportSearch, etc.
    services/api.js  # Axios client pointing to /api (proxied to backend)
```

## Environment Variables

Required in `backend/.env`:
- `RAPIDAPI_KEY` — API key for flights-sky.p.rapidapi.com (RapidAPI)
- `PORT` — defaults to 3001
- `CRON_INTERVAL_HOURS` — defaults to 4
- `MAX_ACTIVE_ALERTS` — defaults to 5

## Development

- Frontend runs on port 5000 (Vite, host 0.0.0.0)
- Backend runs on port 3001 (Express, localhost)
- Vite proxies `/api` requests to the backend
- Frontend workflow: `cd frontend && npm run dev`
- Backend workflow: `cd backend && npm run dev`

## Production Deployment

- Build: `cd frontend && npm run build`
- Run: `cd backend && node src/index.js` (serves built frontend as static files)
- Deployment target: autoscale
