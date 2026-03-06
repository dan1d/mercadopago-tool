import { describe, it, expect, vi, beforeEach } from "vitest";
import { MercadoPagoClient } from "../src/client.js";
import { MercadoPagoError } from "../src/errors.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MercadoPagoClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("throws if no access token provided", () => {
    expect(() => new MercadoPagoClient("")).toThrow("MERCADO_PAGO_ACCESS_TOKEN is required");
  });

  it("sends GET with auth header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));
    const client = new MercadoPagoClient("TEST_TOKEN");
    const result = await client.get("/v1/payments/123");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.mercadopago.com/v1/payments/123",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer TEST_TOKEN",
        }),
      })
    );
    expect(result).toEqual({ id: 1 });
  });

  it("sends POST with body and auth header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "pref_1" }));
    const client = new MercadoPagoClient("TEST_TOKEN");
    const result = await client.post("/checkout/preferences", { items: [] });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.mercadopago.com/checkout/preferences",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ items: [] }),
      })
    );
    expect(result).toEqual({ id: "pref_1" });
  });

  it("sends idempotency key header when provided", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: "pref_2" }));
    const client = new MercadoPagoClient("TEST_TOKEN");
    await client.post("/checkout/preferences", {}, { idempotencyKey: "unique-key-123" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-Idempotency-Key": "unique-key-123",
        }),
      })
    );
  });

  it("throws MercadoPagoError on non-OK GET response", async () => {
    mockFetch.mockResolvedValueOnce(new Response("Not Found", { status: 404 }));
    const client = new MercadoPagoClient("TEST_TOKEN");

    try {
      await client.get("/bad");
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(MercadoPagoError);
      const mpErr = err as MercadoPagoError;
      expect(mpErr.status).toBe(404);
      expect(mpErr.method).toBe("GET");
      expect(mpErr.path).toBe("/bad");
      expect(mpErr.isNotFound).toBe(true);
    }
  });

  it("throws MercadoPagoError on non-OK POST response", async () => {
    mockFetch.mockResolvedValueOnce(new Response("Bad Request", { status: 400 }));
    const client = new MercadoPagoClient("TEST_TOKEN");

    try {
      await client.post("/bad", {});
      expect.unreachable("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(MercadoPagoError);
      const mpErr = err as MercadoPagoError;
      expect(mpErr.status).toBe(400);
      expect(mpErr.body).toBe("Bad Request");
    }
  });
});
