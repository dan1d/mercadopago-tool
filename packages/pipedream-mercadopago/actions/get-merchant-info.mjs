import mercadopago from "../common/mercadopago.app.mjs";

export default {
  key: "mercadopago-get-merchant-info",
  name: "Get Merchant Info",
  description: "Retrieves the authenticated Mercado Pago merchant/user account information",
  version: "0.0.1",
  type: "action",
  props: {
    mercadopago,
  },
  async run({ $ }) {
    const result = await this.mercadopago.getMerchantInfo({
      $,
    });

    $.export("$summary", `Merchant info retrieved for ${result.nickname || result.email} (ID: ${result.id})`);
    return result;
  },
};
