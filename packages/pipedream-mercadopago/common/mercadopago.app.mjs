import { axios } from "@pipedream/platform";

export default {
  type: "app",
  app: "mercadopago",
  propDefinitions: {
    paymentId: {
      type: "string",
      label: "Payment ID",
      description: "The Mercado Pago payment ID",
    },
    refundAmount: {
      type: "string",
      label: "Refund Amount",
      description: "Amount to refund. Leave empty for a full refund.",
      optional: true,
    },
    externalReference: {
      type: "string",
      label: "External Reference",
      description: "An external reference to identify the payment (e.g. your order ID)",
      optional: true,
    },
    notificationUrl: {
      type: "string",
      label: "Notification URL",
      description: "URL where Mercado Pago will send webhook notifications (IPN)",
      optional: true,
    },
  },
  methods: {
    _baseUrl() {
      return "https://api.mercadopago.com";
    },
    _headers() {
      return {
        "Authorization": `Bearer ${this.$auth.access_token}`,
        "Content-Type": "application/json",
      };
    },
    async _makeRequest(opts = {}) {
      const {
        $ = this,
        path,
        method = "GET",
        data,
        params,
        ...otherOpts
      } = opts;

      return axios($, {
        url: `${this._baseUrl()}${path}`,
        method,
        headers: this._headers(),
        data,
        params,
        ...otherOpts,
      });
    },
    async createPreference(opts = {}) {
      const {
        $,
        ...data
      } = opts;

      return this._makeRequest({
        $,
        path: "/checkout/preferences",
        method: "POST",
        data,
      });
    },
    async getPayment({
      $, paymentId,
    }) {
      if (!/^\d+$/.test(paymentId)) {
        throw new Error(`Invalid payment ID: ${paymentId}. Must be numeric.`);
      }
      return this._makeRequest({
        $,
        path: `/v1/payments/${paymentId}`,
      });
    },
    async searchPayments({
      $, params,
    }) {
      return this._makeRequest({
        $,
        path: "/v1/payments/search",
        params,
      });
    },
    async createRefund({
      $, paymentId, amount,
    }) {
      if (!/^\d+$/.test(paymentId)) {
        throw new Error(`Invalid payment ID: ${paymentId}. Must be numeric.`);
      }
      const data = {};
      if (amount) {
        data.amount = parseFloat(amount);
      }
      return this._makeRequest({
        $,
        path: `/v1/payments/${paymentId}/refunds`,
        method: "POST",
        data,
      });
    },
    async getMerchantInfo({ $ } = {}) {
      return this._makeRequest({
        $,
        path: "/users/me",
      });
    },
  },
};
