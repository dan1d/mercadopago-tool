import { MakeClient } from "../api/mercadopago-client.js";
import { buildRefundPayload } from "../api/requests.js";

export async function createRefund(
  client: MakeClient,
  paymentId: string | number,
  amount?: number
): Promise<Record<string, unknown>> {
  if (!paymentId) {
    throw new Error("paymentId is required");
  }

  const id = String(paymentId);

  if (!/^\d+$/.test(id)) {
    throw new Error("paymentId must be numeric");
  }

  const body = buildRefundPayload(amount);

  return client.post<Record<string, unknown>>(`/v1/payments/${id}/refunds`, body);
}
