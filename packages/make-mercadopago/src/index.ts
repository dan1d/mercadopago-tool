// API client
export { MakeClient, MercadoPagoApiError } from "./api/mercadopago-client.js";

// Request builders
export {
  buildPreferencePayload,
  buildSearchQuery,
  buildRefundPayload,
} from "./api/requests.js";
export type { PreferenceParams, SearchParams } from "./api/requests.js";

// Modules
export { createPaymentPreference } from "./modules/create-payment-preference.js";
export type { CreatePreferenceResult } from "./modules/create-payment-preference.js";

export { getPayment } from "./modules/get-payment.js";

export { searchPayments } from "./modules/search-payments.js";
export type { SearchPaymentsResult } from "./modules/search-payments.js";

export { createRefund } from "./modules/create-refund.js";

export { getMerchantInfo } from "./modules/get-merchant-info.js";

// Webhooks
export { verifyWebhookSignature } from "./webhooks/verify-signature.js";
export { createPaymentWebhookHandler } from "./webhooks/payment-updated.js";
export type { NormalizedPayment, WebhookHandlerConfig } from "./webhooks/payment-updated.js";
