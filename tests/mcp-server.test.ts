import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("mcp-server", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "TEST_TOKEN";
  });

  it("createMercadoPagoTools is available for the server", async () => {
    const { createMercadoPagoTools } = await import("../src/index.js");
    const mp = createMercadoPagoTools("TEST_TOKEN");

    expect(mp.schemas).toHaveLength(5);
    expect(Object.keys(mp.tools)).toEqual([
      "create_payment_preference",
      "get_payment",
      "create_refund",
      "search_payments",
      "get_merchant_info",
    ]);
  });

  it("tools return JSON-serializable results", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1, nickname: "TESTUSER" }));
    const { createMercadoPagoTools } = await import("../src/index.js");
    const mp = createMercadoPagoTools("TEST_TOKEN");

    const result = await mp.tools.get_merchant_info();
    const text = JSON.stringify(result, null, 2);
    expect(text).toContain("TESTUSER");
  });

  it("tool errors can be caught and formatted", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("Unauthorized", { status: 401 }),
    );
    const { createMercadoPagoTools } = await import("../src/index.js");
    const mp = createMercadoPagoTools("BAD_TOKEN");

    try {
      await mp.tools.get_merchant_info();
      expect.unreachable("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const message = (error as Error).message;
      expect(message).toContain("401");
    }
  });

  it("McpServer can be imported from the SDK", async () => {
    const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");
    const server = new McpServer({ name: "test", version: "0.0.1" });
    expect(server).toBeDefined();
  });

  it("StdioServerTransport can be imported from the SDK", async () => {
    const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
    expect(StdioServerTransport).toBeDefined();
  });
});
