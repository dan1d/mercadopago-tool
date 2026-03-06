export interface BackUrls {
  success?: string;
  failure?: string;
  pending?: string;
}

export interface CreatePaymentPreferenceParams {
  title: string;
  quantity: number;
  currency: string;
  unit_price: number;
  back_urls?: BackUrls;
  notification_url?: string;
}

export interface GetPaymentParams {
  payment_id: string;
}

export interface CreateRefundParams {
  payment_id: string;
  amount?: number;
}

export interface SearchPaymentsParams {
  status?: string;
  sort?: string;
  criteria?: string;
  limit?: number;
  offset?: number;
}

export type GetMerchantInfoParams = Record<string, never>;

export const createPaymentPreferenceSchema = {
  name: "create_payment_preference",
  description: "Creates a Mercado Pago checkout payment preference (payment link). Returns init_point URL for redirecting buyers.",
  parameters: {
    type: "object",
    required: ["title", "quantity", "currency", "unit_price"],
    properties: {
      title: { type: "string", description: "Product or service title" },
      quantity: { type: "number", description: "Quantity of items" },
      currency: { type: "string", description: "Currency ID (e.g. ARS, BRL, MXN, CLP, COP, UYU, PEN)" },
      unit_price: { type: "number", description: "Unit price of the item" },
      back_urls: {
        type: "object",
        description: "URLs to redirect the buyer after payment",
        properties: {
          success: { type: "string", description: "URL on approved payment" },
          failure: { type: "string", description: "URL on rejected payment" },
          pending: { type: "string", description: "URL on pending payment" },
        },
      },
      notification_url: { type: "string", description: "Webhook URL for payment notifications (IPN)" },
    },
  },
} as const;

export const getPaymentSchema = {
  name: "get_payment",
  description: "Retrieve a payment by its ID. Returns full payment details including status, amount, payer info.",
  parameters: {
    type: "object",
    required: ["payment_id"],
    properties: {
      payment_id: { type: "string", description: "The payment ID to look up" },
    },
  },
} as const;

export const createRefundSchema = {
  name: "create_refund",
  description: "Refund a payment fully or partially. Omit amount for full refund.",
  parameters: {
    type: "object",
    required: ["payment_id"],
    properties: {
      payment_id: { type: "string", description: "The payment ID to refund" },
      amount: { type: "number", description: "Partial refund amount. Omit for full refund." },
    },
  },
} as const;

export const searchPaymentsSchema = {
  name: "search_payments",
  description: "Search recent payments for the authenticated merchant. Supports filtering by status.",
  parameters: {
    type: "object",
    properties: {
      status: { type: "string", description: "Filter by status: approved, pending, rejected, refunded, cancelled" },
      sort: { type: "string", description: "Sort field (e.g. date_created)" },
      criteria: { type: "string", description: "Sort order: asc or desc" },
      limit: { type: "number", description: "Max results (default 30, max 100)" },
      offset: { type: "number", description: "Pagination offset" },
    },
  },
} as const;

export const getMerchantInfoSchema = {
  name: "get_merchant_info",
  description: "Retrieve the authenticated merchant's user profile including ID, nickname, and site.",
  parameters: {
    type: "object",
    properties: {},
  },
} as const;

export const allSchemas = [
  createPaymentPreferenceSchema,
  getPaymentSchema,
  createRefundSchema,
  searchPaymentsSchema,
  getMerchantInfoSchema,
];
