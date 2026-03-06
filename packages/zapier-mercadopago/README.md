# Zapier Mercado Pago Integration

A Zapier CLI app that connects Mercado Pago payments to 5,000+ apps via Zapier.

## Setup

1. Obtain your Mercado Pago Access Token from the [developer dashboard](https://www.mercadopago.com/developers/panel/app).
2. When adding a Mercado Pago step in your Zap, paste the Access Token in the authentication prompt.
3. Zapier will verify the token by calling the `/users/me` endpoint.

## Available Actions

### Triggers

- **Payment Updated** -- Polls for recently created or updated payments (sorted by `date_last_updated`). Zapier deduplicates by payment `id`.

### Creates (Actions)

- **Create Payment Preference** -- Creates a checkout preference with item details, optional back URLs, and notification URL. Returns the `init_point` link for redirecting buyers to checkout.
- **Create Refund** -- Issues a full or partial refund for a given payment ID.

### Searches

- **Find Payment** -- Looks up a single payment by its ID.
- **Search Payments** -- Searches payments with optional filters for status, sort field, sort order, and result limit.

## Example Zaps

- **New payment -> Gmail notification**: Trigger on Payment Updated (status = approved), send an email via Gmail with payment details.
- **New payment -> Google Sheets row**: Trigger on Payment Updated, create a new row in Google Sheets with the payment amount, status, and date.
- **Typeform submission -> Payment Preference**: When a Typeform response is submitted, create a Mercado Pago payment preference and send the checkout link back via email.

## Development

```bash
npm install
npm test
```

## Publishing

1. Install the Zapier CLI globally: `npm install -g zapier-platform-cli`
2. Log in: `zapier login`
3. Register the app (first time only): `zapier register "Mercado Pago"`
4. Push: `zapier push`
5. Invite users or submit for public listing via the Zapier Developer Platform.
