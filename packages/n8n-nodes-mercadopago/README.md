# n8n-nodes-mercadopago

This is an [n8n](https://n8n.io/) community node for [Mercado Pago](https://www.mercadopago.com/), the leading payment platform in Latin America.

It allows you to create checkout preferences, manage payments, issue refunds, and retrieve merchant account information directly from your n8n workflows.

## Installation

### Community Nodes (recommended)

1. Open your n8n instance.
2. Go to **Settings > Community Nodes**.
3. Click **Install a community node**.
4. Enter `n8n-nodes-mercadopago` and click **Install**.

### Manual Installation

```bash
npm install n8n-nodes-mercadopago
```

Then restart your n8n instance.

## Credentials

1. Log in to [Mercado Pago Developers](https://www.mercadopago.com/developers/panel/app).
2. Select or create an application.
3. Navigate to **Production credentials** (or **Test credentials** for sandbox).
4. Copy the **Access Token**.
5. In n8n, create a new **Mercado Pago API** credential and paste the access token.

The credential is validated automatically by calling the `/users/me` endpoint.

## Operations

### Payment Preference

| Operation | Description |
|-----------|-------------|
| **Create** | Create a checkout preference with items, back URLs, notification URL, external reference, expiration, and auto-return settings. |

### Payment

| Operation | Description |
|-----------|-------------|
| **Get** | Retrieve a payment by its ID. |
| **Search** | Search payments with filters: status, sort field, sort direction, limit, offset, and external reference. |

### Refund

| Operation | Description |
|-----------|-------------|
| **Create** | Create a full or partial refund for a payment. |

### Merchant

| Operation | Description |
|-----------|-------------|
| **Get Info** | Retrieve authenticated merchant account information. |

## Example Workflows

### Create a payment link and send it by email

1. Use the **Mercado Pago** node with **Payment Preference > Create** to generate a checkout preference.
2. Connect the output to a **Send Email** node, using the `init_point` field from the response as the payment link.

### Search payments and save to Google Sheets

1. Use the **Mercado Pago** node with **Payment > Search**, filtering by status `approved`.
2. Connect to a **Google Sheets** node to append each payment record to a spreadsheet.

### Refund a payment manually

1. Use a **Manual Trigger** or **Webhook** node to receive a payment ID.
2. Connect to the **Mercado Pago** node with **Refund > Create**, passing the payment ID.

### Get merchant info

1. Use the **Mercado Pago** node with **Merchant > Get Info** to retrieve your account details (ID, email, site, etc.).
2. Useful for verifying credentials or retrieving merchant metadata.

## License

MIT
