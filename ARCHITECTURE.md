# Architecture

## System diagram

```
┌─────────────────────────────────────────────────────────┐
│                    mercadopago-tool                       │
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │              CORE (src/)                      │       │
│  │                                               │       │
│  │  client.ts ──── MercadoPagoClient            │       │
│  │     │            (Bearer auth, GET/POST,      │       │
│  │     │             idempotency keys)           │       │
│  │     ▼                                         │       │
│  │  actions.ts ── 5 actions:                     │       │
│  │     │          create_payment_preference      │       │
│  │     │          get_payment                    │       │
│  │     │          create_refund                  │       │
│  │     │          search_payments                │       │
│  │     │          get_merchant_info              │       │
│  │     ▼                                         │       │
│  │  schemas.ts ── JSON schemas + TS interfaces   │       │
│  │  errors.ts ─── MercadoPagoError (typed)       │       │
│  │  index.ts ──── createMercadoPagoTools()       │       │
│  └───────────┬──────────────────────────────────┘       │
│              │                                           │
│    ┌─────────┼──────────┬──────────────┐                │
│    ▼         ▼          ▼              ▼                 │
│  ┌─────┐  ┌──────┐  ┌─────────┐  ┌──────────┐         │
│  │ MCP │  │ Tele │  │WhatsApp │  │ Webhook  │         │
│  │Serve│  │ gram │  │         │  │  (IPN)   │         │
│  │ r   │  │ Bot  │  │client.ts│  │          │         │
│  │     │  │      │  │parser.ts│  │ HMAC-256 │         │
│  │ Zod │  │ poll │  │handler  │  │ validate │         │
│  │ sche│  │ ing  │  │webhook  │  │          │         │
│  └──┬──┘  └──┬───┘  └────┬───┘  └────┬─────┘         │
│     │        │            │           │                 │
│     ▼        ▼            ▼           ▼                 │
│   stdio    Telegram    WhatsApp    HTTP POST            │
│   (AI      Bot API     Cloud API   from MP              │
│   agents)              (Meta)                           │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │         server.ts (unified HTTP server)         │     │
│  │  Mounts MP webhook + WhatsApp webhook + health  │     │
│  │  Single entry point for Docker / Railway deploy │     │
│  └────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

## File map

```
mercadopago-tool/
├── src/
│   ├── client.ts              # MercadoPagoClient (HTTP client with auth)
│   ├── actions.ts             # 5 MP API actions
│   ├── schemas.ts             # TypeScript interfaces + JSON schemas
│   ├── errors.ts              # MercadoPagoError (typed error class)
│   ├── index.ts               # Public API — createMercadoPagoTools() + re-exports
│   ├── webhook.ts             # MP IPN webhook handler (HMAC-SHA256)
│   ├── mcp-server.ts          # MCP server for AI agents (stdio transport)
│   ├── telegram-bot.ts        # Telegram bot (polling mode)
│   ├── server.ts              # Unified HTTP server (all webhooks + health)
│   ├── global.d.ts            # Global type declarations (fetch)
│   └── whatsapp/
│       ├── client.ts          # WhatsAppClient (Meta Graph API v18.0)
│       ├── message-parser.ts  # Command parser + webhook payload extractor
│       ├── handlers.ts        # Command handlers + payment notifier
│       └── webhook.ts         # GET verify + POST handler + re-exports
├── tests/                     # 124 tests, 11 suites
├── bin/
│   ├── mcp-server.mjs         # CLI entry: npx mercadopago-mcp
│   └── telegram-bot.mjs       # CLI entry: npx mercadopago-telegram
├── scripts/
│   ├── integration.ts         # Real API integration test
│   └── whatsapp-server.ts     # HTTP server for WhatsApp webhook
├── Dockerfile                 # Multi-stage Node.js build
├── docker-compose.yml         # Container config with env vars
├── railway.json               # Railway deploy config
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Data flow

### Payment link creation (any channel)

```
User message → Channel parser → createPaymentPreference() → MP API
                                        │
                                        ▼
                              { init_point: "https://mp.com/..." }
                                        │
                                        ▼
                              Channel sends link to user
```

### Payment notification

```
Buyer pays → MP IPN webhook POST → webhook.ts validates HMAC
                                        │
                                        ▼
                               Fetches full payment via API
                                        │
                                        ▼
                               onPayment callback
                                        │
                              ┌─────────┴──────────┐
                              ▼                    ▼
                     Telegram notify       WhatsApp notify
                     (sendMessage)         (createPaymentNotifier)
```

## Key design decisions

1. **Framework-agnostic webhooks** — All webhook handlers use `(Request) => Promise<Response>`. Works with Cloudflare Workers, Deno, Bun, Next.js, or plain Node.js http.

2. **Client injection** — Actions receive `MercadoPagoClient` as first param, not a global singleton. Enables testing with mocks and multiple accounts.

3. **Channel separation** — Each channel (Telegram, WhatsApp, MCP) is independent. They all consume the same core `createMercadoPagoTools()` registry.

4. **Native fetch** — No HTTP library dependencies. Works on Node 18+ without polyfills.

5. **Typed errors** — `MercadoPagoError` carries status code and convenience getters (`isNotFound`, etc.) so channel handlers can show appropriate messages.

## Deploy

- **Dockerfile** — Multi-stage build (build stage compiles TS, production stage runs `dist/server.js` with minimal image)
- **docker-compose.yml** — Passes all env vars, maps port
- **railway.json** — Railway platform config pointing to Dockerfile; deploy with `railway up`

## Test strategy

- **Unit tests** mock `fetch` globally — zero network calls
- **WhatsApp handler tests** mock `sendMessage` via `vi.spyOn` to test command flow without Graph API
- **Integration script** (`npm run integration`) hits real MP API for smoke testing
- All tests run in <300ms
