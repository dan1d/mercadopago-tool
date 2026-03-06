import { MakeClient } from "../api/mercadopago-client.js";

export async function getPayment(
  client: MakeClient,
  paymentId: string | number
): Promise<Record<string, unknown>> {
  if (!paymentId) {
    throw new Error("paymentId is required");
  }

  const id = String(paymentId);

  if (!/^\d+$/.test(id)) {
    throw new Error("paymentId must be numeric");
  }

  return client.get<Record<string, unknown>>(`/v1/payments/${id}`);
}
