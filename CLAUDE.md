# CLAUDE.md — mercadopago-tool

## Project overview

Open-source Mercado Pago tool connector for AI agents and chat interfaces. Enables payment link generation, payment management, and refunds from multiple channels (AI agents, Telegram, WhatsApp).

## Tech stack

- **Runtime:** Node.js 18+ (native fetch, no axios/node-fetch)
- **Language:** TypeScript strict mode
- **Module system:** Node16 (ESM with `.js` extensions in imports)
- **Tests:** vitest (124 tests across 11 suites)
- **No web framework** — uses Web Standard Request/Response API

## Key commands

```bash
npm test              # Run all tests (vitest)
npm run build         # Compile TypeScript → dist/
npm run bot           # Start Telegram bot
npm run whatsapp      # Start WhatsApp webhook server
npm start             # Start unified server (src/server.ts)
npm run dev:server    # Start server in dev mode (tsx watch)
npm run integration   # Run integration test against real MP API
npx tsc --noEmit      # Type-check without building
docker compose up -d  # Run via Docker
```

## Architecture

The project has a flat core + channel modules pattern:

- **Core** (`src/client.ts`, `src/actions.ts`, `src/schemas.ts`, `src/errors.ts`) — Mercado Pago API client and 5 actions
- **Webhook** (`src/webhook.ts`) — IPN handler with HMAC-SHA256 validation
- **MCP Server** (`src/mcp-server.ts`) — Model Context Protocol server for AI agents
- **Telegram** (`src/telegram-bot.ts`) — Telegram bot using node-telegram-bot-api
- **WhatsApp** (`src/whatsapp/`) — WhatsApp Business Cloud API module (4 files)
- **Unified Server** (`src/server.ts`) — Single HTTP entry point mounting all webhooks + health endpoint
- **Index** (`src/index.ts`) — Re-exports everything, provides `createMercadoPagoTools()` registry

## Code conventions

- All imports use `.js` extension (Node16 module resolution)
- Errors are typed via `MercadoPagoError` class with `.isUnauthorized`, `.isNotFound`, `.isRateLimited`
- Actions take `(client, params)` pattern — client is injected, not global
- Tests mock `fetch` globally with `vi.stubGlobal("fetch", mockFetch)` — no real API calls
- Bot/channel messages are in Spanish (LATAM merchants target audience)
- Webhook handlers are framework-agnostic: `(Request) => Promise<Response>`

## Environment variables

- `MERCADO_PAGO_ACCESS_TOKEN` — Required for all MP operations
- `TELEGRAM_BOT_TOKEN` — Telegram bot
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` — WhatsApp
- `WA_NOTIFY_PHONE` — WhatsApp phone number to send payment notifications to
- `MERCADO_PAGO_WEBHOOK_SECRET` — HMAC secret for MP webhook signature validation
- `MP_CURRENCY` (default: ARS), `MP_SUCCESS_URL` — Optional config

## Testing patterns

- Mock fetch at module level, reset in beforeEach
- Use `jsonResponse()` helper for mock responses
- Test validation errors, API payloads, error handling, and edge cases
- WhatsApp handlers mock `sendMessage` via `vi.spyOn` instead of fetch

## Do NOT

- Do not add express, fastify, or any web framework
- Do not use axios or node-fetch (native fetch only)
- Do not modify existing tests when adding new features
- Do not commit .env files
