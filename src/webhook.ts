import { createHmac, timingSafeEqual } from "node:crypto";
import { MercadoPagoClient } from "./client.js";

export interface WebhookConfig {
  accessToken: string;
  onPayment: (payment: unknown) => void | Promise<void>;
  secret?: string;
}

interface WebhookBody {
  type?: string;
  data?: { id?: string };
}

function validateSignature(
  secret: string,
  dataId: string,
  xSignature: string,
  xRequestId: string
): boolean {
  const parts = xSignature.split(",");
  let ts = "";
  let hash = "";

  for (const part of parts) {
    const [key, value] = part.trim().split("=", 2);
    if (key === "ts") {
      ts = value;
    } else if (key === "v1") {
      hash = value;
    }
  }

  if (!ts || !hash) {
    return false;
  }

  const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(template).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

export function createWebhookHandler(config: WebhookConfig) {
  const client = new MercadoPagoClient(config.accessToken);

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    let body: WebhookBody;
    try {
      body = (await request.json()) as WebhookBody;
    } catch {
      return new Response("Bad request: invalid JSON", { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return new Response("Bad request: expected JSON object", { status: 400 });
    }

    // Non-payment notification types are acknowledged but ignored
    if (body.type !== "payment") {
      return new Response("OK", { status: 200 });
    }

    const dataId = body.data?.id;
    if (!dataId || typeof dataId !== "string") {
      return new Response("Bad request: missing data.id", { status: 400 });
    }

    // Validate signature if secret is configured
    if (config.secret) {
      const xSignature = request.headers.get("x-signature") ?? "";
      const xRequestId = request.headers.get("x-request-id") ?? "";

      if (!xSignature || !validateSignature(config.secret, dataId, xSignature, xRequestId)) {
        return new Response("Invalid signature", { status: 401 });
      }
    }

    try {
      if (!/^\d+$/.test(dataId)) {
        return new Response("Bad request: invalid payment ID format", { status: 400 });
      }
      const payment = await client.get(`/v1/payments/${dataId}`);
      await config.onPayment(payment);
      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[webhook] Error processing payment:", error);
      return new Response("Internal server error", { status: 500 });
    }
  };
}
