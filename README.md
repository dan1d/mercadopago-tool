# CobroYa

**Cobra con Mercado Pago en 10 segundos.**

[![npm version](https://img.shields.io/npm/v/cobroya)](https://www.npmjs.com/package/cobroya)
[![tests](https://img.shields.io/github/actions/workflow/status/dan1d/mercadopago-tool/ci.yml?label=tests)](https://github.com/dan1d/mercadopago-tool/actions)
[![coverage](https://img.shields.io/codecov/c/github/dan1d/mercadopago-tool)](https://codecov.io/gh/dan1d/mercadopago-tool)
[![license](https://img.shields.io/npm/l/cobroya)](./LICENSE)

CobroYa is an open-source Mercado Pago payment tool for AI agents, Telegram, WhatsApp, and automation platforms. Create payment links, search payments, issue refunds -- all from your AI assistant or chat bot.

[Website](https://cobroya.app) | [npm](https://www.npmjs.com/package/cobroya) | [GitHub](https://github.com/dan1d/mercadopago-tool)

---

## Quick Start with AI

CobroYa is an MCP (Model Context Protocol) server. Add it to your AI tool in one step -- no cloning, no building. Just provide your [Mercado Pago access token](https://www.mercadopago.com/developers/en/docs/checkout-pro/additional-content/your-integrations/credentials).

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cobroya": {
      "command": "npx",
      "args": ["-y", "cobroya"],
      "env": {
        "MERCADO_PAGO_ACCESS_TOKEN": "APP_USR-..."
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add cobroya -- npx -y cobroya \
  --env MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
```

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "cobroya": {
      "command": "npx",
      "args": ["-y", "cobroya"],
      "env": {
        "MERCADO_PAGO_ACCESS_TOKEN": "APP_USR-..."
      }
    }
  }
}
```

### Windsurf

Add to your Windsurf MCP configuration:

```json
{
  "mcpServers": {
    "cobroya": {
      "command": "npx",
      "args": ["-y", "cobroya"],
      "env": {
        "MERCADO_PAGO_ACCESS_TOKEN": "APP_USR-..."
      }
    }
  }
}
```

> Once configured, ask your AI assistant things like: *"Create a payment link for $5000 for a Python course"* or *"Show me today's approved payments"*.

---

## Available Tools

CobroYa exposes 5 MCP tools that any connected AI agent can call:

| Tool | Description |
|------|-------------|
| `create_payment_preference` | Create a Mercado Pago checkout payment link. Returns an `init_point` URL to share with buyers. Supports `back_urls` and `notification_url`. |
| `get_payment` | Retrieve full details of a payment by ID, including status, amount, and payer info. |
| `search_payments` | Search payments with filters: `status` (approved, pending, rejected, etc.), sort order, and pagination. |
| `create_refund` | Issue a full or partial refund for a payment. Omit `amount` for a full refund. |
| `get_merchant_info` | Get the authenticated merchant's profile: user ID, nickname, and site. |

---

## Telegram Bot

CobroYa includes a ready-to-use Telegram bot: [@CobroYa_bot](https://t.me/CobroYa_bot)

### Self-hosting the bot

1. Create a bot via [@BotFather](https://t.me/BotFather) and get your token.
2. Set environment variables:

```bash
export MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..."
export TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
```

3. Run:

```bash
npx cobroya-telegram
```

Or from source:

```bash
npm run bot
```

---

## WhatsApp

CobroYa supports WhatsApp Business Cloud API for receiving commands and sending payment notifications.

1. Create a Meta app at [Meta for Developers](https://developers.facebook.com/) and enable WhatsApp Business API.
2. Set environment variables:

```bash
export WHATSAPP_ACCESS_TOKEN="your-meta-graph-api-token"
export WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
export WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"
```

3. Run the webhook server:

```bash
npm run whatsapp
# Starts on http://localhost:3000/webhook
```

4. Expose with ngrok (`ngrok http 3000`) and configure the webhook URL in your Meta Dashboard.

For full details on supported commands and payment notifications, see the [WhatsApp documentation](https://cobroya.app).

---

## Automation Platforms

Pre-built packages for popular automation platforms are available in the `packages/` directory:

- **n8n** -- `packages/n8n-nodes-mercadopago`
- **Zapier** -- `packages/zapier-mercadopago`
- **Make** -- `packages/make-mercadopago`
- **Pipedream** -- `packages/pipedream-mercadopago`

Each package wraps the CobroYa core with platform-specific configuration. See the README in each package for setup instructions.

---

## Programmatic Usage

Install as a dependency:

```bash
npm install cobroya
```

```typescript
import { createMercadoPagoTools } from "cobroya";

const mp = createMercadoPagoTools(process.env.MERCADO_PAGO_ACCESS_TOKEN!);

// Create a payment link
const pref = await mp.tools.create_payment_preference({
  title: "Premium Plan",
  quantity: 1,
  currency: "ARS",
  unit_price: 5000,
});
console.log(pref.init_point); // Checkout URL to share with the buyer

// Search approved payments
const payments = await mp.tools.search_payments({ status: "approved", limit: 10 });

// Get payment details
const payment = await mp.tools.get_payment({ payment_id: "123456789" });

// Full refund
await mp.tools.create_refund({ payment_id: "123456789" });

// Partial refund
await mp.tools.create_refund({ payment_id: "123456789", amount: 500 });

// Merchant profile
const merchant = await mp.tools.get_merchant_info();
```

### Error Handling

```typescript
import { MercadoPagoError } from "cobroya";

try {
  await mp.tools.get_payment({ payment_id: "invalid" });
} catch (err) {
  if (err instanceof MercadoPagoError) {
    console.log(err.status);        // 404
    console.log(err.isNotFound);     // true
    console.log(err.isUnauthorized); // false
    console.log(err.isRateLimited);  // false
  }
}
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MERCADO_PAGO_ACCESS_TOKEN` | Yes | Mercado Pago API access token ([get one here](https://www.mercadopago.com/developers/en/docs/checkout-pro/additional-content/your-integrations/credentials)) |
| `TELEGRAM_BOT_TOKEN` | For Telegram | Telegram bot token from @BotFather |
| `WHATSAPP_ACCESS_TOKEN` | For WhatsApp | Meta Graph API token |
| `WHATSAPP_PHONE_NUMBER_ID` | For WhatsApp | WhatsApp Business phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | For WhatsApp | Webhook verification token |
| `WA_NOTIFY_PHONE` | No | Phone number for WhatsApp payment notifications |
| `MERCADO_PAGO_WEBHOOK_SECRET` | No | HMAC secret for Mercado Pago webhook signature validation |
| `MP_CURRENCY` | No | Default currency (defaults to `ARS`) |
| `MP_SUCCESS_URL` | No | Default success redirect URL for payment preferences |

---

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Type-check without emitting
npx tsc --noEmit

# Integration test against real Mercado Pago API
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-... npm run integration

# Start the unified server (Telegram + WhatsApp + webhooks)
npm start

# Dev mode with auto-reload
npm run dev:server

# Docker
docker compose up -d
```

---

## License

[MIT](./LICENSE) -- by [dan1d](https://dan1d.dev/)
