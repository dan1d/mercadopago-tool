# make-mercadopago

A Make.com integration starter package for Mercado Pago payments. Provides typed modules, webhook handling, and scenario templates to accelerate building custom Make.com apps with the Mercado Pago API.

## Setup

```bash
npm install
npm run build
```

## Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MERCADO_PAGO_ACCESS_TOKEN` | Yes | Your Mercado Pago access token from the developer dashboard |
| `MERCADO_PAGO_WEBHOOK_SECRET` | No | Secret key for validating webhook signatures |

## Webhook Configuration

1. Go to [Mercado Pago Developer Dashboard](https://www.mercadopago.com/developers/panel/app)
2. Select your application
3. Navigate to Webhooks (IPN) settings
4. Set the notification URL to your server endpoint (e.g., `https://your-domain.com/webhook`)
5. Select "Payments" as the event type
6. Save the configuration

The webhook handler validates incoming notifications, fetches the full payment data from the API, and delivers a normalized payload to your callback.

## Usage

### Basic Client

```typescript
import { MakeClient } from "make-mercadopago";

const client = new MakeClient(process.env.MERCADO_PAGO_ACCESS_TOKEN!);
```

### Create a Payment Preference

```typescript
import { MakeClient, createPaymentPreference } from "make-mercadopago";

const client = new MakeClient(process.env.MERCADO_PAGO_ACCESS_TOKEN!);

const result = await createPaymentPreference(client, {
  title: "Premium Plan",
  quantity: 1,
  currency: "ARS",
  unitPrice: 4999.99,
  backUrls: {
    success: "https://yoursite.com/success",
    failure: "https://yoursite.com/failure",
  },
  notificationUrl: "https://yoursite.com/webhook",
  externalReference: "order-123",
});

console.log(result.init_point); // Redirect user here
```

### Handle Webhooks

```typescript
import { createPaymentWebhookHandler } from "make-mercadopago";

const handler = createPaymentWebhookHandler({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  secret: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
  onPayment: async (payment) => {
    console.log(`Payment ${payment.payment_id}: ${payment.status}`);
    console.log(`Amount: ${payment.currency_id} ${payment.transaction_amount}`);
    console.log(`Payer: ${payment.payer_email}`);
  },
});

// Use with any framework that supports the Fetch API Request/Response
```

### Search Payments

```typescript
import { MakeClient, searchPayments } from "make-mercadopago";

const client = new MakeClient(process.env.MERCADO_PAGO_ACCESS_TOKEN!);

const { results, paging } = await searchPayments(client, {
  status: "approved",
  sort: "date_created",
  criteria: "desc",
  limit: 20,
});
```

### Issue a Refund

```typescript
import { MakeClient, createRefund } from "make-mercadopago";

const client = new MakeClient(process.env.MERCADO_PAGO_ACCESS_TOKEN!);

// Full refund
await createRefund(client, 12345678);

// Partial refund
await createRefund(client, 12345678, 500.00);
```

## Example Make Scenarios

### 1. New Payment Approved -> Send Telegram Message

Webhook trigger receives payment notification. A filter checks `status === "approved"`. The Telegram module sends a message: "New payment of {{currency}} {{amount}} from {{payer_email}}".

### 2. New Payment Approved -> Send WhatsApp Confirmation

Same webhook trigger with approval filter. The WhatsApp Business module sends a template message to the payer's phone number with the payment details and receipt link.

### 3. New Payment Approved -> Add Row to Google Sheets

Webhook trigger fires on new payment. A Google Sheets module appends a row with: payment_id, date, amount, currency, payer_email, status, external_reference.

### 4. Create Payment Preference from Form Submission

A form submission (Typeform, Google Forms, or Make webhook) triggers the scenario. The "Create Payment Preference" module generates a checkout link. An email or messaging module sends the payment link to the customer.

### 5. Refund Payment Manually from Make

A manual trigger or scheduled search finds payments matching specific criteria. The "Create Refund" module processes the refund. A notification module alerts the team.

## How to Adapt This into a Full Make Custom App

Each module in this package maps directly to a Make.com custom app component:

| This Package | Make Custom App Component | Description |
|---|---|---|
| `createPaymentPreference` | **Action** | Creates a payment preference and returns the checkout URL |
| `getPayment` | **Action** / **Search** | Fetches a single payment by ID |
| `searchPayments` | **Search** | Queries payments with filters, returns paginated results |
| `createRefund` | **Action** | Issues a full or partial refund on a payment |
| `getMerchantInfo` | **Action** | Retrieves the authenticated merchant's profile |
| `createPaymentWebhookHandler` | **Instant Trigger** (Webhook) | Listens for real-time payment notifications from Mercado Pago |
| `verifyWebhookSignature` | Part of the Instant Trigger | Validates that webhook requests are authentic |

### Steps to create the Make custom app:

1. **Connection**: Use OAuth2 or API Key authentication. The `MakeClient` constructor shows what is needed: a single access token passed as Bearer auth.

2. **Modules**: Each exported function becomes a Make module. Define input fields (the function parameters) and output fields (the return type) in the Make module editor.

3. **Webhooks**: Register `createPaymentWebhookHandler` as an Instant Trigger. Make will provide the webhook URL; configure it in the Mercado Pago dashboard.

4. **Communication**: The `MakeClient` methods (`get`, `post`) show the exact HTTP calls. Translate these into Make's communication tab using their `rpc://` or direct HTTP configuration.

5. **Templates**: The JSON files in `src/templates/` provide starting points for scenario blueprints that users can import.

## Running Tests

```bash
npm test
```
