import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// --- Mocks ---

const mockSendMessage = vi.fn().mockResolvedValue({});
const mockOnText = vi.fn();

vi.mock("node-telegram-bot-api", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      sendMessage: mockSendMessage,
      onText: mockOnText,
    })),
  };
});

// Mock the environment before importing the bot
vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-telegram-token");
vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "test-mp-token");
vi.stubEnv("MP_CURRENCY", "ARS");

// Mock global fetch for MercadoPagoClient
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Helper to get registered handler for a command pattern
function getHandler(pattern: string): (msg: Record<string, unknown>, match: RegExpExecArray | null) => void {
  const call = mockOnText.mock.calls.find(
    (c: unknown[]) => (c[0] as RegExp).source.includes(pattern)
  );
  if (!call) throw new Error(`No handler registered for pattern containing "${pattern}"`);
  return call[1] as (msg: Record<string, unknown>, match: RegExpExecArray | null) => void;
}

function makeMsg(chatId: number = 123) {
  return { chat: { id: chatId } };
}

function makeMatch(...groups: Array<string | undefined>): RegExpExecArray {
  const arr = [groups.join(" "), ...groups] as unknown as RegExpExecArray;
  arr.index = 0;
  arr.input = "";
  return arr;
}

function mockFetchResponse(data: unknown, ok = true, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}

describe("Telegram Bot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should register command handlers on startBot", async () => {
    // Dynamic import to trigger module execution after mocks
    const { startBot } = await import("../src/telegram-bot.js");
    startBot();

    // Should register handlers for start, help, cobrar, pagos, estado, devolver
    expect(mockOnText).toHaveBeenCalledTimes(6);
  });

  describe("/cobrar", () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      const { startBot } = await import("../src/telegram-bot.js");
      startBot();
    });

    it("should show usage when no arguments provided", async () => {
      const handler = getHandler("cobrar");
      await handler(makeMsg(), makeMatch(undefined as unknown as string));

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("/cobrar <monto> <descripcion>")
      );
    });

    it("should show error for invalid amount", async () => {
      const handler = getHandler("cobrar");
      await handler(makeMsg(), makeMatch("abc descripcion"));

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("numero positivo")
      );
    });

    it("should show error when description is missing", async () => {
      const handler = getHandler("cobrar");
      await handler(makeMsg(), makeMatch("5000"));

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("monto y una descripcion")
      );
    });

    it("should create payment and return link", async () => {
      mockFetchResponse({
        id: "pref-123",
        init_point: "https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123",
        sandbox_init_point: "https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-123",
      });

      const handler = getHandler("cobrar");
      await handler(makeMsg(), makeMatch("5000 Servicio de diseno"));

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("Link de pago creado")
      );
      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("mercadopago.com")
      );
      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("Servicio de diseno")
      );
    });

    it("should handle MP API error gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: () => Promise.resolve("Unauthorized"),
      });

      const handler = getHandler("cobrar");
      await handler(makeMsg(), makeMatch("5000 Servicio"));

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("autenticacion")
      );
    });
  });

  describe("/pagos", () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      const { startBot } = await import("../src/telegram-bot.js");
      startBot();
    });

    it("should list recent payments with status emoji", async () => {
      mockFetchResponse({
        results: [
          {
            id: 1001,
            status: "approved",
            transaction_amount: 5000,
            currency_id: "ARS",
            description: "Servicio de diseno",
            date_created: "2025-01-15T10:00:00Z",
          },
          {
            id: 1002,
            status: "pending",
            transaction_amount: 3000,
            currency_id: "ARS",
            description: "Consulta",
            date_created: "2025-01-14T10:00:00Z",
          },
          {
            id: 1003,
            status: "rejected",
            transaction_amount: 1500,
            currency_id: "ARS",
            description: "Producto",
            date_created: "2025-01-13T10:00:00Z",
          },
        ],
      });

      const handler = getHandler("pagos");
      await handler(makeMsg(), null);

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("Ultimos pagos")
      );
      // Check status labels
      const message = mockSendMessage.mock.calls[0][1] as string;
      expect(message).toContain("#1001");
      expect(message).toContain("Aprobado");
      expect(message).toContain("#1002");
      expect(message).toContain("Pendiente");
      expect(message).toContain("#1003");
      expect(message).toContain("Rechazado");
    });

    it("should show message when no payments found", async () => {
      mockFetchResponse({ results: [] });

      const handler = getHandler("pagos");
      await handler(makeMsg(), null);

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("No se encontraron")
      );
    });
  });

  describe("/estado", () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      const { startBot } = await import("../src/telegram-bot.js");
      startBot();
    });

    it("should show usage when no payment_id provided", async () => {
      const handler = getHandler("estado");
      await handler(makeMsg(), makeMatch(undefined as unknown as string));

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("/estado <payment_id>")
      );
    });

    it("should display payment details", async () => {
      mockFetchResponse({
        id: 12345,
        status: "approved",
        transaction_amount: 5000,
        currency_id: "ARS",
        description: "Servicio de diseno",
        payer: { email: "buyer@example.com" },
        date_created: "2025-01-15T10:00:00Z",
      });

      const handler = getHandler("estado");
      await handler(makeMsg(), makeMatch("12345"));

      const message = mockSendMessage.mock.calls[0][1] as string;
      expect(message).toContain("Pago #12345");
      expect(message).toContain("Aprobado");
      expect(message).toContain("buyer@example.com");
      expect(message).toContain("Servicio de diseno");
    });

    it("should handle not found error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: () => Promise.resolve("Not found"),
      });

      const handler = getHandler("estado");
      await handler(makeMsg(), makeMatch("99999"));

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("No se encontro")
      );
    });
  });

  describe("/devolver", () => {
    beforeEach(async () => {
      vi.clearAllMocks();
      const { startBot } = await import("../src/telegram-bot.js");
      startBot();
    });

    it("should show usage when no payment_id provided", async () => {
      const handler = getHandler("devolver");
      await handler(makeMsg(), makeMatch(undefined as unknown as string));

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("/devolver <payment_id>")
      );
    });

    it("should process full refund", async () => {
      mockFetchResponse({
        id: 9001,
        amount: 5000,
      });

      const handler = getHandler("devolver");
      await handler(makeMsg(), makeMatch("12345", undefined));

      const message = mockSendMessage.mock.calls[0][1] as string;
      expect(message).toContain("Devolucion total");
      expect(message).toContain("9001");
      expect(message).toContain("#12345");
    });

    it("should process partial refund", async () => {
      mockFetchResponse({
        id: 9002,
        amount: 1500,
      });

      const handler = getHandler("devolver");
      await handler(makeMsg(), makeMatch("12345", "1500"));

      const message = mockSendMessage.mock.calls[0][1] as string;
      expect(message).toContain("Devolucion parcial");
      expect(message).toContain("9002");
      expect(message).toContain("1500");
    });

    it("should show error for invalid refund amount", async () => {
      const handler = getHandler("devolver");
      await handler(makeMsg(), makeMatch("12345", "abc"));

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("numero positivo")
      );
    });

    it("should handle API errors on refund", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        text: () => Promise.resolve("Rate limited"),
      });

      const handler = getHandler("devolver");
      await handler(makeMsg(), makeMatch("12345", undefined));

      expect(mockSendMessage).toHaveBeenCalledWith(
        123,
        expect.stringContaining("Demasiadas solicitudes")
      );
    });
  });
});
