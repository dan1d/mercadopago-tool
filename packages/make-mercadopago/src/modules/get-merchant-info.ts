import { MakeClient } from "../api/mercadopago-client.js";

export async function getMerchantInfo(
  client: MakeClient
): Promise<Record<string, unknown>> {
  return client.get<Record<string, unknown>>("/users/me");
}
