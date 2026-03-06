import mercadopago from "../common/mercadopago.app.mjs";

export default {
  key: "mercadopago-create-refund",
  name: "Create Refund",
  description: "Creates a full or partial refund for a Mercado Pago payment",
  version: "0.0.1",
  type: "action",
  props: {
    mercadopago,
    paymentId: {
      propDefinition: [
        mercadopago,
        "paymentId",
      ],
    },
    amount: {
      propDefinition: [
        mercadopago,
        "refundAmount",
      ],
    },
  },
  async run({ $ }) {
    const result = await this.mercadopago.createRefund({
      $,
      paymentId: this.paymentId,
      amount: this.amount,
    });

    const refundType = this.amount
      ? `partial (${this.amount})`
      : "full";
    $.export("$summary", `Refund created (${refundType}) for payment ${this.paymentId} — refund ID: ${result.id}`);
    return result;
  },
};
