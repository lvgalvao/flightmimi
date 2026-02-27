# PRD — Alerta de Viagem v3.0

**Versão**: 3.0 (Production-Ready para Claude Code)
**Data**: 27/02/2026
**Stack**: Node.js + Express + SQLite + React/Vite
**API**: Flights Scraper Sky (RapidAPI) — scraper Skyscanner

---

## 1. O Que é Este Projeto

Um sistema web que monitora preços de voos automaticamente. O usuário diz "quero ir do Rio de Janeiro para a Grécia por no máximo R$3.200" e o sistema:

1. **Descobre os aeroportos** — busca inteligente que resolve "Rio de Janeiro" → GIG/SDU e "Grécia" → ATH/SKG
2. **Monitora preços** — a cada 4 horas faz polling na API do Skyscanner
3. **Mostra no dashboard** — gráfico de evolução de preço + cards com status
4. **Alerta quando atinge o target** — notificação visual no dashboard (Telegram futuro)

---

## 2. API: Flights Scraper Sky (RapidAPI)

### 2.1 Configuração

```
Host: flights-sky.p.rapidapi.com
Base URL: https://flights-sky.p.rapidapi.com
Headers obrigatórios:
  x-rapidapi-host: flights-sky.p.rapidapi.com
  x-rapidapi-key: {RAPIDAPI_KEY}
```

### 2.2 Endpoints Confirmados (do playground real)

A sidebar do playground confirmou estes endpoints:

| # | Endpoint | Método | Uso no projeto |
|---|----------|--------|----------------|
| 1 | `GET /flights/airports` | GET | Buscar aeroportos por nome/cidade |
| 2 | `GET /flights/auto-complete` | GET | Autocomplete de aeroportos/cidades |
| 3 | `GET /flights/search-roundtrip` | GET | **PRINCIPAL** — busca voos ida+volta com preços |
| 4 | `GET /flights/search-one-way` | GET | Busca voos somente ida |
| 5 | `GET /flights/search-everywhere` | GET | Busca destinos mais baratos a partir de origem |
| 6 | `POST /flights/search-multi-city` | POST | Busca multi-city |
| 7 | `GET /flights/search-incomplete` | GET | Busca com resultados parciais |
| 8 | `GET /flights/detail` | GET | Detalhes de itinerário (precisa token + itineraryId do search) |
| 9 | `GET /flights/price-calendar` | GET | Preços por dia no calendário |

### 2.3 Endpoint Principal: search-roundtrip

**Request confirmado** (do code snippet do playground):

```python
# URL real do playground
conn.request("GET", "/flights/search-roundtrip?fromEntityId=PARI&toEntityId=...", headers=headers)
```

**Parâmetros** (19 params conforme playground):

| Param | Tipo | Obrigatório | Exemplo | Descrição |
|-------|------|:-----------:|---------|-----------|
| `fromEntityId` | string | ✅ | `"RIOD"` ou ID numérico | Origem — entity ID do aeroporto/cidade |
| `toEntityId` | string | ✅ | `"ATHE"` ou ID numérico | Destino — entity ID do aeroporto/cidade |
| `departDate` | string | ✅ | `"2026-05-15"` | Data ida (YYYY-MM-DD) |
| `returnDate` | string | ✅ | `"2026-05-30"` | Data volta (YYYY-MM-DD) |
| `adults` | number | ❌ | `1` | Adultos (default 1) |
| `children` | number | ❌ | `0` | Crianças |
| `infants` | number | ❌ | `0` | Bebês |
| `cabinClass` | string | ❌ | `"economy"` | economy, premium_economy, business, first |
| `currency` | string | ❌ | `"BRL"` | Moeda dos preços |
| `market` | string | ❌ | `"BR"` | Mercado/país |
| `locale` | string | ❌ | `"pt-BR"` | Idioma |

> **⚠️ IMPORTANTE**: `fromEntityId` e `toEntityId` NÃO são códigos IATA diretos. São "entity IDs" do Skyscanner. Precisam ser obtidos via `/flights/auto-complete` ou `/flights/airports` primeiro.

### 2.4 Response Confirmado (do playground — 200 OK)

```json
{
  "data": {
    "everywhereDestination": {
      "context": {
        "status": "complete",
        "sessionId": "UNFOCUSED_SESSION_ID",
        "totalResults": 96
      },
      "features": {
        "flightsIndicative": "AVAILABLE",
        "images": "AVAILABLE",
        "ads": "AVAILABLE"
      },
      "buckets": [
        {
          "id": "CHEAPEST_FLIGHTS",
          "label": "Cheapest flights",
          "items": [
            {
              "id": "itinerary-id-aqui",
              "price": {
                "raw": 3450.00,
                "formatted": "R$ 3.450"
              },
              "legs": [
                {
                  "id": "leg-id",
                  "origin": {
                    "id": "15083",
                    "name": "Paris Orly",
                    "displayCode": "ORY",
                    "city": "Paris"
                  },
                  "destination": {
                    "id": "14355",
                    "name": "New Orleans Louis Armstrong",
                    "displayCode": "MSY",
                    "city": "New Orleans"
                  },
                  "segments": [
                    {
                      "flightNumber": "...",
                      "carrier": { "name": "..." },
                      "departure": "...",
                      "arrival": "..."
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

**Campos chave para o monitor:**
- `data.everywhereDestination.buckets[0].items[*].price.raw` → preço numérico
- `data.everywhereDestination.buckets[0].items[*].price.formatted` → preço formatado
- `data.everywhereDestination.buckets[0].items[*].legs[*].origin` → aeroporto origem
- `data.everywhereDestination.buckets[0].items[*].legs[*].destination` → aeroporto destino
- `data.everywhereDestination.buckets[0].id` → bucket type (CHEAPEST_FLIGHTS, BEST_FLIGHTS, etc)

> **NOTA**: A estrutura exata pode variar entre search-roundtrip e search-everywhere. O response acima veio do playground. Na implementação, fazer log do response completo na primeira chamada para confirmar a estrutura.

### 2.5 Endpoint de Busca de Aeroportos: auto-complete

Este é o endpoint que permite o usuário digitar "Rio de Janeiro" e encontrar os aeroportos corretos.

```
GET /flights/auto-complete?query=rio+de+janeiro
```

**Response esperado:**
```json
{
  "data": [
    {
      "entityId": "27540485",
      "name": "Rio de Janeiro Galeão",
      "iataCode": "GIG",
      "city": "Rio de Janeiro",
      "country": "Brazil",
      "entityType": "AIRPORT"
    },
    {
      "entityId": "27540486",
      "name": "Santos Dumont",
      "iataCode": "SDU",
      "city": "Rio de Janeiro",
      "country": "Brazil",
      "entityType": "AIRPORT"
    },
    {
      "entityId": "RIOD",
      "name": "Rio de Janeiro",
      "entityType": "CITY"
    }
  ]
}
```

> **⚠️ NOTA PARA IMPLEMENTAÇÃO**: A estrutura exata do response do auto-complete precisa ser validada. Use o entity com `entityType: "CITY"` quando o usuário digita uma cidade (para cobrir todos os aeroportos), ou `entityType: "AIRPORT"` para aeroporto específico. Grave o `entityId` retornado — esse é o valor para `fromEntityId`/`toEntityId` no search.

---

## 3. Funcionalidades Detalhadas

### 3.1 Busca Inteligente de Aeroportos (AUTOCOMPLETE)

**Problema**: O usuário não sabe o código IATA. Ele quer digitar "Rio de Janeiro" ou "Grécia" e o sistema resolver.

**Solução**:

```
Componente: <AirportSearch />

1. Usuário digita "rio de jan..." no input
2. Debounce de 300ms
3. GET /flights/auto-complete?query=rio+de+janeiro
4. Dropdown mostra opções:
   ┌─────────────────────────────────────┐
   │ 🏙️ Rio de Janeiro (todos aeroportos) │
   │ ✈️ GIG — Galeão International        │
   │ ✈️ SDU — Santos Dumont               │
   └─────────────────────────────────────┘
5. Usuário seleciona → grava entityId internamente
6. Mostra nome amigável no input: "Rio de Janeiro (GIG/SDU)"
```

**Mesmo fluxo para destino**: "grécia" → mostra Atenas (ATH), Thessaloniki (SKG), etc.

### 3.2 Criação de Alerta

**Form completo**:

```
┌──────────────────────────────────────────────┐
│         ✈️ Novo Alerta de Preço               │
│                                              │
│ De:    [Rio de Janeiro          🔍] ← autocomplete
│ Para:  [Grécia                  🔍] ← autocomplete
│                                              │
│ Ida:   [15/05/2026  📅]                      │
│ Volta: [30/05/2026  📅]                      │
│                                              │
│ Preço alvo: R$ [3.200,00]                    │
│ Classe: [Econômica ▼]                        │
│ Passageiros: [1 ▼]                           │
│                                              │
│           [Criar Alerta]                     │
└──────────────────────────────────────────────┘
```

**Ao clicar "Criar Alerta":**
1. `POST /api/alerts` com os entityIds + datas + target
2. Backend faz primeira busca de preço imediatamente
3. Salva alerta no banco + primeiro preço no histórico
4. Retorna ao dashboard com o novo card

### 3.3 Dashboard Principal

```
┌──────────────────────────────────────────────────────────┐
│  ✈️ Alerta de Viagem                    [+ Novo Alerta]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────┐  ┌──────────────┐  │
│  │ GRU → ATH                       │  │  Status      │  │
│  │ Rio de Janeiro → Atenas          │  │  🟢 Ativo    │  │
│  │                                  │  └──────────────┘  │
│  │ 📅 15/mai → 30/mai/2026         │                    │
│  │                                  │                    │
│  │ 💰 Atual:  R$ 3.450             │                    │
│  │ 🎯 Alvo:   R$ 3.200             │                    │
│  │ 📊 Variação: ↓ 2.3% (últimas 24h)│                   │
│  │                                  │                    │
│  │ ▁▂▃▂▁▂▃▅▃▂ (sparkline 7 dias)   │                    │
│  │                                  │                    │
│  │ Próxima checagem: 14:30          │                    │
│  │ Última: hoje 10:30               │                    │
│  │                                  │                    │
│  │ [Pausar] [Editar] [Deletar]      │                    │
│  └─────────────────────────────────┘                    │
│                                                          │
│  ┌─────────────────────────────────┐                    │
│  │ 🔔 ALERTA! GIG → SKG            │  ← card verde     │
│  │ Preço atingiu o alvo!            │    quando triggered│
│  │ 💰 R$ 3.150 (alvo: R$ 3.200)    │                    │
│  │ 📅 20/jun → 05/jul/2026         │                    │
│  │ [Ver detalhes] [Reativar]        │                    │
│  └─────────────────────────────────┘                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.4 Tela de Detalhe do Alerta

```
┌──────────────────────────────────────────────────────────┐
│  ← Voltar     GRU → ATH (15/mai → 30/mai)              │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Gráfico de Preço (Recharts LineChart)                   │
│  ┌──────────────────────────────────────────────────┐   │
│  │ R$                                                │   │
│  │ 4.000 ─                                           │   │
│  │ 3.800 ─           ╲      ╱╲                       │   │
│  │ 3.600 ─     ╱╲  ╱  ╲  ╱    ╲                     │   │
│  │ 3.400 ─   ╱    ╲╱    ╲╱      ╲                   │   │
│  │ 3.200 ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ← linha alvo  │   │
│  │ 3.000 ─ ╱                          ╲             │   │
│  │         27/02  28/02  01/03  02/03  03/03        │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  Histórico de Checagens                                  │
│  ┌─────────────┬──────────┬──────────┬────────────┐     │
│  │ Data/Hora   │ Preço    │ Variação │ Companhia  │     │
│  ├─────────────┼──────────┼──────────┼────────────┤     │
│  │ 03/03 10:30 │ R$3.150  │ ↓ -3.1%  │ KLM        │     │
│  │ 03/03 06:30 │ R$3.250  │ ↓ -1.5%  │ KLM        │     │
│  │ 02/03 22:30 │ R$3.300  │ ↑ +2.0%  │ Turkish    │     │
│  │ 02/03 18:30 │ R$3.235  │ ↓ -0.5%  │ KLM        │     │
│  └─────────────┴──────────┴──────────┴────────────┘     │
│                                                          │
│  [Exportar CSV]  [Editar Preço Alvo]  [Deletar Alerta]  │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + Vite)                  │
│                                                              │
│  Dashboard ──── AlertDetail ──── CreateAlertForm             │
│      │               │                │                      │
│      └───────────────┴────────────────┘                      │
│                       │                                      │
│                  Axios Client                                │
│                       │ REST API                             │
└───────────────────────┼──────────────────────────────────────┘
                        │
┌───────────────────────┼──────────────────────────────────────┐
│                  BACKEND (Express.js)                         │
│                       │                                      │
│  ┌────────────────────┼────────────────────────────────┐    │
│  │              Express Routes                          │    │
│  │                                                      │    │
│  │  POST /api/alerts          → criar alerta            │    │
│  │  GET  /api/alerts          → listar alertas          │    │
│  │  GET  /api/alerts/:id      → detalhe + histórico     │    │
│  │  PUT  /api/alerts/:id      → editar (target/status)  │    │
│  │  DELETE /api/alerts/:id    → deletar                  │    │
│  │  GET  /api/airports/search → autocomplete aeroportos │    │
│  │  POST /api/alerts/:id/check → forçar checagem manual │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────┼────────────────────────────────┐    │
│  │              Services                                │    │
│  │                                                      │    │
│  │  flightSearch.js ──── API Client (Flights Scraper)   │    │
│  │  priceChecker.js ──── Lógica de comparação           │    │
│  │  cronJob.js      ──── Polling agendado               │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│  ┌────────────────────┼────────────────────────────────┐    │
│  │              Database (SQLite)                        │    │
│  │  alerts │ price_history │ notifications               │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                        │
                        │ HTTPS
                        ▼
              ┌──────────────────┐
              │ Flights Scraper  │
              │ Sky API          │
              │ (RapidAPI)       │
              └──────────────────┘
```

### 4.1 Fluxo do Polling (Cron Job)

```
A cada 4 horas (0 */4 * * *):

1. Buscar todos alertas com status = 'active'
2. Para cada alerta:
   a. GET /flights/search-roundtrip com entityIds salvos
   b. Extrair menor preço dos buckets (CHEAPEST_FLIGHTS)
   c. INSERT no price_history
   d. Se preço <= target_price:
      - UPDATE alert status → 'triggered'
      - INSERT notification
   e. Esperar 2 segundos (rate limit)
3. Log resultado
```

---

## 5. Modelo de Dados

### 5.1 Schema SQLite

```sql
-- Alertas de monitoramento
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Origem
  origin_entity_id TEXT NOT NULL,       -- entityId do Skyscanner (ex: "27540485" ou "RIOD")
  origin_name TEXT NOT NULL,            -- nome amigável (ex: "Rio de Janeiro")
  origin_display_code TEXT,             -- código IATA se disponível (ex: "GIG")
  -- Destino
  dest_entity_id TEXT NOT NULL,         -- entityId do Skyscanner
  dest_name TEXT NOT NULL,              -- nome amigável (ex: "Atenas")
  dest_display_code TEXT,               -- código IATA (ex: "ATH")
  -- Datas
  depart_date TEXT NOT NULL,            -- "2026-05-15"
  return_date TEXT,                     -- NULL = somente ida
  -- Configuração
  target_price REAL NOT NULL,           -- 3200.00 (BRL)
  cabin_class TEXT DEFAULT 'economy',   -- economy, premium_economy, business, first
  passengers INTEGER DEFAULT 1,
  currency TEXT DEFAULT 'BRL',
  -- Estado
  status TEXT DEFAULT 'active',         -- active, paused, triggered, expired
  current_price REAL,                   -- último preço checado
  lowest_price REAL,                    -- menor preço já visto
  last_checked_at DATETIME,
  triggered_at DATETIME,
  -- Meta
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Histórico de preços
CREATE TABLE price_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id INTEGER NOT NULL,
  price REAL NOT NULL,                  -- preço mais barato encontrado
  cheapest_airline TEXT,                -- companhia do voo mais barato
  cheapest_flight_numbers TEXT,         -- "KL792,KL1395"
  stops INTEGER,                        -- 0 = direto, 1 = 1 parada, etc
  bucket_type TEXT,                     -- "CHEAPEST_FLIGHTS", "BEST_FLIGHTS"
  raw_response_summary TEXT,            -- JSON resumido para debug
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);

-- Notificações (quando preço atinge target)
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id INTEGER NOT NULL,
  type TEXT DEFAULT 'price_target',     -- price_target, price_drop, expired
  price_at_trigger REAL,
  message TEXT,
  read_at DATETIME,                     -- NULL = não lida
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE
);

-- Índices
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_price_history_alert ON price_history(alert_id, checked_at);
CREATE INDEX idx_notifications_read ON notifications(alert_id, read_at);
```

---

## 6. API Backend (Express Routes)

### 6.1 Endpoints

```
Base URL: http://localhost:3001/api

── Aeroportos ──
GET  /airports/search?query=rio+de+janeiro
  → Proxy para /flights/auto-complete da API
  → Response: { data: [{ entityId, name, iataCode, city, entityType }] }

── Alertas CRUD ──
POST /alerts
  Body: { originEntityId, originName, originDisplayCode,
          destEntityId, destName, destDisplayCode,
          departDate, returnDate, targetPrice, cabinClass, passengers }
  → Valida: se activeAlerts.count >= MAX_ACTIVE_ALERTS, retorna 400
  → Cria alerta + faz primeira checagem de preço
  → Response: { alert: {...}, initialPrice: 3450.00 }
  → Erro: { error: "Limite de X alertas ativos atingido. Pause ou delete um alerta." }

GET  /alerts
  → Lista todos os alertas com último preço
  → Response: { alerts: [...] }

GET  /alerts/:id
  → Detalhe do alerta + histórico de preços
  → Response: { alert: {...}, priceHistory: [...], notifications: [...] }

PUT  /alerts/:id
  Body: { targetPrice?, status? }
  → Atualiza target ou pausa/reativa
  → Response: { alert: {...} }

DELETE /alerts/:id
  → Remove alerta e histórico associado
  → Response: { success: true }

── Ações ──
POST /alerts/:id/check
  → Força checagem de preço agora (fora do cron)
  → Response: { price: 3380.00, previousPrice: 3450.00, variation: -2.03 }

GET  /alerts/:id/export
  → Exporta histórico como CSV
  → Response: text/csv

── Notificações ──
GET  /notifications
  → Notificações não lidas
  → Response: { notifications: [...], unreadCount: 3 }

PUT  /notifications/:id/read
  → Marca como lida
```

---

## 7. Estrutura do Projeto

```
alerta-viagem/
│
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── src/
│   │   ├── index.js                    # Entry point: Express + Cron init
│   │   ├── config.js                   # Configuração centralizada (lê .env)
│   │   │
│   │   ├── routes/
│   │   │   ├── alerts.js               # CRUD alertas
│   │   │   ├── airports.js             # Busca aeroportos (proxy API)
│   │   │   └── notifications.js        # Notificações
│   │   │
│   │   ├── services/
│   │   │   ├── flightSearchApi.js      # Client HTTP para Flights Scraper Sky
│   │   │   ├── priceChecker.js         # Lógica: buscar preço, comparar, notificar
│   │   │   └── cronJob.js              # node-cron: agendar checagens
│   │   │
│   │   ├── db/
│   │   │   ├── database.js             # Conexão better-sqlite3
│   │   │   ├── migrate.js              # Criar tabelas (roda no startup)
│   │   │   └── queries.js              # Queries SQL encapsuladas
│   │   │
│   │   └── middleware/
│   │       ├── errorHandler.js         # Tratamento global de erros
│   │       └── cors.js                 # CORS config
│   │
│   └── data/
│       └── alerts.db                   # SQLite file (gitignored)
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx                    # React entry
│   │   ├── App.jsx                     # Router setup
│   │   │
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx           # Lista de alertas + cards
│   │   │   ├── AlertDetail.jsx         # Gráfico + histórico de um alerta
│   │   │   └── CreateAlert.jsx         # Form de criação
│   │   │
│   │   ├── components/
│   │   │   ├── AlertCard.jsx           # Card de um alerta no dashboard
│   │   │   ├── PriceChart.jsx          # Gráfico Recharts (LineChart)
│   │   │   ├── PriceHistoryTable.jsx   # Tabela de histórico
│   │   │   ├── AirportSearch.jsx       # Input com autocomplete de aeroportos
│   │   │   ├── NotificationBadge.jsx   # Badge de notificações não lidas
│   │   │   └── SparklineChart.jsx      # Mini gráfico no card
│   │   │
│   │   ├── services/
│   │   │   └── api.js                  # Axios client para o backend
│   │   │
│   │   └── styles/
│   │       └── globals.css             # Tailwind ou CSS global
│   │
│   └── public/
│       └── favicon.ico
│
├── .gitignore
└── README.md
```

---

## 8. Variáveis de Ambiente

```env
# backend/.env

# ═══════════════════════════════════════════
# CONFIGURAÇÕES DE MONITORAMENTO
# ═══════════════════════════════════════════

# Intervalo entre checagens de preço (em horas)
# Recomendado: 4 (free), 2 (basic), 1 (pro)
CRON_INTERVAL_HOURS=4

# Máximo de alertas simultâneos ativos
# Controla consumo da API: alerts × (24/intervalo) × 30 = requests/mês
# Ex: 5 alertas × 6 checks/dia × 30 dias = 900 requests/mês
MAX_ACTIVE_ALERTS=5

# Delay entre requests no mesmo ciclo de cron (em ms)
# Evita rate limit. Mínimo recomendado: 2000
DELAY_BETWEEN_REQUESTS_MS=2000

# Máximo de retries em caso de erro da API (429, 500, timeout)
MAX_RETRIES=3

# Timeout de cada request à API (em ms)
API_TIMEOUT_MS=30000

# ═══════════════════════════════════════════
# DEFAULTS PARA BUSCA DE VOOS
# (podem ser sobrescritos por alerta)
# ═══════════════════════════════════════════
DEFAULT_CURRENCY=BRL
DEFAULT_MARKET=BR
DEFAULT_LOCALE=pt-BR
DEFAULT_CABIN_CLASS=economy
DEFAULT_ADULTS=1

# ═══════════════════════════════════════════
# SERVIDOR
# ═══════════════════════════════════════════
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 8.1 Cálculo de Consumo da API

```
Fórmula:
  requests/mês = MAX_ACTIVE_ALERTS × (24 / CRON_INTERVAL_HOURS) × 30

Exemplos:
  5 alertas × a cada 4h = 5 × 6 × 30 =   900 req/mês → Plano Basic
  5 alertas × a cada 2h = 5 × 12 × 30 = 1.800 req/mês → Plano Pro
  10 alertas × a cada 4h = 10 × 6 × 30 = 1.800 req/mês → Plano Pro
  3 alertas × a cada 6h = 3 × 4 × 30 =   360 req/mês → Plano Free

Dica: começar com CRON_INTERVAL_HOURS=6 e MAX_ACTIVE_ALERTS=3
para ficar dentro do plano Free (~360 req/mês).
```

---

## 9. Implementação dos Services (Referência)

### 9.1 config.js — Configuração Centralizada

```javascript
// backend/src/config.js
require('dotenv').config();

module.exports = {
  // API
  api: {
    key: process.env.RAPIDAPI_KEY,
    host: process.env.RAPIDAPI_HOST || 'flights-sky.p.rapidapi.com',
    baseUrl: process.env.RAPIDAPI_BASE_URL || 'https://flights-sky.p.rapidapi.com',
    timeoutMs: parseInt(process.env.API_TIMEOUT_MS) || 30000,
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  },

  // Monitoramento
  monitoring: {
    cronIntervalHours: parseInt(process.env.CRON_INTERVAL_HOURS) || 4,
    maxActiveAlerts: parseInt(process.env.MAX_ACTIVE_ALERTS) || 5,
    delayBetweenRequestsMs: parseInt(process.env.DELAY_BETWEEN_REQUESTS_MS) || 2000,
  },

  // Defaults de busca
  searchDefaults: {
    currency: process.env.DEFAULT_CURRENCY || 'BRL',
    market: process.env.DEFAULT_MARKET || 'BR',
    locale: process.env.DEFAULT_LOCALE || 'pt-BR',
    cabinClass: process.env.DEFAULT_CABIN_CLASS || 'economy',
    adults: parseInt(process.env.DEFAULT_ADULTS) || 1,
  },

  // Server
  server: {
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  }
};
```

### 9.2 flightSearchApi.js — Client da API

```javascript
// Referência de implementação para o Claude Code

const axios = require('axios');
const config = require('../config');

const api = axios.create({
  baseURL: config.api.baseUrl,
  timeout: config.api.timeoutMs,
  headers: {
    'x-rapidapi-key': config.api.key,
    'x-rapidapi-host': config.api.host
  }
});

// Retry com backoff exponencial
async function withRetry(fn, retries = config.api.maxRetries) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable = err.response?.status === 429 || err.response?.status >= 500;
      if (i === retries || !isRetryable) throw err;
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.log(`[API] Retry ${i + 1}/${retries} em ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

module.exports = {

  // Busca aeroportos por texto
  async searchAirports(query) {
    return withRetry(async () => {
      const { data } = await api.get('/flights/auto-complete', {
        params: { query }
      });
      return data;
    });
  },

  // Busca voos ida e volta com preços
  async searchRoundtrip({ fromEntityId, toEntityId, departDate, returnDate,
                          adults, cabinClass, currency, market, locale }) {
    return withRetry(async () => {
      const { data } = await api.get('/flights/search-roundtrip', {
        params: {
          fromEntityId,
          toEntityId,
          departDate,
          returnDate,
          adults: adults || config.searchDefaults.adults,
          cabinClass: cabinClass || config.searchDefaults.cabinClass,
          currency: currency || config.searchDefaults.currency,
          market: market || config.searchDefaults.market,
          locale: locale || config.searchDefaults.locale
        }
      });
      return data;
    });
  },

  // Busca voos somente ida
  async searchOneWay({ fromEntityId, toEntityId, departDate,
                       adults, cabinClass, currency, market, locale }) {
    return withRetry(async () => {
      const { data } = await api.get('/flights/search-one-way', {
        params: {
          fromEntityId,
          toEntityId,
          departDate,
          adults: adults || config.searchDefaults.adults,
          cabinClass: cabinClass || config.searchDefaults.cabinClass,
          currency: currency || config.searchDefaults.currency,
          market: market || config.searchDefaults.market,
          locale: locale || config.searchDefaults.locale
        }
      });
      return data;
    });
  },

  // Calendário de preços
  async getPriceCalendar({ fromEntityId, toEntityId, departDate }) {
    return withRetry(async () => {
      const { data } = await api.get('/flights/price-calendar', {
        params: { fromEntityId, toEntityId, departDate }
      });
      return data;
    });
  }
};
```

### 9.2 priceChecker.js — Lógica de Checagem

```javascript
// Referência de implementação

module.exports = {
  async checkAlert(alert) {
    // 1. Buscar preços
    const searchFn = alert.return_date ? 'searchRoundtrip' : 'searchOneWay';
    const result = await flightSearchApi[searchFn]({
      fromEntityId: alert.origin_entity_id,
      toEntityId: alert.dest_entity_id,
      departDate: alert.depart_date,
      returnDate: alert.return_date,
      adults: alert.passengers,
      cabinClass: alert.cabin_class,
      currency: alert.currency
    });

    // 2. Extrair menor preço
    // NOTA: navegar pela estrutura real do response
    // O response tem buckets (CHEAPEST_FLIGHTS, BEST_FLIGHTS, etc)
    // Cada bucket tem items com price.raw
    const buckets = result?.data?.everywhereDestination?.buckets
                 || result?.data?.itineraries?.buckets
                 || [];

    let cheapest = null;
    for (const bucket of buckets) {
      for (const item of (bucket.items || [])) {
        const price = item?.price?.raw;
        if (price && (!cheapest || price < cheapest.price)) {
          cheapest = {
            price,
            formatted: item.price.formatted,
            airline: item.legs?.[0]?.segments?.[0]?.carrier?.name || 'N/A',
            stops: item.legs?.[0]?.stops || 0,
            flightNumbers: item.legs?.[0]?.segments?.map(s => s.flightNumber).join(','),
            bucketType: bucket.id
          };
        }
      }
    }

    // 3. Salvar no histórico
    if (cheapest) {
      db.addPriceHistory(alert.id, cheapest);

      // 4. Atualizar alerta
      db.updateAlertPrice(alert.id, cheapest.price);

      // 5. Verificar target
      if (cheapest.price <= alert.target_price) {
        db.triggerAlert(alert.id, cheapest.price);
        db.addNotification(alert.id, cheapest.price);
      }
    }

    return cheapest;
  }
};
```

### 9.4 cronJob.js — Polling Agendado

```javascript
const cron = require('node-cron');
const config = require('../config');

function startCron() {
  const { cronIntervalHours, delayBetweenRequestsMs, maxActiveAlerts } = config.monitoring;
  const expression = `0 */${cronIntervalHours} * * *`;

  console.log(`[CRON] Config:`);
  console.log(`  - Intervalo: ${cronIntervalHours}h (${expression})`);
  console.log(`  - Max alertas ativos: ${maxActiveAlerts}`);
  console.log(`  - Delay entre requests: ${delayBetweenRequestsMs}ms`);

  cron.schedule(expression, async () => {
    console.log(`[CRON] ${new Date().toISOString()} — Iniciando checagem`);

    const alerts = db.getActiveAlerts();

    // Respeitar limite de alertas ativos
    if (alerts.length > maxActiveAlerts) {
      console.warn(`[CRON] ${alerts.length} alertas ativos, max é ${maxActiveAlerts}. Processando apenas os ${maxActiveAlerts} mais antigos.`);
    }

    const alertsToCheck = alerts.slice(0, maxActiveAlerts);
    console.log(`[CRON] Checando ${alertsToCheck.length} alertas`);

    let checked = 0;
    let triggered = 0;
    let errors = 0;

    for (const alert of alertsToCheck) {
      try {
        // Auto-expirar se data já passou
        if (new Date(alert.depart_date) < new Date()) {
          db.updateAlertStatus(alert.id, 'expired');
          console.log(`[CRON] Alerta #${alert.id} expirado (data passou)`);
          continue;
        }

        const result = await priceChecker.checkAlert(alert);
        checked++;

        if (result?.triggered) {
          triggered++;
          console.log(`[CRON] 🔔 Alerta #${alert.id} TRIGGERED! R$${result.price}`);
        } else {
          console.log(`[CRON] Alerta #${alert.id}: R$${result?.price || 'N/A'}`);
        }
      } catch (err) {
        errors++;
        console.error(`[CRON] Erro no alerta #${alert.id}:`, err.message);
      }

      // Rate limit entre requests
      await new Promise(r => setTimeout(r, delayBetweenRequestsMs));
    }

    console.log(`[CRON] Completo: ${checked} checados, ${triggered} triggered, ${errors} erros`);
  });
}
```

---

## 10. Frontend — Componentes Chave

### 10.1 AirportSearch (Autocomplete)

```
Comportamento:
- Input texto com placeholder "Digite cidade ou aeroporto..."
- onChange → debounce 300ms → GET /api/airports/search?query=...
- Dropdown aparece com resultados
- Cada item mostra: ícone (🏙️ cidade / ✈️ aeroporto) + nome + código
- Ao selecionar: gravar { entityId, name, displayCode, entityType }
- Mostrar chip no input: "Rio de Janeiro (GIG)"
- Se entityType === "CITY": indicar "(todos aeroportos)"

Props:
- value: { entityId, name, displayCode }
- onChange: (selected) => void
- placeholder: string
```

### 10.2 PriceChart (Recharts)

```
Comportamento:
- LineChart com eixo X = data/hora, eixo Y = preço em BRL
- Linha azul = preços reais coletados
- Linha tracejada vermelha = preço alvo (horizontal)
- Tooltip mostra: data, preço, companhia, paradas
- Área abaixo do target preenchida em verde claro
- Responsivo (ResponsiveContainer)

Props:
- priceHistory: [{ checkedAt, price, cheapestAirline }]
- targetPrice: number
```

### 10.3 AlertCard (Card no Dashboard)

```
Comportamento:
- Card com borda esquerda colorida:
  - 🟢 verde: triggered (atingiu target)
  - 🔵 azul: active
  - ⚪ cinza: paused
  - 🔴 vermelho: expired
- Mostra: rota, datas, preço atual, target, variação %, sparkline
- Botões: Pausar/Reativar, Editar target, Deletar
- Click no card → navega para /alerts/:id

Props:
- alert: { id, originName, destName, departDate, returnDate,
           currentPrice, targetPrice, status, ... }
- recentPrices: number[] (para sparkline)
```

---

## 11. Fluxo Completo (Passo a Passo)

```
SETUP:
1. User abre http://localhost:5173
2. Dashboard mostra lista vazia + botão "Novo Alerta"

CRIAÇÃO DO ALERTA:
3. User clica "Novo Alerta" → navega para /create
4. Digita "rio de janeiro" no campo "De"
5. Autocomplete mostra:
   - 🏙️ Rio de Janeiro (todos aeroportos)
   - ✈️ GIG — Galeão International
   - ✈️ SDU — Santos Dumont
6. User seleciona "Rio de Janeiro (todos)"
7. Digita "grécia" no campo "Para"
8. Autocomplete mostra:
   - 🏙️ Athens (todos aeroportos)
   - ✈️ ATH — Athens International
9. User seleciona "Athens International"
10. Define datas: 15/05 ida, 30/05 volta
11. Define preço alvo: R$ 3.200
12. Clica "Criar Alerta"
13. Backend:
    a. Salva alerta no SQLite
    b. Chama /flights/search-roundtrip com entityIds
    c. Encontra menor preço: R$ 3.450
    d. Salva no price_history
    e. Retorna alerta + preço inicial
14. User vê card no dashboard: "GIG → ATH | R$3.450 | Alvo: R$3.200"

MONITORAMENTO:
15. Cron roda a cada 4h
16. Busca preço → R$3.380 → salva no histórico
17. 4h depois → R$3.250 → salva
18. 4h depois → R$3.150 → TRIGGER!
19. Alerta muda para 🟢, notificação criada
20. User vê badge de notificação no dashboard
21. Card mostra: "🔔 Preço atingido! R$3.150"

VISUALIZAÇÃO:
22. User clica no card → tela de detalhe
23. Vê gráfico com evolução: 3.450 → 3.380 → 3.250 → 3.150
24. Linha vermelha tracejada no R$3.200
25. Tabela com cada checagem
26. Pode exportar CSV ou editar target para R$3.000 e reativar
```

---

## 12. Tratamento de Erros

| Cenário | Tratamento |
|---------|------------|
| API retorna erro 429 (rate limit) | Retry com backoff exponencial (2s, 4s, 8s). Log erro. Não marcar como falha permanente |
| API retorna erro 500 | Log, pular este alerta, tentar no próximo ciclo |
| API retorna response vazio (sem itinerários) | Salvar price_history com price=NULL e nota "no results". Não disparar alerta |
| entityId inválido no search | Retornar erro claro no POST /alerts: "Aeroporto não encontrado" |
| Data de viagem já passou | Cron auto-expira: se depart_date < hoje, status → 'expired' |
| API fora do ar por >24h | Após 6 falhas consecutivas, pausar alerta e notificar user |
| Autocomplete não retorna resultados | Mostrar "Nenhum aeroporto encontrado. Tente outro termo." |

---

## 13. Configurações de CORS e Proxy

```javascript
// backend/src/index.js
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173'
}));

// frontend/vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
```

---

## 14. Dependências

### Backend (package.json)

```json
{
  "name": "alerta-viagem-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "axios": "^1.6.0",
    "better-sqlite3": "^9.0.0",
    "node-cron": "^3.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
```

### Frontend (package.json)

```json
{
  "name": "alerta-viagem-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.300.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## 15. Scope — O Que Implementar

### ✅ MVP (Este Sprint)

- Autocomplete de aeroportos (busca inteligente)
- CRUD de alertas (criar, listar, detalhe, editar target, deletar, pausar)
- Polling via cron a cada 4h
- Busca de preços na Flights Scraper Sky API
- Comparação com target price
- Histórico de preços no SQLite
- Dashboard com cards de alertas
- Tela de detalhe com gráfico de preço (Recharts)
- Notificações visuais no dashboard (badge + card verde)
- Checagem manual (botão "verificar agora")
- Exportar histórico CSV
- Auto-expirar alertas com data passada

### ❌ Fora do MVP (Futuro)

- Notificação Telegram
- Notificação por email
- Múltiplos usuários / autenticação
- Search Everywhere (destino mais barato)
- Calendário de preços (melhor dia para ir)
- Deploy em produção (Railway/Render)
- PWA / push notifications
- Compartilhar alerta com amigo

---

## 16. Checklist para Claude Code

```
[ ] 1. Criar estrutura de diretórios (backend/ e frontend/)
[ ] 2. Inicializar backend: npm init + instalar deps
[ ] 3. Configurar .env com RAPIDAPI_KEY
[ ] 4. Implementar db/database.js + db/migrate.js (criar tabelas SQLite)
[ ] 5. Implementar db/queries.js (todas as queries)
[ ] 6. Implementar services/flightSearchApi.js (client da API)
[ ] 7. Implementar services/priceChecker.js (lógica de checagem)
[ ] 8. Implementar services/cronJob.js (polling agendado)
[ ] 9. Implementar routes/airports.js (proxy autocomplete)
[ ] 10. Implementar routes/alerts.js (CRUD completo)
[ ] 11. Implementar routes/notifications.js
[ ] 12. Implementar src/index.js (Express setup + cron start)
[ ] 13. Testar backend: criar alerta via curl, forçar checagem
[ ] 14. Inicializar frontend: npm create vite + instalar deps
[ ] 15. Configurar Tailwind CSS
[ ] 16. Implementar services/api.js (Axios client)
[ ] 17. Implementar AirportSearch.jsx (autocomplete)
[ ] 18. Implementar CreateAlert.jsx (form completo)
[ ] 19. Implementar AlertCard.jsx + SparklineChart.jsx
[ ] 20. Implementar Dashboard.jsx (lista de cards)
[ ] 21. Implementar PriceChart.jsx (Recharts LineChart)
[ ] 22. Implementar PriceHistoryTable.jsx
[ ] 23. Implementar AlertDetail.jsx (gráfico + tabela + ações)
[ ] 24. Implementar NotificationBadge.jsx
[ ] 25. Configurar React Router (/, /create, /alerts/:id)
[ ] 26. Configurar Vite proxy para /api
[ ] 27. Testar fluxo completo: criar alerta → ver dashboard → ver detalhe
[ ] 28. Ajustar parsing do response da API (estrutura pode variar)
```

---

## 17. Notas de Implementação Importantes

### ⚠️ Sobre o Response da API

A estrutura `data.everywhereDestination.buckets[*].items[*]` foi observada no playground mas pode variar dependendo dos params. Na implementação do `priceChecker.js`, fazer parsing resiliente:

```javascript
// Tentar múltiplos caminhos para encontrar itinerários
const itineraries = result?.data?.everywhereDestination?.buckets
  || result?.data?.itineraries?.buckets
  || result?.data?.buckets
  || [];
```

Recomendo: na primeira chamada bem-sucedida, logar `JSON.stringify(result, null, 2)` para mapear a estrutura real.

### ⚠️ Sobre Entity IDs

Os `fromEntityId` e `toEntityId` NÃO são códigos IATA. São IDs internos do Skyscanner. Sempre usar o autocomplete primeiro para obter o ID correto. Guardar no banco o entityId, o nome e o displayCode (IATA).

### ⚠️ Rate Limiting

A API tem limites por plano. Implementar:
1. Sleep de 2s entre requests no cron
2. Retry com backoff em 429
3. Counter de requests/dia para não estourar plano