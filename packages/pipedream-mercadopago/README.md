# Pipedream Mercado Pago Components

Pipedream components for integrating with the Mercado Pago payments API. Includes actions for creating payment preferences, retrieving payments, issuing refunds, and a polling source that triggers on payment updates.

## Prerequisites

- A [Pipedream](https://pipedream.com) account
- A [Mercado Pago](https://www.mercadopago.com) developer account with an access token

## Setup

1. In Pipedream, go to **Accounts** and connect your Mercado Pago account using your `access_token` (found in the Mercado Pago developer dashboard under **Credentials**).
2. The components will automatically use the connected account for all API requests.

## Available Components

### Actions

| Component | Key | Description |
|---|---|---|
| **Create Payment Preference** | `mercadopago-create-payment-preference` | Creates a checkout payment preference (payment link) with item details, back URLs, and notification URL |
| **Get Payment** | `mercadopago-get-payment` | Retrieves full details of a payment by its ID |
| **Create Refund** | `mercadopago-create-refund` | Issues a full or partial refund for a payment |
| **Get Merchant Info** | `mercadopago-get-merchant-info` | Retrieves the authenticated merchant/user account information |

### Sources (Triggers)

| Component | Key | Description |
|---|---|---|
| **Payment Updated** | `mercadopago-payment-updated` | Polls for new or updated payments every 60 seconds (configurable) |

## Example Workflows

### 1. New payment notification to Slack

Trigger: **Payment Updated** source
Steps:
- Filter by `payment.status === "approved"`
- Send a Slack message: "Payment received: ${{steps.trigger.event.transaction_amount}} {{steps.trigger.event.currency_id}} from {{steps.trigger.event.payer.email}}"

### 2. Log payments to Airtable

Trigger: **Payment Updated** source
Steps:
- Create a row in Airtable with columns: Payment ID, Amount, Currency, Status, Payer Email, Date

### 3. Create a payment link from an HTTP request

Trigger: HTTP webhook
Steps:
- Parse the incoming request body for `title`, `price`, and `currency`
- Run **Create Payment Preference** action with those values
- Return the `init_point` URL (the checkout link) in the HTTP response

### 4. Manual refund workflow

Trigger: HTTP webhook or manual trigger
Steps:
- Accept `payment_id` and optional `amount` as input
- Run **Create Refund** action
- Send confirmation via email or Slack

## API Reference

All components use the Mercado Pago REST API v1:
- [Preferences API](https://www.mercadopago.com/developers/en/reference/preferences/_checkout_preferences/post)
- [Payments API](https://www.mercadopago.com/developers/en/reference/payments/_payments_id/get)
- [Refunds API](https://www.mercadopago.com/developers/en/reference/chargebacks/_payments_id_refunds/post)
- [Users API](https://www.mercadopago.com/developers/en/reference/users/_users_me/get)
