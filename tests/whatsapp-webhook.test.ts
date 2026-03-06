import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { createWhatsAppWebhookHandler } from "../src/whatsapp/webhook.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}

const baseConfig = {
  waAccessToken: "WA_TOK",
  waPhoneNumberId: "PHONE_1",
  verifyToken: "my_verify_token",
  mpAccessToken: "MP_TOK",
  currency: "ARS",
};

describe("WhatsApp Webhook", () => {
  let handler: (req: Request) => Promise<Response>;

  beforeEach(() => {
    mockFetch.mockReset();
    handler = createWhatsAppWebhookHandler(baseConfig);
  });

  // ─── GET: Verification ──────────────────────────────────

  describe("GET verification", () => {
    it("returns challenge on valid verify token", async () => {
      const url = "https://example.com/webhook?hub.mode=subscribe&hub.verify_token=my_verify_token&hub.challenge=abc123";
      const req = new Request(url, { method: "GET" });
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe("abc123");
    });

    it("returns 403 on invalid verify token", async () => {
      const url = "https://example.com/webhook?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=abc";
      const req = new Request(url, { method: "GET" });
      const res = await handler(req);
      expect(res.status).toBe(403);
    });

    it("returns 403 when mode is not subscribe", async () => {
      const url = "https://example.com/webhook?hub.mode=other&hub.verify_token=my_verify_token&hub.challenge=abc";
      const req = new Request(url, { method: "GET" });
      const res = await handler(req);
      expect(res.status).toBe(403);
    });
  });

  // ─── POST: Messages ─────────────────────────────────────

  describe("POST messages", () => {
    function postRequest(body: unknown) {
      return new Request("https://example.com/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    it("returns 200 for valid whatsapp payload", async () => {
      const body = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    { from: "549111", id: "wamid.1", timestamp: "1", type: "text", text: { body: "ayuda" } },
                  ],
                },
              },
            ],
          },
        ],
      };

      // The handler will try to send a WhatsApp message via Graph API
      mockFetch.mockResolvedValue(jsonResponse({ messages: [{ id: "ok" }] }));

      const res = await handler(postRequest(body));
      expect(res.status).toBe(200);
    });

    it("returns 200 for non-whatsapp object (ignored)", async () => {
      const res = await handler(postRequest({ object: "page", entry: [] }));
      expect(res.status).toBe(200);
    });

    it("returns 200 for payload with no text messages", async () => {
      const body = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [{ from: "111", id: "x", type: "image" }],
                },
              },
            ],
          },
        ],
      };
      const res = await handler(postRequest(body));
      expect(res.status).toBe(200);
    });

    it("returns 400 for invalid JSON", async () => {
      const req = new Request("https://example.com/webhook", {
        method: "POST",
        body: "not json",
      });
      const res = await handler(req);
      expect(res.status).toBe(400);
    });

    it("processes cobrar command end-to-end", async () => {
      // First call: MP create preference
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: "pref_99",
        init_point: "https://mp.com/checkout/99",
      }));
      // Second call: WA send message
      mockFetch.mockResolvedValueOnce(jsonResponse({ messages: [{ id: "ok" }] }));

      const body = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    { from: "549111", id: "wamid.2", timestamp: "1", type: "text", text: { body: "cobrar 3000 curso node" } },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await handler(postRequest(body));
      expect(res.status).toBe(200);

      // Verify MP API was called
      expect(mockFetch.mock.calls[0][0]).toBe("https://api.mercadopago.com/checkout/preferences");

      // Verify WA API was called with the link
      const waCall = mockFetch.mock.calls[1];
      expect(waCall[0]).toContain("PHONE_1/messages");
      const waBody = JSON.parse(waCall[1].body);
      expect(waBody.to).toBe("549111");
      expect(waBody.text.body).toContain("https://mp.com/checkout/99");
    });

    it("ignores unknown commands gracefully", async () => {
      const body = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    { from: "549111", id: "wamid.3", timestamp: "1", type: "text", text: { body: "hola que tal" } },
                  ],
                },
              },
            ],
          },
        ],
      };

      const res = await handler(postRequest(body));
      expect(res.status).toBe(200);
      // No fetch calls since no valid command
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ─── allowedPhones filter ────────────────────────────────

  describe("allowedPhones filter", () => {
    it("skips messages from non-allowed phones", async () => {
      const restrictedHandler = createWhatsAppWebhookHandler({
        ...baseConfig,
        allowedPhones: new Set(["549222"]),
      });

      const body = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    { from: "549111", id: "wamid.4", timestamp: "1", type: "text", text: { body: "ayuda" } },
                  ],
                },
              },
            ],
          },
        ],
      };

      const req = new Request("https://example.com/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const res = await restrictedHandler(req);
      expect(res.status).toBe(200);
      // No fetch calls since the phone is not allowed
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ─── Handler error catch ───────────────────────────────────

  describe("handler error catch", () => {
    it("returns 200 even when command handler throws", async () => {
      // Make the MP API call throw so the handler fails
      mockFetch.mockRejectedValueOnce(new Error("MP API down"));

      const body = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    { from: "549111", id: "wamid.5", timestamp: "1", type: "text", text: { body: "pagos" } },
                  ],
                },
              },
            ],
          },
        ],
      };

      const req = new Request("https://example.com/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const res = await handler(req);
      // Webhook still returns 200 even though the handler errored
      expect(res.status).toBe(200);
    });

    it("logs error to console.error when command handler throws", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error("MP API down"));

      const body = {
        object: "whatsapp_business_account",
        entry: [
          {
            changes: [
              {
                value: {
                  messages: [
                    { from: "549111", id: "wamid.6", timestamp: "1", type: "text", text: { body: "pagos" } },
                  ],
                },
              },
            ],
          },
        ],
      };

      const req = new Request("https://example.com/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await handler(req);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[whatsapp]"),
        expect.any(Error)
      );
      errorSpy.mockRestore();
    });
  });

  // ─── X-Hub-Signature-256 validation ─────────────────────

  describe("X-Hub-Signature-256 validation", () => {
    const appSecret = "test_meta_app_secret_123";

    function signedPostRequest(body: unknown, secret: string = appSecret) {
      const rawBody = JSON.stringify(body);
      const signature =
        "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
      return new Request("https://example.com/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": signature,
        },
        body: rawBody,
      });
    }

    const validPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: "549111",
                    id: "wamid.sig1",
                    timestamp: "1",
                    type: "text",
                    text: { body: "ayuda" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    it("returns 200 and processes message with valid signature", async () => {
      const signedHandler = createWhatsAppWebhookHandler({
        ...baseConfig,
        appSecret,
      });

      mockFetch.mockResolvedValue(
        jsonResponse({ messages: [{ id: "ok" }] })
      );

      const res = await signedHandler(signedPostRequest(validPayload));
      expect(res.status).toBe(200);
      // Handler should have sent a WA message (ayuda triggers help response)
      expect(mockFetch).toHaveBeenCalled();
    });

    it("returns 401 with invalid signature", async () => {
      const signedHandler = createWhatsAppWebhookHandler({
        ...baseConfig,
        appSecret,
      });

      const req = new Request("https://example.com/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=invalid_signature_hex_value_abcdef0123456789",
        },
        body: JSON.stringify(validPayload),
      });

      const res = await signedHandler(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 when signature header is missing and appSecret is configured", async () => {
      const signedHandler = createWhatsAppWebhookHandler({
        ...baseConfig,
        appSecret,
      });

      const req = new Request("https://example.com/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      });

      const res = await signedHandler(req);
      expect(res.status).toBe(401);
    });

    it("skips validation when appSecret is not configured (backward compatible)", async () => {
      // handler from beforeEach has no appSecret
      mockFetch.mockResolvedValue(
        jsonResponse({ messages: [{ id: "ok" }] })
      );

      const req = new Request("https://example.com/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validPayload),
      });

      const res = await handler(req);
      expect(res.status).toBe(200);
    });
  });

  // ─── Other methods ──────────────────────────────────────

  it("returns 405 for unsupported methods", async () => {
    const req = new Request("https://example.com/webhook", { method: "PUT" });
    const res = await handler(req);
    expect(res.status).toBe(405);
  });
});
