const BASE_URL = "https://api.mercadopago.com";

function validateNumericId(id: string): void {
  if (!/^\d+$/.test(id)) {
    throw new Error("payment_id must be numeric");
  }
}

export function createMercadoPagoExecutor(accessToken: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  async function request(url: string, options: RequestInit): Promise<unknown> {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  }

  return async function execute(
    functionName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    switch (functionName) {
      case "create_payment_preference": {
        const body: Record<string, unknown> = {
          items: [
            {
              title: args.title,
              quantity: args.quantity,
              currency_id: args.currency,
              unit_price: args.unit_price,
            },
          ],
        };
        if (args.back_urls) body.back_urls = args.back_urls;
        if (args.notification_url) body.notification_url = args.notification_url;

        return request(`${BASE_URL}/checkout/preferences`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
      }

      case "get_payment": {
        const paymentId = args.payment_id as string;
        validateNumericId(paymentId);
        return request(`${BASE_URL}/v1/payments/${paymentId}`, {
          method: "GET",
          headers,
        });
      }

      case "create_refund": {
        const paymentId = args.payment_id as string;
        validateNumericId(paymentId);
        const body: Record<string, unknown> = {};
        if (args.amount !== undefined) body.amount = args.amount;

        return request(`${BASE_URL}/v1/payments/${paymentId}/refunds`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
      }

      case "search_payments": {
        const url = new URL(`${BASE_URL}/v1/payments/search`);
        for (const [key, value] of Object.entries(args)) {
          if (value !== undefined) {
            url.searchParams.set(key, String(value));
          }
        }
        return request(url.toString(), {
          method: "GET",
          headers,
        });
      }

      case "get_merchant_info": {
        return request(`${BASE_URL}/users/me`, {
          method: "GET",
          headers,
        });
      }

      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  };
}

export async function handleToolCall(
  executor: ReturnType<typeof createMercadoPagoExecutor>,
  toolCall: { function: { name: string; arguments: string } }
): Promise<string> {
  const args = JSON.parse(toolCall.function.arguments);
  const result = await executor(toolCall.function.name, args);
  return JSON.stringify(result);
}
