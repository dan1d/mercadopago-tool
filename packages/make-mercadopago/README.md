# make-mercadopago

A Make.com (formerly Integromat) custom app starter for Mercado Pago payments, part of the [CobroYa](https://cobroya.app) project. Provides typed modules, webhook handling, and scenario templates to accelerate building custom Make.com apps with the Mercado Pago API.

**Repository:** [github.com/dan1d/mercadopago-tool](https://github.com/dan1d/mercadopago-tool)

## Quick Start

```bash
npm install
npm run build
npm test
```

## Operations

This package implements 5 Mercado Pago operations plus webhook handling:

| Operation | Function | MP Endpoint | Make.com Component |
|---|---|---|---|
| Create Payment Preference | `createPaymentPreference` | `POST /checkout/preferences` | Action |
| Get Payment | `getPayment` | `GET /v1/payments/:id` | Action / Search |
| Search Payments | `searchPayments` | `GET /v1/payments/search` | Search |
| Create Refund | `createRefund` | `POST /v1/payments/:id/refunds` | Action |
| Get Merchant Info | `getMerchantInfo` | `GET /users/me` | Action |
| Payment Webhook | `createPaymentWebhookHandler` | IPN listener | Instant Trigger |

## Required Configuration

| Variable | Required | Description |
|---|---|---|
| `MERCADO_PAGO_ACCESS_TOKEN` | Yes | Your Mercado Pago access token from the [developer dashboard](https://www.mercadopago.com/developers/panel/app) |
| `MERCADO_PAGO_WEBHOOK_SECRET` | No | Secret key for validating webhook HMAC-SHA256 signatures |

## Make.com Custom App Setup

### 1. Create a Connection

In the Make.com custom app editor, define a connection using API Key authentication:

- **Type:** API Key (Bearer Token)
- **Field:** `accessToken` (label: "Mercado Pago Access Token")
- **Header:** `Authorization: Bearer {{connection.accessToken}}`

The `MakeClient` class in this package demonstrates the exact auth pattern: all requests to `https://api.mercadopago.com` include a `Bearer` token in the `Authorization` header.

### 2. Define Modules

Each exported function maps to a Make.com module. Below are the input/output field definitions for each:

#### Create Payment Preference (Action)

**Input fields:**
| Field | Type | Required | Description |
|---|---|---|---|
| `title` | text | Yes | Product or service name |
| `quantity` | number | Yes | Quantity (must be >= 1) |
| `currency` | text | Yes | Currency code (e.g., ARS, BRL, MXN, USD) |
| `unitPrice` | number | Yes | Price per unit (must be > 0) |
| `backUrls.success` | url | No | Redirect URL on successful payment |
| `backUrls.failure` | url | No | Redirect URL on failed payment |
| `backUrls.pending` | url | No | Redirect URL on pending payment |
| `notificationUrl` | url | No | Webhook URL for IPN notifications |
| `externalReference` | text | No | Your internal order/reference ID |

**Output fields:**
| Field | Type | Description |
|---|---|---|
| `preference_id` | text | Mercado Pago preference ID |
| `init_point` | url | Production checkout URL (redirect buyer here) |
| `sandbox_init_point` | url | Sandbox checkout URL for testing |

**Communication (HTTP call):**
```
POST https://api.mercadopago.com/checkout/preferences
Content-Type: application/json
Authorization: Bearer {{connection.accessToken}}
```

#### Get Payment (Action)

**Input fields:**
| Field | Type | Required | Description |
|---|---|---|---|
| `paymentId` | number | Yes | Mercado Pago payment ID |

**Output fields:** Full payment object from the API (id, status, status_detail, transaction_amount, currency_id, payer, etc.)

**Communication:**
```
GET https://api.mercadopago.com/v1/payments/{{paymentId}}
Authorization: Bearer {{connection.accessToken}}
```

#### Search Payments (Search)

**Input fields:**
| Field | Type | Required | Description |
|---|---|---|---|
| `status` | select | No | Filter by status: approved, pending, rejected, etc. |
| `externalReference` | text | No | Filter by your external reference ID |
| `sort` | text | No | Sort field (e.g., date_created) |
| `criteria` | select | No | Sort order: asc or desc |
| `limit` | number | No | Results per page (default 30) |
| `offset` | number | No | Pagination offset |

**Output fields:**
| Field | Type | Description |
|---|---|---|
| `results` | array | Array of payment objects |
| `paging.total` | number | Total matching payments |
| `paging.limit` | number | Results per page |
| `paging.offset` | number | Current offset |

**Communication:**
```
GET https://api.mercadopago.com/v1/payments/search?status={{status}}&limit={{limit}}
Authorization: Bearer {{connection.accessToken}}
```

#### Create Refund (Action)

**Input fields:**
| Field | Type | Required | Description |
|---|---|---|---|
| `paymentId` | number | Yes | Payment ID to refund |
| `amount` | number | No | Partial refund amount (omit for full refund) |

**Communication:**
```
POST https://api.mercadopago.com/v1/payments/{{paymentId}}/refunds
Content-Type: application/json
Authorization: Bearer {{connection.accessToken}}
```

#### Get Merchant Info (Action)

No input fields required. Returns the authenticated merchant's profile (id, nickname, email, site_id, etc.).

**Communication:**
```
GET https://api.mercadopago.com/users/me
Authorization: Bearer {{connection.accessToken}}
```

### 3. Set Up the Webhook (Instant Trigger)

The webhook module receives real-time payment notifications from Mercado Pago via IPN (Instant Payment Notification).

**Configuration steps:**

1. Go to the [Mercado Pago Developer Dashboard](https://www.mercadopago.com/developers/panel/app)
2. Select your application
3. Navigate to Webhooks (IPN) settings
4. Set the notification URL to the Make.com webhook URL (provided when you create the Instant Trigger)
5. Select "Payments" as the event type
6. Save the configuration

**Webhook output (normalized):**
| Field | Type | Description |
|---|---|---|
| `payment_id` | number | Payment ID |
| `status` | text | Payment status (approved, pending, rejected, etc.) |
| `status_detail` | text | Detailed status (accredited, pending_contingency, etc.) |
| `transaction_amount` | number | Payment amount |
| `currency_id` | text | Currency code |
| `external_reference` | text | Your external reference (or null) |
| `date_created` | date | When the payment was created |
| `date_approved` | date | When the payment was approved (or null) |
| `payer_email` | email | Payer's email address |
| `description` | text | Payment description |

The handler validates the incoming IPN notification, optionally verifies the HMAC-SHA256 signature (if `secret` is configured), fetches the full payment data from the API, and delivers a normalized payload.

## Usage Examples

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
await createRefund(client, 12345678, 500.0);
```

## Example Make.com Scenarios

1. **Payment Approved -> Telegram Message:** Webhook trigger receives payment notification. A filter checks `status === "approved"`. The Telegram module sends: "New payment of {{currency}} {{amount}} from {{payer_email}}".

2. **Payment Approved -> WhatsApp Confirmation:** Same webhook trigger with approval filter. WhatsApp Business module sends a template message with payment details.

3. **Payment Approved -> Google Sheets Row:** Webhook trigger appends a row with: payment_id, date, amount, currency, payer_email, status, external_reference.

4. **Form Submission -> Payment Link:** A form triggers the scenario. "Create Payment Preference" generates a checkout link. An email module sends the link to the customer.

5. **Manual Refund:** A manual trigger or scheduled search finds payments. "Create Refund" processes the refund. A notification module alerts the team.

## Scenario Templates

The `src/templates/` directory contains JSON blueprints that can be imported into Make.com:

- `payment-updated-webhook.json` - Webhook trigger configuration for payment notifications
- `create-payment-link-flow.json` - Flow to create a payment preference from form input

## Running Tests

```bash
npm test          # Run all 49 tests
npm run build     # Compile TypeScript to dist/
```

## License

MIT
