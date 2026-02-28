# A Outra Jornada

Monitoramento de precos de voos. Defina alertas para rotas aereas e receba notificacoes quando o preco atingir o valor desejado.

## Stack

| Camada    | Tecnologia                                                     |
|-----------|----------------------------------------------------------------|
| Backend   | Node.js, Express, SQLite (better-sqlite3), node-cron, axios   |
| Frontend  | React 18, Vite, Tailwind CSS, Recharts, Lucide React          |
| API       | Flights Scraper Sky (RapidAPI) — `flights-sky.p.rapidapi.com` |

## Estrutura do projeto

```
backend/
  src/
    index.js            # Express + cron init + serve frontend em producao
    config.js           # Variaveis de ambiente centralizadas
    routes/
      alerts.js         # CRUD de alertas + verificacao manual + export CSV
      airports.js       # Proxy para auto-complete da API
      notifications.js  # Notificacoes (listar + marcar como lida)
    services/
      flightSearchApi.js # Cliente RapidAPI com retry/backoff
      priceChecker.js    # Comparacao de precos + busca por aproximacao
      cronJob.js         # Polling agendado (a cada N horas)
    db/
      database.js       # Conexao SQLite com WAL mode
      migrate.js        # Criacao de tabelas no startup
      queries.js        # Queries SQL encapsuladas
    middleware/
      errorHandler.js   # Handler global de erros
  data/                 # Banco SQLite (criado automaticamente)

frontend/
  src/
    pages/
      Dashboard.jsx     # Lista de alertas
      CreateAlert.jsx   # Formulario de novo alerta
      AlertDetail.jsx   # Detalhe com grafico e historico
    components/
      AlertCard.jsx     # Card de alerta com sparkline
      AirportSearch.jsx # Autocomplete de aeroportos
      PriceChart.jsx    # Grafico de evolucao (Recharts)
      PriceHistoryTable.jsx
      SparklineChart.jsx
      NotificationBadge.jsx
    services/
      api.js            # Cliente axios para o backend
    styles/
      globals.css       # Design system (variaveis CSS, componentes)
```

## Pre-requisitos

- Node.js 18+
- npm
- Chave da API [Flights Scraper Sky](https://rapidapi.com/ntd119/api/flights-sky) no RapidAPI

## Setup local

### 1. Clonar o repositorio

```bash
git clone https://github.com/lvgalvao/flightmimi.git
cd flightmimi
```

### 2. Configurar variaveis de ambiente

```bash
cp backend/.env.example backend/.env
```

Edite `backend/.env` e adicione sua chave:

```
RAPIDAPI_KEY=sua_chave_aqui
```

Variaveis disponiveis:

| Variavel                    | Default                               | Descricao                        |
|-----------------------------|---------------------------------------|----------------------------------|
| `RAPIDAPI_KEY`              | —                                     | Chave da API (obrigatoria)       |
| `RAPIDAPI_HOST`             | `flights-sky.p.rapidapi.com`          | Host da API                      |
| `RAPIDAPI_BASE_URL`         | `https://flights-sky.p.rapidapi.com`  | URL base da API                  |
| `PORT`                      | `3001`                                | Porta do backend                 |
| `CRON_INTERVAL_HOURS`       | `4`                                   | Intervalo de checagem automatica |
| `MAX_ACTIVE_ALERTS`         | `5`                                   | Limite de alertas ativos         |
| `DELAY_BETWEEN_REQUESTS_MS` | `2000`                                | Delay entre chamadas da API      |
| `MAX_RETRIES`               | `3`                                   | Tentativas em caso de erro       |
| `API_TIMEOUT_MS`            | `30000`                               | Timeout por requisicao           |
| `DEFAULT_CURRENCY`          | `BRL`                                 | Moeda padrao                     |
| `DEFAULT_MARKET`            | `BR`                                  | Mercado padrao                   |
| `DEFAULT_LOCALE`            | `pt-BR`                               | Locale padrao                    |

### 3. Instalar dependencias

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 4. Rodar em desenvolvimento

Abra dois terminais:

**Terminal 1 — Backend (porta 3001):**

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (porta 5173):**

```bash
cd frontend
npm run dev
```

Acesse: http://localhost:5173

## Deploy no Replit

O backend serve o frontend compilado em producao. Basta um unico processo:

### Run command

```bash
cd frontend && npm install && npm run build && cd ../backend && npm install && npm start
```

### Variavel de ambiente

No Replit, adicione o secret `RAPIDAPI_KEY` com sua chave da API.

O app ficara disponivel na porta `3001`.

## Endpoints da API

| Metodo | Rota                        | Descricao                          |
|--------|-----------------------------|------------------------------------|
| GET    | `/api/health`               | Health check                       |
| GET    | `/api/alerts`               | Listar todos os alertas            |
| POST   | `/api/alerts`               | Criar novo alerta                  |
| GET    | `/api/alerts/:id`           | Detalhe do alerta + historico      |
| PUT    | `/api/alerts/:id`           | Atualizar alerta (preco/status)    |
| DELETE | `/api/alerts/:id`           | Deletar alerta                     |
| POST   | `/api/alerts/:id/check`     | Forcar verificacao de preco agora  |
| GET    | `/api/alerts/:id/export`    | Exportar historico como CSV        |
| GET    | `/api/airports/search?q=`   | Buscar aeroportos (autocomplete)   |
| GET    | `/api/notifications`        | Listar notificacoes                |
| PUT    | `/api/notifications/:id/read` | Marcar notificacao como lida     |

## Como funciona

1. O usuario cria um alerta com origem, destino, datas, passageiros e preco alvo
2. O cron job roda a cada 4 horas e consulta a API do Skyscanner para cada alerta ativo
3. Se a busca na data exata nao retorna resultados, tenta automaticamente datas proximas (±1 a ±3 dias)
4. O preco e salvo no historico e o grafico de evolucao e atualizado
5. Quando o preco atinge o alvo, uma notificacao e criada

## Banco de dados

SQLite com 3 tabelas criadas automaticamente no primeiro startup:

- **alerts** — configuracao dos alertas (rota, datas, preco alvo, estado)
- **price_history** — snapshot de preco a cada checagem
- **notifications** — alertas disparados quando preco <= alvo
