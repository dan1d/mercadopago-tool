import { describe, it, expect, vi } from "vitest";
import { createMercadoPagoTools } from "../src/index.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("createMercadoPagoTools", () => {
  it("returns tools and schemas", () => {
    const mp = createMercadoPagoTools("TOKEN");
    expect(mp.schemas).toHaveLength(5);
    expect(mp.tools).toHaveProperty("create_payment_preference");
    expect(mp.tools).toHaveProperty("get_payment");
    expect(mp.tools).toHaveProperty("create_refund");
    expect(mp.tools).toHaveProperty("search_payments");
    expect(mp.tools).toHaveProperty("get_merchant_info");
  });

  it("schemas have name and description", () => {
    const mp = createMercadoPagoTools("TOKEN");
    for (const schema of mp.schemas) {
      expect(schema).toHaveProperty("name");
      expect(schema).toHaveProperty("description");
      expect(schema).toHaveProperty("parameters");
      expect(typeof schema.name).toBe("string");
      expect(typeof schema.description).toBe("string");
    }
  });

  it("tools are callable and hit the API", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 999, nickname: "MP_USER" }));
    const mp = createMercadoPagoTools("MY_TOKEN");
    const result = await mp.tools.get_merchant_info();
    expect(result).toEqual({ id: 999, nickname: "MP_USER" });
  });

  it("search_payments accepts optional params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
    const mp = createMercadoPagoTools("MY_TOKEN");
    await mp.tools.search_payments({ status: "approved" });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.mercadopago.com/v1/payments/search?status=approved",
      expect.anything()
    );
  });

  it("create_refund is wired correctly", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 5001 }));
    const mp = createMercadoPagoTools("MY_TOKEN");
    const result = await mp.tools.create_refund({ payment_id: "123" });
    expect(result).toEqual({ id: 5001 });
  });
});
