import { describe, it, expect, vi, beforeEach } from "vitest";
import { WhatsAppClient } from "../src/whatsapp/client.js";
import { createCommandHandlers, createPaymentNotifier } from "../src/whatsapp/handlers.js";
import type { ParsedCommand } from "../src/whatsapp/message-parser.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}

// Mock WhatsApp sendMessage so it doesn't actually call Graph API
function createMockWa() {
  const wa = new WhatsAppClient({ accessToken: "wa_tok", phoneNumberId: "phone_1" });
  const spy = vi.spyOn(wa, "sendMessage").mockResolvedValue({ messages: [{ id: "ok" }] });
  return { wa, spy };
}

describe("command handlers", () => {
  const { handleCommand } = createCommandHandlers({
    mpAccessToken: "MP_TOKEN",
    currency: "ARS",
  });

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe("ayuda", () => {
    it("sends help text", async () => {
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "ayuda", args: [] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Comandos disponibles"));
    });
  });

  describe("cobrar", () => {
    it("sends usage when args missing", async () => {
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "cobrar", args: [] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Uso: cobrar"));
    });

    it("sends usage when only amount provided", async () => {
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "cobrar", args: ["5000"] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Uso: cobrar"));
    });

    it("rejects invalid amount", async () => {
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "cobrar", args: ["abc", "test"] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("numero positivo"));
    });

    it("creates payment and sends link", async () => {
      // Mock MP API create preference
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: "pref_1",
        init_point: "https://mp.com/checkout/pref_1",
      }));

      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "cobrar", args: ["5000", "curso", "python"] });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/checkout/preferences",
        expect.anything()
      );
      expect(spy).toHaveBeenCalledWith(
        "549111",
        expect.stringContaining("https://mp.com/checkout/pref_1")
      );
    });

    it("sends error on MP failure", async () => {
      mockFetch.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "cobrar", args: ["100", "test"] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("autenticacion"));
    });
  });

  describe("pagos", () => {
    it("lists recent payments", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        results: [
          { id: 1, status: "approved", transaction_amount: 5000, currency_id: "ARS" },
          { id: 2, status: "pending", transaction_amount: 3000, currency_id: "ARS" },
        ],
      }));

      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "pagos", args: [] });

      const msg = spy.mock.calls[0][1];
      expect(msg).toContain("5000");
      expect(msg).toContain("3000");
      expect(msg).toContain("Aprobado");
    });

    it("shows message when no payments", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "pagos", args: [] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("No se encontraron"));
    });

    it("sends error on MP failure", async () => {
      mockFetch.mockResolvedValueOnce(new Response("Server Error", { status: 500 }));
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "pagos", args: [] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Error de Mercado Pago"));
    });
  });

  describe("estado", () => {
    it("sends usage when no ID", async () => {
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "estado", args: [] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Uso: estado"));
    });

    it("shows payment details", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({
        id: 456,
        status: "approved",
        transaction_amount: 2500,
        currency_id: "ARS",
        description: "Servicio web",
        payer: { email: "test@example.com" },
        date_created: "2024-01-15",
      }));

      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "estado", args: ["456"] });

      const msg = spy.mock.calls[0][1];
      expect(msg).toContain("456");
      expect(msg).toContain("Aprobado");
      expect(msg).toContain("2500");
      expect(msg).toContain("test@example.com");
    });

    it("sends error when MP API returns 404", async () => {
      mockFetch.mockResolvedValueOnce(new Response("Not found", { status: 404 }));
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "estado", args: ["99999"] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("No se encontro"));
    });
  });

  describe("devolver", () => {
    it("sends usage when no ID", async () => {
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "devolver", args: [] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Uso: devolver"));
    });

    it("processes full refund", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 9001, amount: 5000 }));
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "devolver", args: ["789"] });

      const msg = spy.mock.calls[0][1];
      expect(msg).toContain("total");
      expect(msg).toContain("9001");
    });

    it("processes partial refund", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 9002, amount: 1500 }));
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "devolver", args: ["789", "1500"] });

      const msg = spy.mock.calls[0][1];
      expect(msg).toContain("parcial");
      expect(msg).toContain("1500");
    });

    it("rejects invalid refund amount", async () => {
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "devolver", args: ["789", "abc"] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("numero positivo"));
    });

    it("sends error when MP API returns 500", async () => {
      mockFetch.mockResolvedValueOnce(new Response("Internal Server Error", { status: 500 }));
      const { wa, spy } = createMockWa();
      await handleCommand(wa, "549111", { command: "devolver", args: ["789"] });
      expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Error de Mercado Pago"));
    });
  });
});

describe("createPaymentNotifier", () => {
  it("sends notification for approved payment", async () => {
    const { wa, spy } = createMockWa();
    const notifier = createPaymentNotifier(wa, "549110000");

    await notifier({
      id: 1234,
      status: "approved",
      transaction_amount: 8000,
      description: "Plan premium",
    });

    expect(spy).toHaveBeenCalledWith(
      "549110000",
      expect.stringContaining("Pago recibido")
    );
    expect(spy.mock.calls[0][1]).toContain("8000");
    expect(spy.mock.calls[0][1]).toContain("1234");
  });

  it("does not notify for non-approved payments", async () => {
    const { wa, spy } = createMockWa();
    const notifier = createPaymentNotifier(wa, "549110000");

    await notifier({ id: 1, status: "pending", transaction_amount: 100 });
    expect(spy).not.toHaveBeenCalled();
  });
});
