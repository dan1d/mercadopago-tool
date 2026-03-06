import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMercadoPagoExecutor, handleToolCall } from "../src/executor.js";

const TOKEN = "TEST-token-123";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createMercadoPagoExecutor", () => {
  let mockFetch: ReturnType<typeof vi.fn>;
  let execute: ReturnType<typeof createMercadoPagoExecutor>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", mockFetch);
    execute = createMercadoPagoExecutor(TOKEN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("create_payment_preference", () => {
    it("calls POST /checkout/preferences with correct body", async () => {
      const args = {
        title: "Test Product",
        quantity: 1,
        currency: "ARS",
        unit_price: 100,
      };
      await execute("create_payment_preference", args);

      expect(mockFetch).toHaveBeenCalledOnce();
      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.mercadopago.com/checkout/preferences");
      expect(options.method).toBe("POST");
      expect(options.headers["Authorization"]).toBe(`Bearer ${TOKEN}`);
      expect(options.headers["Content-Type"]).toBe("application/json");

      const body = JSON.parse(options.body);
      expect(body.items).toEqual([
        {
          title: "Test Product",
          quantity: 1,
          currency_id: "ARS",
          unit_price: 100,
        },
      ]);
    });

    it("includes back_urls and notification_url when provided", async () => {
      const args = {
        title: "Test",
        quantity: 1,
        currency: "BRL",
        unit_price: 50,
        back_urls: { success: "https://example.com/ok" },
        notification_url: "https://example.com/webhook",
      };
      await execute("create_payment_preference", args);

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.back_urls).toEqual({ success: "https://example.com/ok" });
      expect(body.notification_url).toBe("https://example.com/webhook");
    });
  });

  describe("get_payment", () => {
    it("calls GET /v1/payments/{id}", async () => {
      await execute("get_payment", { payment_id: "12345" });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.mercadopago.com/v1/payments/12345");
      expect(options.method).toBe("GET");
      expect(options.headers["Authorization"]).toBe(`Bearer ${TOKEN}`);
    });

    it("rejects non-numeric payment_id (path traversal prevention)", async () => {
      await expect(
        execute("get_payment", { payment_id: "../users/me" })
      ).rejects.toThrow("payment_id must be numeric");

      await expect(
        execute("get_payment", { payment_id: "12345; DROP TABLE" })
      ).rejects.toThrow("payment_id must be numeric");

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("create_refund", () => {
    it("calls POST /v1/payments/{id}/refunds", async () => {
      await execute("create_refund", { payment_id: "67890" });

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.mercadopago.com/v1/payments/67890/refunds");
      expect(options.method).toBe("POST");
    });

    it("includes amount in body for partial refund", async () => {
      await execute("create_refund", { payment_id: "67890", amount: 50 });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.amount).toBe(50);
    });

    it("rejects non-numeric payment_id", async () => {
      await expect(
        execute("create_refund", { payment_id: "abc" })
      ).rejects.toThrow("payment_id must be numeric");
    });
  });

  describe("search_payments", () => {
    it("calls GET /v1/payments/search with query params", async () => {
      await execute("search_payments", {
        status: "approved",
        limit: 10,
        offset: 5,
      });

      const [url, options] = mockFetch.mock.calls[0];
      const parsedUrl = new URL(url);
      expect(parsedUrl.pathname).toBe("/v1/payments/search");
      expect(parsedUrl.searchParams.get("status")).toBe("approved");
      expect(parsedUrl.searchParams.get("limit")).toBe("10");
      expect(parsedUrl.searchParams.get("offset")).toBe("5");
      expect(options.method).toBe("GET");
    });

    it("calls without query params when none provided", async () => {
      await execute("search_payments", {});

      const [url] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.mercadopago.com/v1/payments/search");
    });
  });

  describe("get_merchant_info", () => {
    it("calls GET /users/me", async () => {
      await execute("get_merchant_info", {});

      const [url, options] = mockFetch.mock.calls[0];
      expect(url).toBe("https://api.mercadopago.com/users/me");
      expect(options.method).toBe("GET");
    });
  });

  describe("error handling", () => {
    it("throws on unknown function name", async () => {
      await expect(
        execute("unknown_function", {})
      ).rejects.toThrow("Unknown function: unknown_function");
    });

    it("throws with status on non-ok API response", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ message: "Unauthorized" }, 401)
      );

      await expect(
        execute("get_merchant_info", {})
      ).rejects.toThrow("API error: 401");
    });
  });
});

describe("handleToolCall", () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue(
      jsonResponse({ id: 123, status: "approved" })
    );
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses JSON arguments and returns stringified result", async () => {
    const executor = createMercadoPagoExecutor(TOKEN);
    const toolCall = {
      function: {
        name: "get_payment",
        arguments: JSON.stringify({ payment_id: "999" }),
      },
    };

    const result = await handleToolCall(executor, toolCall);
    expect(typeof result).toBe("string");
    const parsed = JSON.parse(result);
    expect(parsed.id).toBe(123);
    expect(parsed.status).toBe("approved");
  });
});
