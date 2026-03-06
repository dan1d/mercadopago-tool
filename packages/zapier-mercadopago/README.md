# Zapier Mercado Pago Integration (CobroYa)

A Zapier CLI app that connects Mercado Pago payments to 7,000+ apps via Zapier.

Part of the [CobroYa](https://cobroya.app) project.

## Setup for Zapier Developers

### Prerequisites

- Node.js 18 or later
- A Mercado Pago account with API credentials
- Zapier CLI (`npm install -g zapier-platform-cli`)

### Installation

```bash
cd packages/zapier-mercadopago
npm install
```

### Running Tests

```bash
npm test
```

### Authentication

This integration uses **Custom Authentication** with a Bearer token. Users provide their Mercado Pago Access Token, which is sent as an `Authorization: Bearer <token>` header on every request. The token is verified by calling the `/users/me` endpoint.

To obtain an Access Token:

1. Go to the [Mercado Pago Developer Dashboard](https://www.mercadopago.com/developers/panel/app).
2. Select or create an application.
3. Navigate to **Credentials** and copy the **Access Token** (production or test).

## Available Actions

### Triggers

- **Payment Updated** (`payment_updated`) -- Polls for recently created or updated payments sorted by `date_last_updated`. Zapier deduplicates by payment `id`.

### Creates (Actions)

- **Create Payment Preference** (`create_payment_preference`) -- Creates a checkout preference with item details (title, quantity, currency, unit price), optional back URLs, and notification URL. Returns the `init_point` link for redirecting buyers to checkout.
- **Create Refund** (`create_refund`) -- Issues a full or partial refund for a given payment ID.

### Searches

- **Find Payment** (`find_payment`) -- Looks up a single payment by its ID.
- **Search Payments** (`search_payments`) -- Searches payments with optional filters for status, sort field, sort order, and result limit.
- **Get Merchant Info** (`get_merchant_info`) -- Retrieves the authenticated merchant account information (nickname, email, country).

## Project Structure

```
src/
  index.js              # Main app definition (exports auth, creates, searches, triggers)
  authentication.js     # Custom auth with Bearer token + /users/me test
  creates/
    create_payment_preference.js
    create_refund.js
  searches/
    find_payment.js
    search_payments.js
    get_merchant_info.js
  triggers/
    payment_updated.js
test/
  creates.test.js
  searches.test.js
  triggers.test.js
```

## Example Zaps

- **New payment -> Gmail notification**: Trigger on Payment Updated (status = approved), send an email via Gmail with payment details.
- **New payment -> Google Sheets row**: Trigger on Payment Updated, create a new row in Google Sheets with the payment amount, status, and date.
- **Typeform submission -> Payment Preference**: When a Typeform response is submitted, create a Mercado Pago payment preference and send the checkout link back via email.

## Publishing

1. Install the Zapier CLI globally: `npm install -g zapier-platform-cli`
2. Log in: `zapier login`
3. Register the app (first time only): `zapier register "Mercado Pago"`
4. Push: `zapier push`
5. Invite users or submit for public listing via the Zapier Developer Platform.
