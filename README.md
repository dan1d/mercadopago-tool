# mercadopago-tool

Mercado Pago tool connector for AI agents. Exposes Mercado Pago API actions through a simple, typed interface that AI agents can call via MCP-style tool registries.

## Setup

```bash
npm install
npm run build
```

```bash
cp .env.example .env
# Edit .env with your real token
export MERCADO_PAGO_ACCESS_TOKEN="APP_USR-..."
```

Get your token from [Mercado Pago Developers](https://www.mercadopago.com/developers/en/docs/checkout-pro/additional-content/your-integrations/credentials).

## Actions

| Action | Description |
|--------|-------------|
| `create_payment_preference` | Create a checkout payment link with optional back_urls and notification_url |
| `get_payment` | Retrieve a payment by ID |
| `create_refund` | Full or partial refund of a payment |
| `search_payments` | Search payments with filters (status, sort, pagination) |
| `get_merchant_info` | Get merchant user profile |

## Agent Usage

```typescript
import { createMercadoPagoTools } from "mercadopago-tool";

const mp = createMercadoPagoTools(process.env.MERCADO_PAGO_ACCESS_TOKEN!);

// Create a payment link
const pref = await mp.tools.create_payment_preference({
  title: "Premium Plan",
  quantity: 1,
  currency: "ARS",
  unit_price: 5000,
  back_urls: {
    success: "https://myapp.com/success",
    failure: "https://myapp.com/failure",
  },
  notification_url: "https://myapp.com/webhooks/mp",
});
// pref.init_point -> checkout URL to share with the buyer

// Search approved payments
const payments = await mp.tools.search_payments({ status: "approved", limit: 10 });

// Refund a payment
const refund = await mp.tools.create_refund({ payment_id: "123456789" });

// Partial refund
const partial = await mp.tools.create_refund({ payment_id: "123456789", amount: 500 });

// Get payment details
const payment = await mp.tools.get_payment({ payment_id: "123456789" });

// List schemas for AI agent tool registration
console.log(mp.schemas);
```

## Error Handling

```typescript
import { MercadoPagoError } from "mercadopago-tool";

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

## Integration Test

Test against the real API:

```bash
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-... npm run integration
```

## Curl Examples

**Create preference:**

```bash
curl -X POST https://api.mercadopago.com/checkout/preferences \
  -H "Authorization: Bearer $MERCADO_PAGO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"title":"Test","quantity":1,"currency_id":"ARS","unit_price":1000}],"back_urls":{"success":"https://myapp.com/ok"},"notification_url":"https://myapp.com/webhooks/mp"}'
```

**Get payment:**

```bash
curl https://api.mercadopago.com/v1/payments/123456789 \
  -H "Authorization: Bearer $MERCADO_PAGO_ACCESS_TOKEN"
```

**Refund payment:**

```bash
curl -X POST https://api.mercadopago.com/v1/payments/123456789/refunds \
  -H "Authorization: Bearer $MERCADO_PAGO_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Search payments:**

```bash
curl "https://api.mercadopago.com/v1/payments/search?status=approved&limit=10" \
  -H "Authorization: Bearer $MERCADO_PAGO_ACCESS_TOKEN"
```

**Merchant info:**

```bash
curl https://api.mercadopago.com/users/me \
  -H "Authorization: Bearer $MERCADO_PAGO_ACCESS_TOKEN"
```

## WhatsApp Business Integration

### Setup

1. Create a Meta app at [Meta for Developers](https://developers.facebook.com/)
2. Enable WhatsApp Business API
3. Get your access token, phone number ID, and set a verify token

```bash
# Add to .env
WHATSAPP_ACCESS_TOKEN=your-meta-graph-api-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-webhook-verify-token
```

### Run the WhatsApp server

```bash
npm run whatsapp
# Server starts on http://localhost:3000/webhook
# Use ngrok to expose: ngrok http 3000
```

Then configure the webhook URL in Meta Dashboard: `https://your-ngrok-url/webhook`

### Supported commands

Users send plain text messages to your WhatsApp number:

```
cobrar 5000 curso python
→ 💳 Link de pago generado
  https://www.mercadopago.com/checkout/v1/redirect?pref_id=...

pagos
→ ✅ Aprobado
  $5000
  ID: 123456

estado 123456
→ Pago #123456
  Estado: ✅ Aprobado
  Monto: $5000

devolver 123456
→ Devolucion total realizada
  Monto devuelto: $5000

devolver 123456 2000
→ Devolucion parcial realizada
  Monto devuelto: $2000

ayuda
→ Lista de comandos
```

### Payment notifications

When a payment is confirmed via the Mercado Pago webhook, you can forward it to WhatsApp:

```typescript
import { createWhatsAppWebhookHandler, WhatsAppClient, createPaymentNotifier, createWebhookHandler } from "mercadopago-tool";

const wa = new WhatsAppClient({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
});

// Notify merchant on WhatsApp when payment is approved
const notifier = createPaymentNotifier(wa, "5491155551234");

const mpWebhook = createWebhookHandler({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  onPayment: notifier,
});
```

### Programmatic usage

```typescript
import { WhatsAppClient } from "mercadopago-tool";

const wa = new WhatsAppClient({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
});

await wa.sendMessage("5491155551234", "Tu pago fue recibido!");
```

## Testing

```bash
npm test
```

## License

MIT
