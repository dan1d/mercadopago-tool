import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MCP Server", () => {
  let client: Client;

  beforeEach(async () => {
    vi.resetModules();
    mockFetch.mockReset();
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "TEST_TOKEN";

    const { createMcpServer } = await import("../src/mcp-server.js");
    const server = createMcpServer("TEST_TOKEN");

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "1.0.0" });
    await client.connect(clientTransport);
  });

  afterEach(async () => {
    await client.close();
  });

  describe("tool listing", () => {
    it("exposes all 5 tools", async () => {
      const result = await client.listTools();
      const names = result.tools.map((t) => t.name).sort();
      expect(names).toEqual([
        "create_payment_preference",
        "create_refund",
        "get_merchant_info",
        "get_payment",
        "search_payments",
      ]);
    });

    it("each tool has a description", async () => {
      const result = await client.listTools();
      for (const tool of result.tools) {
        expect(tool.description).toBeTruthy();
        expect(tool.description!.length).toBeGreaterThan(10);
      }
    });

    it("each tool has an inputSchema", async () => {
      const result = await client.listTools();
      for (const tool of result.tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
      }
    });
  });

  describe("create_payment_preference", () => {
    it("creates a payment link and returns init_point", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          id: "pref-123",
          init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123",
          sandbox_init_point: "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=pref-123",
        })
      );

      const result = await client.callTool({
        name: "create_payment_preference",
        arguments: {
          title: "Curso Python",
          quantity: 1,
          currency: "ARS",
          unit_price: 5000,
        },
      });

      expect(result.isError).toBeFalsy();
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      const parsed = JSON.parse(text);
      expect(parsed.init_point).toContain("mercadopago");
      expect(parsed.id).toBe("pref-123");
    });

    it("supports back_urls parameter", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ id: "pref-456", init_point: "https://mp.com/checkout" })
      );

      const result = await client.callTool({
        name: "create_payment_preference",
        arguments: {
          title: "Test",
          quantity: 1,
          currency: "ARS",
          unit_price: 100,
          back_urls: { success: "https://example.com/ok" },
        },
      });

      expect(result.isError).toBeFalsy();

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.back_urls.success).toBe("https://example.com/ok");
    });

    it("returns error on API failure", async () => {
      mockFetch.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));

      const result = await client.callTool({
        name: "create_payment_preference",
        arguments: {
          title: "Test",
          quantity: 1,
          currency: "ARS",
          unit_price: 100,
        },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("401");
    });
  });

  describe("get_payment", () => {
    it("retrieves payment details by ID", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          id: 12345678,
          status: "approved",
          transaction_amount: 5000,
          currency_id: "ARS",
          description: "Curso Python",
          payer: { email: "buyer@test.com" },
        })
      );

      const result = await client.callTool({
        name: "get_payment",
        arguments: { payment_id: "12345678" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
      expect(parsed.id).toBe(12345678);
      expect(parsed.status).toBe("approved");
      expect(parsed.transaction_amount).toBe(5000);
    });

    it("returns error for not found payment", async () => {
      mockFetch.mockResolvedValueOnce(new Response("Not Found", { status: 404 }));

      const result = await client.callTool({
        name: "get_payment",
        arguments: { payment_id: "999999" },
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("404");
    });
  });

  describe("create_refund", () => {
    it("creates a full refund", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ id: 1001, payment_id: 12345678, amount: 5000 })
      );

      const result = await client.callTool({
        name: "create_refund",
        arguments: { payment_id: "12345678" },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
      expect(parsed.id).toBe(1001);
      expect(parsed.amount).toBe(5000);
    });

    it("creates a partial refund with amount", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ id: 1002, payment_id: 12345678, amount: 2000 })
      );

      const result = await client.callTool({
        name: "create_refund",
        arguments: { payment_id: "12345678", amount: 2000 },
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
      expect(parsed.amount).toBe(2000);

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.amount).toBe(2000);
    });
  });

  describe("search_payments", () => {
    it("returns list of payments", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          results: [
            { id: 1, status: "approved", transaction_amount: 1000 },
            { id: 2, status: "pending", transaction_amount: 2000 },
          ],
          paging: { total: 2, limit: 10, offset: 0 },
        })
      );

      const result = await client.callTool({
        name: "search_payments",
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
      expect(parsed.results).toHaveLength(2);
      expect(parsed.results[0].status).toBe("approved");
    });

    it("supports status filter", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ results: [], paging: { total: 0 } })
      );

      await client.callTool({
        name: "search_payments",
        arguments: { status: "approved", limit: 5 },
      });

      const fetchUrl = mockFetch.mock.calls[0][0];
      expect(fetchUrl).toContain("status=approved");
      expect(fetchUrl).toContain("limit=5");
    });
  });

  describe("get_merchant_info", () => {
    it("returns merchant profile", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({
          id: 167653756,
          nickname: "COBROYA",
          email: "merchant@test.com",
          country_id: "AR",
          site_id: "MLA",
        })
      );

      const result = await client.callTool({
        name: "get_merchant_info",
        arguments: {},
      });

      expect(result.isError).toBeFalsy();
      const parsed = JSON.parse((result.content as Array<{ type: string; text: string }>)[0].text);
      expect(parsed.id).toBe(167653756);
      expect(parsed.nickname).toBe("COBROYA");
      expect(parsed.site_id).toBe("MLA");
    });

    it("returns error on auth failure", async () => {
      mockFetch.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));

      const result = await client.callTool({
        name: "get_merchant_info",
        arguments: {},
      });

      expect(result.isError).toBe(true);
      const text = (result.content as Array<{ type: string; text: string }>)[0].text;
      expect(text).toContain("401");
    });
  });

  describe("server metadata", () => {
    it("reports correct server info", async () => {
      const info = client.getServerVersion();
      expect(info?.name).toBe("cobroya");
      expect(info?.version).toBe("1.0.0");
    });
  });
});
