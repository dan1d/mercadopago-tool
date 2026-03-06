import mercadopago from "../common/mercadopago.app.mjs";

export default {
  key: "mercadopago-create-payment-preference",
  name: "Create Payment Preference",
  description: "Creates a Mercado Pago checkout payment preference (payment link)",
  version: "0.0.1",
  type: "action",
  props: {
    mercadopago,
    title: {
      type: "string",
      label: "Title",
      description: "Product or service title",
    },
    quantity: {
      type: "integer",
      label: "Quantity",
      description: "Number of units",
      default: 1,
    },
    currency: {
      type: "string",
      label: "Currency",
      description: "Currency code: ARS, BRL, MXN, CLP, COP, UYU, PEN",
      default: "ARS",
      options: [
        "ARS",
        "BRL",
        "MXN",
        "CLP",
        "COP",
        "UYU",
        "PEN",
      ],
    },
    unitPrice: {
      type: "string",
      label: "Unit Price",
      description: "Price per unit (e.g. 100.50)",
    },
    description: {
      type: "string",
      label: "Description",
      description: "Product or service description",
      optional: true,
    },
    externalReference: {
      propDefinition: [
        mercadopago,
        "externalReference",
      ],
    },
    notificationUrl: {
      propDefinition: [
        mercadopago,
        "notificationUrl",
      ],
    },
    backUrlSuccess: {
      type: "string",
      label: "Success URL",
      description: "URL to redirect after successful payment",
      optional: true,
    },
    backUrlFailure: {
      type: "string",
      label: "Failure URL",
      description: "URL to redirect after failed payment",
      optional: true,
    },
    backUrlPending: {
      type: "string",
      label: "Pending URL",
      description: "URL to redirect when payment is pending",
      optional: true,
    },
  },
  async run({ $ }) {
    const item = {
      title: this.title,
      quantity: this.quantity,
      currency_id: this.currency,
      unit_price: parseFloat(this.unitPrice),
    };

    if (this.description) {
      item.description = this.description;
    }

    const payload = {
      items: [
        item,
      ],
    };

    if (this.externalReference) {
      payload.external_reference = this.externalReference;
    }

    if (this.notificationUrl) {
      payload.notification_url = this.notificationUrl;
    }

    const hasBackUrls = this.backUrlSuccess || this.backUrlFailure || this.backUrlPending;
    if (hasBackUrls) {
      payload.back_urls = {};
      if (this.backUrlSuccess) {
        payload.back_urls.success = this.backUrlSuccess;
      }
      if (this.backUrlFailure) {
        payload.back_urls.failure = this.backUrlFailure;
      }
      if (this.backUrlPending) {
        payload.back_urls.pending = this.backUrlPending;
      }
    }

    const result = await this.mercadopago.createPreference({
      $,
      ...payload,
    });

    $.export("$summary", `Payment preference created: ${result.id}`);
    return result;
  },
};
