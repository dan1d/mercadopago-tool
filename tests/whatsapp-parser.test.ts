import { describe, it, expect } from "vitest";
import { parseMessage, extractMessages } from "../src/whatsapp/message-parser.js";

describe("parseMessage", () => {
  it("parses cobrar command", () => {
    expect(parseMessage("cobrar 5000 curso python")).toEqual({
      command: "cobrar",
      args: ["5000", "curso", "python"],
    });
  });

  it("parses cobrar with slash prefix", () => {
    expect(parseMessage("/cobrar 1000 diseno web")).toEqual({
      command: "cobrar",
      args: ["1000", "diseno", "web"],
    });
  });

  it("parses pagos command", () => {
    expect(parseMessage("pagos")).toEqual({ command: "pagos", args: [] });
  });

  it("parses estado with arg", () => {
    expect(parseMessage("estado 123456")).toEqual({
      command: "estado",
      args: ["123456"],
    });
  });

  it("parses devolver with amount", () => {
    expect(parseMessage("devolver 123 500")).toEqual({
      command: "devolver",
      args: ["123", "500"],
    });
  });

  it("parses ayuda", () => {
    expect(parseMessage("ayuda")).toEqual({ command: "ayuda", args: [] });
  });

  it("maps help to ayuda", () => {
    expect(parseMessage("help")).toEqual({ command: "ayuda", args: [] });
  });

  it("is case-insensitive", () => {
    expect(parseMessage("COBRAR 100 test")).toEqual({
      command: "cobrar",
      args: ["100", "test"],
    });
  });

  it("returns null for unknown commands", () => {
    expect(parseMessage("hola que tal")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseMessage("")).toBeNull();
  });

  it("returns null for whitespace-only", () => {
    expect(parseMessage("   ")).toBeNull();
  });

  it("trims whitespace", () => {
    expect(parseMessage("  pagos  ")).toEqual({ command: "pagos", args: [] });
  });
});

describe("extractMessages", () => {
  it("extracts text messages from webhook payload", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  {
                    from: "5491155551234",
                    id: "wamid.abc",
                    timestamp: "1700000000",
                    type: "text",
                    text: { body: "cobrar 100 test" },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const msgs = extractMessages(payload);
    expect(msgs).toHaveLength(1);
    expect(msgs[0]).toEqual({
      from: "5491155551234",
      text: "cobrar 100 test",
      messageId: "wamid.abc",
      timestamp: "1700000000",
    });
  });

  it("ignores non-text messages", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { from: "123", id: "x", timestamp: "1", type: "image" },
                ],
              },
            },
          ],
        },
      ],
    };
    expect(extractMessages(payload)).toHaveLength(0);
  });

  it("returns empty for non-whatsapp objects", () => {
    expect(extractMessages({ object: "page", entry: [] })).toHaveLength(0);
  });

  it("handles missing entry", () => {
    expect(extractMessages({ object: "whatsapp_business_account" })).toHaveLength(0);
  });

  it("extracts multiple messages", () => {
    const payload = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              value: {
                messages: [
                  { from: "111", id: "a", timestamp: "1", type: "text", text: { body: "pagos" } },
                  { from: "222", id: "b", timestamp: "2", type: "text", text: { body: "ayuda" } },
                ],
              },
            },
          ],
        },
      ],
    };
    expect(extractMessages(payload)).toHaveLength(2);
  });
});
