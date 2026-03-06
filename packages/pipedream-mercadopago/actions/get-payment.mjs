import mercadopago from "../common/mercadopago.app.mjs";

export default {
  key: "mercadopago-get-payment",
  name: "Get Payment",
  description: "Retrieves the details of a Mercado Pago payment by its ID",
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
  },
  async run({ $ }) {
    const result = await this.mercadopago.getPayment({
      $,
      paymentId: this.paymentId,
    });

    $.export("$summary", `Payment ${result.id} retrieved — status: ${result.status}`);
    return result;
  },
};
