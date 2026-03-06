import { MakeClient } from "../api/mercadopago-client.js";
import { verifyWebhookSignature } from "./verify-signature.js";

export interface NormalizedPayment {
  payment_id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  currency_id: string;
  external_reference: string | null;
  date_created: string;
  date_approved: string | null;
  payer_email: string;
  description: string;
  raw: Record<string, unknown>;
}

export interface WebhookHandlerConfig {
  accessToken: string;
  onPayment: (payment: NormalizedPayment) => void | Promise<void>;
  secret?: string;
}

export function createPaymentWebhookHandler(
  config: WebhookHandlerConfig
): (request: Request) => Promise<Response> {
  const client = new MakeClient(config.accessToken);

  return async (request: Request): Promise<Response> => {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.type !== "payment") {
      return new Response(JSON.stringify({ status: "ignored" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = body.data as Record<string, unknown> | undefined;
    if (!data || !data.id) {
      return new Response(JSON.stringify({ error: "Missing data.id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dataId = String(data.id);

    if (!/^\d+$/.test(dataId)) {
      return new Response(JSON.stringify({ error: "Invalid data.id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (config.secret) {
      const xSignature = request.headers.get("x-signature") ?? "";
      const xRequestId = request.headers.get("x-request-id") ?? "";

      if (!verifyWebhookSignature(config.secret, dataId, xSignature, xRequestId)) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    try {
      const payment = await client.get<Record<string, unknown>>(`/v1/payments/${dataId}`);

      const payer = (payment.payer as Record<string, unknown>) ?? {};

      const normalized: NormalizedPayment = {
        payment_id: payment.id as number,
        status: payment.status as string,
        status_detail: payment.status_detail as string,
        transaction_amount: payment.transaction_amount as number,
        currency_id: payment.currency_id as string,
        external_reference: (payment.external_reference as string) ?? null,
        date_created: payment.date_created as string,
        date_approved: (payment.date_approved as string) ?? null,
        payer_email: (payer.email as string) ?? "",
        description: (payment.description as string) ?? "",
        raw: payment,
      };

      await config.onPayment(normalized);

      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Internal error";
      return new Response(JSON.stringify({ error: message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  };
}
