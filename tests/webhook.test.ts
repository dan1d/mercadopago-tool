import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { createWebhookHandler } from "../src/webhook.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function makeRequest(body: unknown, headers?: Record<string, string>): Request {
  return new Request("https://example.com/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

function makeSignature(secret: string, dataId: string, requestId: string): { xSignature: string; xRequestId: string } {
  const ts = String(Date.now());
  const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hash = createHmac("sha256", secret).update(template).digest("hex");
  return {
    xSignature: `ts=${ts},v1=${hash}`,
    xRequestId: requestId,
  };
}

describe("createWebhookHandler", () => {
  const onPayment = vi.fn();
  const accessToken = "TEST_TOKEN";

  beforeEach(() => {
    mockFetch.mockReset();
    onPayment.mockReset();
  });

  // ─── Valid payment notification flow ──────────────────────────

  describe("valid payment notification", () => {
    it("fetches full payment and calls onPayment callback", async () => {
      const fullPayment = { id: 123, status: "approved", amount: 1000 };
      mockFetch.mockResolvedValueOnce(jsonResponse(fullPayment));

      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "payment", data: { id: "123" } });
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/v1/payments/123",
        expect.objectContaining({ method: "GET" })
      );
      expect(onPayment).toHaveBeenCalledWith(fullPayment);
    });

    it("calls onPayment with the full payment data from API", async () => {
      const fullPayment = {
        id: 456,
        status: "pending",
        transaction_amount: 2500,
        payer: { email: "test@example.com" },
      };
      mockFetch.mockResolvedValueOnce(jsonResponse(fullPayment));

      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "payment", data: { id: "456" } });
      await handler(req);

      expect(onPayment).toHaveBeenCalledOnce();
      expect(onPayment).toHaveBeenCalledWith(fullPayment);
    });
  });

  // ─── Signature validation ─────────────────────────────────────

  describe("signature validation", () => {
    const secret = "my-webhook-secret";

    it("accepts valid signature", async () => {
      const fullPayment = { id: 789, status: "approved" };
      mockFetch.mockResolvedValueOnce(jsonResponse(fullPayment));

      const { xSignature, xRequestId } = makeSignature(secret, "789", "req-abc-123");
      const handler = createWebhookHandler({ accessToken, onPayment, secret });
      const req = makeRequest(
        { type: "payment", data: { id: "789" } },
        { "x-signature": xSignature, "x-request-id": xRequestId }
      );
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(onPayment).toHaveBeenCalledWith(fullPayment);
    });

    it("rejects invalid signature", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment, secret });
      const req = makeRequest(
        { type: "payment", data: { id: "789" } },
        { "x-signature": "ts=123456,v1=invalidsignaturehash", "x-request-id": "req-abc-123" }
      );
      const res = await handler(req);

      expect(res.status).toBe(401);
      expect(onPayment).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("rejects missing signature header when secret is configured", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment, secret });
      const req = makeRequest({ type: "payment", data: { id: "789" } });
      const res = await handler(req);

      expect(res.status).toBe(401);
      expect(onPayment).not.toHaveBeenCalled();
    });

    it("rejects malformed signature header", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment, secret });
      const req = makeRequest(
        { type: "payment", data: { id: "789" } },
        { "x-signature": "garbage", "x-request-id": "req-1" }
      );
      const res = await handler(req);

      expect(res.status).toBe(401);
    });

    it("skips signature validation when no secret is configured", async () => {
      const fullPayment = { id: 789, status: "approved" };
      mockFetch.mockResolvedValueOnce(jsonResponse(fullPayment));

      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "payment", data: { id: "789" } });
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(onPayment).toHaveBeenCalled();
    });
  });

  // ─── Non-payment notification types ───────────────────────────

  describe("non-payment notifications", () => {
    it("ignores merchant_order notifications with 200", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "merchant_order", data: { id: "999" } });
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(onPayment).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("ignores unknown notification types with 200", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "chargebacks", data: { id: "111" } });
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(onPayment).not.toHaveBeenCalled();
    });

    it("ignores notifications with no type with 200", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ data: { id: "222" } });
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(onPayment).not.toHaveBeenCalled();
    });
  });

  // ─── Malformed body ───────────────────────────────────────────

  describe("malformed body", () => {
    it("returns 400 for invalid JSON", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = new Request("https://example.com/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json{{{",
      });
      const res = await handler(req);

      expect(res.status).toBe(400);
      expect(onPayment).not.toHaveBeenCalled();
    });

    it("returns 400 for payment type with missing data.id", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "payment", data: {} });
      const res = await handler(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 for payment type with no data object", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "payment" });
      const res = await handler(req);

      expect(res.status).toBe(400);
    });

    it("returns 400 for path traversal attempt in data.id", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "payment", data: { id: "../../users/me" } });
      const res = await handler(req);

      expect(res.status).toBe(400);
      expect(await res.text()).toContain("invalid payment ID format");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("returns 400 for non-numeric data.id", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "payment", data: { id: "abc" } });
      const res = await handler(req);

      expect(res.status).toBe(400);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ─── onPayment callback errors ────────────────────────────────

  describe("onPayment callback errors", () => {
    it("returns 500 when onPayment throws", async () => {
      const fullPayment = { id: 123, status: "approved" };
      mockFetch.mockResolvedValueOnce(jsonResponse(fullPayment));
      onPayment.mockRejectedValueOnce(new Error("Database connection failed"));

      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "payment", data: { id: "123" } });
      const res = await handler(req);

      expect(res.status).toBe(500);
    });

    it("returns 500 when payment fetch fails", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("Not Found", { status: 404 })
      );

      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = makeRequest({ type: "payment", data: { id: "999" } });
      const res = await handler(req);

      expect(res.status).toBe(500);
      expect(onPayment).not.toHaveBeenCalled();
    });
  });

  // ─── Method handling ──────────────────────────────────────────

  describe("method handling", () => {
    it("returns 405 for GET requests", async () => {
      const handler = createWebhookHandler({ accessToken, onPayment });
      const req = new Request("https://example.com/webhook", { method: "GET" });
      const res = await handler(req);

      expect(res.status).toBe(405);
    });
  });
});
