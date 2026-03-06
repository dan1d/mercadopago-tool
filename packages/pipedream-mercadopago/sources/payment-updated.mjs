import mercadopago from "../common/mercadopago.app.mjs";

export default {
  key: "mercadopago-payment-updated",
  name: "Payment Updated",
  description: "Triggers when a payment is created or updated in Mercado Pago",
  version: "0.0.1",
  type: "source",
  dedupe: "unique",
  props: {
    mercadopago,
    db: "$.service.db",
    timer: {
      type: "$.interface.timer",
      default: {
        intervalSeconds: 60,
      },
    },
  },
  methods: {
    _getLastTimestamp() {
      return this.db.get("lastTimestamp") || "2000-01-01T00:00:00.000Z";
    },
    _setLastTimestamp(ts) {
      this.db.set("lastTimestamp", ts);
    },
    _generateDedupeId(payment) {
      return `${payment.id}-${payment.date_last_updated}`;
    },
  },
  async run() {
    const lastTimestamp = this._getLastTimestamp();
    let maxTimestamp = lastTimestamp;
    let offset = 0;
    const limit = 50;
    let hasMore = true;

    while (hasMore) {
      const response = await this.mercadopago.searchPayments({
        params: {
          sort: "date_last_updated",
          criteria: "desc",
          "begin_date": lastTimestamp,
          "end_date": new Date().toISOString(),
          offset,
          limit,
        },
      });

      const payments = response.results || [];

      if (payments.length === 0) {
        hasMore = false;
        break;
      }

      for (const payment of payments) {
        const paymentTimestamp = payment.date_last_updated || payment.date_created;

        if (paymentTimestamp > maxTimestamp) {
          maxTimestamp = paymentTimestamp;
        }

        this.$emit(payment, {
          id: this._generateDedupeId(payment),
          summary: `Payment ${payment.id} — ${payment.status} — ${payment.transaction_amount} ${payment.currency_id}`,
          ts: new Date(paymentTimestamp).getTime(),
        });
      }

      if (payments.length < limit) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }

    if (maxTimestamp !== lastTimestamp) {
      this._setLastTimestamp(maxTimestamp);
    }
  },
};
