# n8n-nodes-mercadopago

This is an [n8n](https://n8n.io/) community node for [Mercado Pago](https://www.mercadopago.com/), the leading payment platform in Latin America. Part of the [CobroYa](https://cobroya.app) project.

It allows you to create checkout preferences, manage payments, issue refunds, and retrieve merchant account information directly from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

### Community Nodes (recommended)

1. Open your n8n instance.
2. Go to **Settings > Community Nodes**.
3. Click **Install a community node**.
4. Enter `n8n-nodes-mercadopago` and click **Install**.

### Manual Installation

```bash
cd ~/.n8n/nodes
npm install n8n-nodes-mercadopago
```

Then restart your n8n instance.

## Credentials

You need a Mercado Pago Access Token to use this node.

1. Log in to [Mercado Pago Developers](https://www.mercadopago.com/developers/panel/app).
2. Select or create an application.
3. Navigate to **Production credentials** (or **Test credentials** for sandbox).
4. Copy the **Access Token**.
5. In n8n, create a new **Mercado Pago API** credential and paste the access token.

The credential is validated automatically by calling the `/users/me` endpoint when you test the connection.

## Operations

This node covers 5 Mercado Pago operations across 4 resources:

### Payment Preference

| Operation | Description |
|-----------|-------------|
| **Create** | Create a checkout preference with items, back URLs, notification URL, external reference, expiration, and auto-return settings. Returns `init_point` (payment link) and `sandbox_init_point`. |

### Payment

| Operation | Description |
|-----------|-------------|
| **Get** | Retrieve a payment by its ID. Returns full payment details including status, amounts, payer info, and metadata. |
| **Search** | Search payments with filters: status, sort field, sort direction, limit, offset, and external reference. |

### Refund

| Operation | Description |
|-----------|-------------|
| **Create** | Create a full or partial refund for a payment. Specify the payment ID and optionally a partial amount. |

### Merchant

| Operation | Description |
|-----------|-------------|
| **Get Info** | Retrieve authenticated merchant account information (ID, email, site ID, etc.). |

## Supported Currencies

ARS, BRL, CLP, COP, MXN, PEN, UYU, USD

## Example Workflows

### Create a payment link and send it by email

1. Use the **Mercado Pago** node with **Payment Preference > Create** to generate a checkout preference.
2. Connect the output to a **Send Email** node, using the `init_point` field from the response as the payment link.

### Search payments and save to Google Sheets

1. Use the **Mercado Pago** node with **Payment > Search**, filtering by status `approved`.
2. Connect to a **Google Sheets** node to append each payment record to a spreadsheet.

### Refund a payment from a webhook

1. Use a **Webhook** node to receive a payment ID.
2. Connect to the **Mercado Pago** node with **Refund > Create**, passing the payment ID.

### Verify credentials

1. Use the **Mercado Pago** node with **Merchant > Get Info** to retrieve your account details.
2. Useful for verifying credentials or retrieving merchant metadata at the start of a workflow.

## Compatibility

- n8n version 1.0.0 or later
- Node.js 18 or later

## Resources

- [Mercado Pago API Docs](https://www.mercadopago.com.br/developers/en/docs)
- [n8n Community Nodes Docs](https://docs.n8n.io/integrations/community-nodes/)
- [CobroYa Homepage](https://cobroya.app)
- [GitHub Repository](https://github.com/dan1d/mercadopago-tool)

## License

[MIT](https://opensource.org/licenses/MIT)
