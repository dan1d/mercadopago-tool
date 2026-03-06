# PLAN.md — mercadopago-tool roadmap

## Completed

### Phase 1: Core SDK
- [x] MercadoPagoClient with Bearer auth, GET/POST, idempotency keys
- [x] 5 actions: create_payment_preference, get_payment, create_refund, search_payments, get_merchant_info
- [x] JSON schemas for AI agent tool registration
- [x] MercadoPagoError typed class (isUnauthorized, isNotFound, isRateLimited)
- [x] createMercadoPagoTools() registry
- [x] back_urls + notification_url support on preferences
- [x] SearchPayments with query filters (status, sort, pagination)
- [x] 38 tests

### Phase 2: Webhook + MCP + Telegram (built in parallel)
- [x] MP IPN webhook handler with HMAC-SHA256 signature validation
- [x] Framework-agnostic Request/Response pattern
- [x] MCP Server with @modelcontextprotocol/sdk + Zod schemas
- [x] Telegram bot: /cobrar, /pagos, /estado, /devolver, /help
- [x] CLI binaries: mercadopago-mcp, mercadopago-telegram
- [x] Integration test script
- [x] 75 tests total

### Phase 3: WhatsApp Business
- [x] WhatsAppClient for Meta Graph API v18.0
- [x] Message parser (cobrar, pagos, estado, devolver, ayuda)
- [x] Command handlers with shared MP tools
- [x] WhatsApp webhook (GET verify + POST messages)
- [x] Payment notifier (WhatsApp notification on approved payments)
- [x] HTTP server script for local dev
- [x] 124 tests total

## Next up

### Phase 4: Deploy & monetize
- [x] Dockerize (Dockerfile + docker-compose with env vars)
- [x] Deploy config for Railway
- [ ] npm publish as package
- [ ] GitHub repo + CI/CD (GitHub Actions: test + build + publish)
- [ ] Landing page with setup instructions

### Phase 5: Multi-merchant SaaS
- [ ] Multi-tenant support (multiple MP tokens per merchant)
- [ ] Persistent storage for preferences/payments (SQLite or Postgres)
- [ ] Admin dashboard (payment history, analytics)
- [ ] Rate limiting per merchant
- [ ] Subscription/commission model

### Phase 6: Advanced features
- [ ] Recurring payments (MP subscriptions API)
- [ ] QR code generation for in-person payments
- [ ] Invoice generation (PDF)
- [ ] Multi-currency support with automatic detection by merchant country
- [ ] Webhook retry queue (dead letter handling)
- [ ] Discord channel integration
- [ ] Slack channel integration

### Phase 7: AI agent marketplace
- [ ] Publish as MCP tool in official registry
- [ ] Composio integration
- [ ] LangChain/LangGraph tool wrapper
- [ ] OpenAI function calling adapter
- [ ] Agent-to-agent payment protocol

## Revenue strategy (immediate)

1. **Telegram/WhatsApp bot as a service** — Merchants pay monthly to use hosted bot
2. **Transaction fee** — Small % per payment link generated (on top of MP fees)
3. **npm package + premium features** — Free core, paid multi-merchant/analytics
4. **MCP marketplace listing** — Visibility to AI agent builders
