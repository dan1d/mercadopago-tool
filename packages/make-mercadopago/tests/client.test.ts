import { describe, it, expect, vi, beforeEach } from "vitest";
import { MakeClient, MercadoPagoApiError } from "../src/api/mercadopago-client.js";

function mockFetch(response: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("MakeClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw if accessToken is empty", () => {
    expect(() => new MakeClient("")).toThrow("accessToken is required");
  });

  it("should send Bearer auth header on GET", async () => {
    const fetchMock = mockFetch({ id: 1 });
    const client = new MakeClient("TEST_TOKEN_123");

    await client.get("/v1/payments/1");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mercadopago.com/v1/payments/1",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer TEST_TOKEN_123",
        }),
      })
    );
  });

  it("should send Bearer auth header on POST", async () => {
    const fetchMock = mockFetch({ id: "pref_1" });
    const client = new MakeClient("MY_TOKEN");

    await client.post("/checkout/preferences", { items: [] });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mercadopago.com/checkout/preferences",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer MY_TOKEN",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ items: [] }),
      })
    );
  });

  it("should return parsed JSON on successful GET", async () => {
    mockFetch({ id: 42, status: "approved" });
    const client = new MakeClient("tok");

    const result = await client.get("/v1/payments/42");

    expect(result).toEqual({ id: 42, status: "approved" });
  });

  it("should return parsed JSON on successful POST", async () => {
    mockFetch({ id: "pref_abc", init_point: "https://mp.com/pay" });
    const client = new MakeClient("tok");

    const result = await client.post("/checkout/preferences", {});

    expect(result).toEqual({ id: "pref_abc", init_point: "https://mp.com/pay" });
  });

  it("should throw MercadoPagoApiError on GET failure", async () => {
    mockFetch({ message: "not found" }, 404);
    const client = new MakeClient("tok");

    await expect(client.get("/v1/payments/999")).rejects.toThrow(MercadoPagoApiError);

    try {
      await client.get("/v1/payments/999");
    } catch (err) {
      const apiErr = err as MercadoPagoApiError;
      expect(apiErr.status).toBe(404);
      expect(apiErr.method).toBe("GET");
      expect(apiErr.path).toBe("/v1/payments/999");
      expect(apiErr.responseBody).toEqual({ message: "not found" });
    }
  });

  it("should throw MercadoPagoApiError on POST failure", async () => {
    mockFetch({ error: "bad_request" }, 400);
    const client = new MakeClient("tok");

    await expect(client.post("/checkout/preferences", {})).rejects.toThrow(MercadoPagoApiError);

    try {
      await client.post("/checkout/preferences", {});
    } catch (err) {
      const apiErr = err as MercadoPagoApiError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.method).toBe("POST");
      expect(apiErr.path).toBe("/checkout/preferences");
    }
  });

  it("should include status code in error message", async () => {
    mockFetch({ error: "unauthorized" }, 401);
    const client = new MakeClient("bad_token");

    await expect(client.get("/users/me")).rejects.toThrow("responded with 401");
  });
});
