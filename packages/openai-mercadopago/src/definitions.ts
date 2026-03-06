export interface FunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
}

export const mercadoPagoFunctions: FunctionDefinition[] = [
  {
    name: "create_payment_preference",
    description:
      "Creates a Mercado Pago checkout payment preference (payment link). Returns init_point URL for redirecting buyers.",
    parameters: {
      type: "object",
      required: ["title", "quantity", "currency", "unit_price"],
      properties: {
        title: { type: "string", description: "Product or service title" },
        quantity: { type: "number", description: "Quantity of items" },
        currency: {
          type: "string",
          description: "Currency ID (e.g. ARS, BRL, MXN, CLP, COP, UYU, PEN)",
        },
        unit_price: { type: "number", description: "Unit price of the item" },
        notification_url: {
          type: "string",
          description: "Webhook URL for payment notifications (IPN)",
        },
      },
    },
  },
  {
    name: "get_payment",
    description:
      "Retrieve a payment by its ID. Returns full payment details including status, amount, payer info.",
    parameters: {
      type: "object",
      required: ["payment_id"],
      properties: {
        payment_id: { type: "string", description: "The payment ID to look up" },
      },
    },
  },
  {
    name: "create_refund",
    description: "Refund a payment fully or partially. Omit amount for full refund.",
    parameters: {
      type: "object",
      required: ["payment_id"],
      properties: {
        payment_id: { type: "string", description: "The payment ID to refund" },
        amount: {
          type: "number",
          description: "Partial refund amount. Omit for full refund.",
        },
      },
    },
  },
  {
    name: "search_payments",
    description:
      "Search recent payments for the authenticated merchant. Supports filtering by status.",
    parameters: {
      type: "object",
      required: [],
      properties: {
        status: {
          type: "string",
          description: "Filter by status: approved, pending, rejected, refunded, cancelled",
        },
        sort: { type: "string", description: "Sort field (e.g. date_created)" },
        criteria: { type: "string", description: "Sort order: asc or desc" },
        limit: { type: "number", description: "Max results (default 30, max 100)" },
        offset: { type: "number", description: "Pagination offset" },
      },
    },
  },
  {
    name: "get_merchant_info",
    description:
      "Retrieve the authenticated merchant's user profile including ID, nickname, and site.",
    parameters: {
      type: "object",
      required: [],
      properties: {},
    },
  },
];
