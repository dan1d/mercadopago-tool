import { MakeClient } from "../api/mercadopago-client.js";
import { buildPreferencePayload, PreferenceParams } from "../api/requests.js";

export interface CreatePreferenceResult {
  preference_id: string;
  init_point: string;
  sandbox_init_point: string;
  raw: Record<string, unknown>;
}

export async function createPaymentPreference(
  client: MakeClient,
  params: PreferenceParams
): Promise<CreatePreferenceResult> {
  if (!params.title || typeof params.title !== "string") {
    throw new Error("title is required and must be a string");
  }
  if (params.quantity === undefined || typeof params.quantity !== "number" || params.quantity < 1) {
    throw new Error("quantity is required and must be a positive number");
  }
  if (!params.currency || typeof params.currency !== "string") {
    throw new Error("currency is required and must be a string");
  }
  if (params.unitPrice === undefined || typeof params.unitPrice !== "number" || params.unitPrice <= 0) {
    throw new Error("unitPrice is required and must be a positive number");
  }

  const payload = buildPreferencePayload(params);
  const response = await client.post<Record<string, unknown>>("/checkout/preferences", payload);

  return {
    preference_id: response.id as string,
    init_point: response.init_point as string,
    sandbox_init_point: response.sandbox_init_point as string,
    raw: response,
  };
}
