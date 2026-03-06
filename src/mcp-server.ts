import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createMercadoPagoTools } from "./index.js";

export function createMcpServer(accessToken: string) {
  const { tools } = createMercadoPagoTools(accessToken);

  const server = new McpServer({
    name: "cobroya",
    version: "1.0.0",
  });

  server.tool(
    "create_payment_preference",
    "Creates a Mercado Pago checkout payment preference (payment link). Returns init_point URL for redirecting buyers.",
    {
      title: z.string(),
      quantity: z.number(),
      currency: z.string(),
      unit_price: z.number(),
      back_urls: z.object({
        success: z.string().optional(),
        failure: z.string().optional(),
        pending: z.string().optional(),
      }).optional(),
      notification_url: z.string().optional(),
    },
    async (params) => {
      try {
        const result = await tools.create_payment_preference(params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: message }], isError: true };
      }
    },
  );

  server.tool(
    "get_payment",
    "Retrieve a payment by its ID. Returns full payment details including status, amount, payer info.",
    {
      payment_id: z.string(),
    },
    async (params) => {
      try {
        const result = await tools.get_payment(params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: message }], isError: true };
      }
    },
  );

  server.tool(
    "create_refund",
    "Refund a payment fully or partially. Omit amount for full refund.",
    {
      payment_id: z.string(),
      amount: z.number().optional(),
    },
    async (params) => {
      try {
        const result = await tools.create_refund(params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: message }], isError: true };
      }
    },
  );

  server.tool(
    "search_payments",
    "Search recent payments for the authenticated merchant. Supports filtering by status.",
    {
      status: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    },
    async (params) => {
      try {
        const result = await tools.search_payments(params);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: message }], isError: true };
      }
    },
  );

  server.tool(
    "get_merchant_info",
    "Retrieve the authenticated merchant's user profile including ID, nickname, and site.",
    {},
    async () => {
      try {
        const result = await tools.get_merchant_info();
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: message }], isError: true };
      }
    },
  );

  return server;
}

// CLI entry point
const isMain = process.argv[1]?.includes("mcp-server");
if (isMain) {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  if (!token) {
    console.error("MERCADO_PAGO_ACCESS_TOKEN environment variable is required");
    process.exit(1);
  }

  const server = createMcpServer(token);
  const transport = new StdioServerTransport();
  server.connect(transport).catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
