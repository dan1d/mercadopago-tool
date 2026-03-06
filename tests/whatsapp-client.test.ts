import { describe, it, expect, vi, beforeEach } from "vitest";
import { WhatsAppClient } from "../src/whatsapp/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

describe("WhatsAppClient", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("throws if accessToken is missing", () => {
    expect(() => new WhatsAppClient({ accessToken: "", phoneNumberId: "123" }))
      .toThrow("WHATSAPP_ACCESS_TOKEN is required");
  });

  it("throws if phoneNumberId is missing", () => {
    expect(() => new WhatsAppClient({ accessToken: "tok", phoneNumberId: "" }))
      .toThrow("WHATSAPP_PHONE_NUMBER_ID is required");
  });

  it("throws if phoneNumber is empty", async () => {
    const client = new WhatsAppClient({ accessToken: "tok", phoneNumberId: "123" });
    await expect(client.sendMessage("", "hello")).rejects.toThrow("phoneNumber is required");
  });

  it("throws if message is empty", async () => {
    const client = new WhatsAppClient({ accessToken: "tok", phoneNumberId: "123" });
    await expect(client.sendMessage("5491100001111", "")).rejects.toThrow("message is required");
  });

  it("sends message with correct payload", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ messages: [{ id: "wamid.abc" }] }));
    const client = new WhatsAppClient({ accessToken: "WA_TOKEN", phoneNumberId: "PHONE_ID_1" });

    await client.sendMessage("5491155551234", "Hola mundo");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://graph.facebook.com/v18.0/PHONE_ID_1/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer WA_TOKEN",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: "5491155551234",
          type: "text",
          text: { body: "Hola mundo" },
        }),
      })
    );
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce(new Response("Bad Request", { status: 400 }));
    const client = new WhatsAppClient({ accessToken: "tok", phoneNumberId: "123" });

    await expect(client.sendMessage("549110000", "test"))
      .rejects.toThrow("WhatsApp API error (400)");
  });
});
