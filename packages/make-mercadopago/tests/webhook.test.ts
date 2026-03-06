import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { createPaymentWebhookHandler } from "../src/webhooks/payment-updated.js";
import { verifyWebhookSignature } from "../src/webhooks/verify-signature.js";

function mockFetch(response: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function makeRequest(body: unknown, method = "POST", headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/webhook", {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: method === "POST" ? JSON.stringify(body) : undefined,
  });
}

function generateSignature(secret: string, dataId: string, requestId: string, ts: string): string {
  const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const hmac = createHmac("sha256", secret);
  hmac.update(template);
  return `ts=${ts},v1=${hmac.digest("hex")}`;
}

const MOCK_PAYMENT = {
  id: 12345,
  status: "approved",
  status_detail: "accredited",
  transaction_amount: 100.0,
  currency_id: "ARS",
  external_reference: "order-001",
  date_created: "2024-01-15T10:00:00.000-04:00",
  date_approved: "2024-01-15T10:01:00.000-04:00",
  payer: { email: "buyer@example.com" },
  description: "Test product",
};

describe("verifyWebhookSignature", () => {
  const SECRET = "my_webhook_secret";

  it("should return true for a valid signature", () => {
    const dataId = "12345";
    const requestId = "req-abc-123";
    const ts = "1705312800";
    const signature = generateSignature(SECRET, dataId, requestId, ts);

    expect(verifyWebhookSignature(SECRET, dataId, signature, requestId)).toBe(true);
  });

  it("should return false for an invalid signature", () => {
    const result = verifyWebhookSignature(
      SECRET,
      "12345",
      "ts=123,v1=0000000000000000000000000000000000000000000000000000000000000000",
      "req-abc"
    );
    expect(result).toBe(false);
  });

  it("should return false if x-signature is missing ts or v1", () => {
    expect(verifyWebhookSignature(SECRET, "12345", "ts=123", "req")).toBe(false);
    expect(verifyWebhookSignature(SECRET, "12345", "v1=abc", "req")).toBe(false);
  });
});

describe("createPaymentWebhookHandler", () => {
  let onPayment: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    onPayment = vi.fn();
  });

  it("should reject non-POST requests", async () => {
    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment,
    });

    const req = new Request("https://example.com/webhook", { method: "GET" });
    const res = await handler(req);

    expect(res.status).toBe(405);
  });

  it("should ignore non-payment event types", async () => {
    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment,
    });

    const req = makeRequest({ type: "plan", data: { id: "1" } });
    const res = await handler(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ignored");
    expect(onPayment).not.toHaveBeenCalled();
  });

  it("should reject path traversal in data.id", async () => {
    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment,
    });

    const req = makeRequest({ type: "payment", data: { id: "../../../etc/passwd" } });
    const res = await handler(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid data.id");
  });

  it("should process a valid payment and call onPayment with normalized data", async () => {
    mockFetch(MOCK_PAYMENT);

    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment,
    });

    const req = makeRequest({ type: "payment", data: { id: "12345" } });
    const res = await handler(req);

    expect(res.status).toBe(200);
    expect(onPayment).toHaveBeenCalledOnce();

    const normalized = onPayment.mock.calls[0][0];
    expect(normalized.payment_id).toBe(12345);
    expect(normalized.status).toBe("approved");
    expect(normalized.status_detail).toBe("accredited");
    expect(normalized.transaction_amount).toBe(100.0);
    expect(normalized.currency_id).toBe("ARS");
    expect(normalized.external_reference).toBe("order-001");
    expect(normalized.payer_email).toBe("buyer@example.com");
    expect(normalized.description).toBe("Test product");
    expect(normalized.raw).toBeDefined();
  });

  it("should validate signature when secret is provided", async () => {
    mockFetch(MOCK_PAYMENT);
    const secret = "webhook_secret_key";

    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment,
      secret,
    });

    const dataId = "12345";
    const requestId = "req-xyz";
    const ts = "1705312800";
    const signature = generateSignature(secret, dataId, requestId, ts);

    const req = makeRequest(
      { type: "payment", data: { id: dataId } },
      "POST",
      {
        "x-signature": signature,
        "x-request-id": requestId,
      }
    );

    const res = await handler(req);
    expect(res.status).toBe(200);
    expect(onPayment).toHaveBeenCalledOnce();
  });

  it("should reject invalid signature when secret is provided", async () => {
    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment,
      secret: "my_secret",
    });

    const req = makeRequest(
      { type: "payment", data: { id: "12345" } },
      "POST",
      {
        "x-signature": "ts=123,v1=invalidhash000000000000000000000000000000000000000000000000",
        "x-request-id": "req-1",
      }
    );

    const res = await handler(req);
    expect(res.status).toBe(401);
    expect(onPayment).not.toHaveBeenCalled();
  });

  it("should return normalized output structure", async () => {
    mockFetch(MOCK_PAYMENT);

    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment,
    });

    const req = makeRequest({ type: "payment", data: { id: "12345" } });
    await handler(req);

    const normalized = onPayment.mock.calls[0][0];
    const expectedKeys = [
      "payment_id",
      "status",
      "status_detail",
      "transaction_amount",
      "currency_id",
      "external_reference",
      "date_created",
      "date_approved",
      "payer_email",
      "description",
      "raw",
    ];
    for (const key of expectedKeys) {
      expect(normalized).toHaveProperty(key);
    }
  });

  it("should return 400 for invalid JSON body", async () => {
    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment,
    });

    const req = new Request("https://example.com/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    });
    const res = await handler(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON");
  });

  it("should return 500 when fetching payment from API fails", async () => {
    mockFetch({ message: "not_found" }, 404);

    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment,
    });

    const req = makeRequest({ type: "payment", data: { id: "99999" } });
    const res = await handler(req);

    expect(res.status).toBe(500);
    expect(onPayment).not.toHaveBeenCalled();
  });

  it("should return 500 when onPayment callback throws", async () => {
    mockFetch(MOCK_PAYMENT);
    const failingCallback = vi.fn().mockRejectedValue(new Error("callback failed"));

    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment: failingCallback,
    });

    const req = makeRequest({ type: "payment", data: { id: "12345" } });
    const res = await handler(req);

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("callback failed");
  });

  it("should handle missing data.id gracefully", async () => {
    const handler = createPaymentWebhookHandler({
      accessToken: "tok",
      onPayment,
    });

    const req = makeRequest({ type: "payment", data: {} });
    const res = await handler(req);

    expect(res.status).toBe(400);
    expect(onPayment).not.toHaveBeenCalled();
  });
});
