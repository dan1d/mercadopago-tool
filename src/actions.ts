import { MercadoPagoClient } from "./client.js";
import type {
  CreatePaymentPreferenceParams,
  GetPaymentParams,
  CreateRefundParams,
  SearchPaymentsParams,
} from "./schemas.js";

export async function createPaymentPreference(
  client: MercadoPagoClient,
  params: CreatePaymentPreferenceParams
): Promise<unknown> {
  if (!params.title || typeof params.title !== "string") {
    throw new Error("title is required and must be a string");
  }
  if (typeof params.quantity !== "number" || params.quantity < 1) {
    throw new Error("quantity must be a positive number");
  }
  if (!params.currency || typeof params.currency !== "string") {
    throw new Error("currency is required and must be a string");
  }
  if (typeof params.unit_price !== "number" || params.unit_price <= 0) {
    throw new Error("unit_price must be a positive number");
  }

  const payload: Record<string, unknown> = {
    items: [
      {
        title: params.title,
        quantity: params.quantity,
        currency_id: params.currency,
        unit_price: params.unit_price,
      },
    ],
  };

  if (params.back_urls) {
    payload.back_urls = params.back_urls;
    payload.auto_return = "approved";
  }

  if (params.notification_url) {
    payload.notification_url = params.notification_url;
  }

  return client.post("/checkout/preferences", payload);
}

export async function getPayment(
  client: MercadoPagoClient,
  params: GetPaymentParams
): Promise<unknown> {
  if (!params.payment_id || typeof params.payment_id !== "string") {
    throw new Error("payment_id is required and must be a string");
  }
  return client.get(`/v1/payments/${encodeURIComponent(params.payment_id)}`);
}

export async function createRefund(
  client: MercadoPagoClient,
  params: CreateRefundParams
): Promise<unknown> {
  if (!params.payment_id || typeof params.payment_id !== "string") {
    throw new Error("payment_id is required and must be a string");
  }
  if (params.amount !== undefined && (typeof params.amount !== "number" || params.amount <= 0)) {
    throw new Error("amount must be a positive number when provided");
  }

  const body = params.amount !== undefined ? { amount: params.amount } : {};
  return client.post(
    `/v1/payments/${encodeURIComponent(params.payment_id)}/refunds`,
    body
  );
}

export async function searchPayments(
  client: MercadoPagoClient,
  params?: SearchPaymentsParams
): Promise<unknown> {
  const safeLimit = Math.min(params?.limit ?? 30, 100);
  const query = new URLSearchParams();
  if (params?.status) query.set("status", params.status);
  if (params?.sort) query.set("sort", params.sort);
  if (params?.criteria) query.set("criteria", params.criteria);
  if (params?.limit) query.set("limit", String(safeLimit));
  if (params?.offset) query.set("offset", String(params.offset));

  const qs = query.toString();
  return client.get(`/v1/payments/search${qs ? `?${qs}` : ""}`);
}

export async function getMerchantInfo(client: MercadoPagoClient): Promise<unknown> {
  return client.get("/users/me");
}
