import { MercadoPagoClient } from "./client.js";
import {
  createPaymentPreference,
  getPayment,
  createRefund,
  searchPayments,
  getMerchantInfo,
} from "./actions.js";
import { allSchemas } from "./schemas.js";
import type {
  CreatePaymentPreferenceParams,
  GetPaymentParams,
  CreateRefundParams,
  SearchPaymentsParams,
} from "./schemas.js";

export function createMercadoPagoTools(accessToken: string) {
  const client = new MercadoPagoClient(accessToken);

  return {
    schemas: allSchemas,

    tools: {
      create_payment_preference: (params: CreatePaymentPreferenceParams) =>
        createPaymentPreference(client, params),

      get_payment: (params: GetPaymentParams) =>
        getPayment(client, params),

      create_refund: (params: CreateRefundParams) =>
        createRefund(client, params),

      search_payments: (params?: SearchPaymentsParams) =>
        searchPayments(client, params),

      get_merchant_info: () =>
        getMerchantInfo(client),
    },
  };
}

export { MercadoPagoClient } from "./client.js";
export type { ClientOptions } from "./client.js";
export { MercadoPagoError } from "./errors.js";
export {
  createPaymentPreference,
  getPayment,
  createRefund,
  searchPayments,
  getMerchantInfo,
} from "./actions.js";
export { allSchemas } from "./schemas.js";
export type {
  CreatePaymentPreferenceParams,
  GetPaymentParams,
  CreateRefundParams,
  SearchPaymentsParams,
  BackUrls,
} from "./schemas.js";
export { createWebhookHandler } from "./webhook.js";
export type { WebhookConfig } from "./webhook.js";
export { createWhatsAppWebhookHandler, WhatsAppClient, createCommandHandlers, createPaymentNotifier, parseMessage, extractMessages } from "./whatsapp/webhook.js";
export type { WhatsAppWebhookConfig, WhatsAppClientConfig, HandlersConfig, ParsedCommand, IncomingWhatsAppMessage, CommandName } from "./whatsapp/webhook.js";
