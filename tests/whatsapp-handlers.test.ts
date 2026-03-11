import { describe, it, expect, vi, beforeEach } from "vitest";
import { WhatsAppClient } from "../src/whatsapp/client.js";
import { createCommandHandlers, createPaymentNotifier } from "../src/whatsapp/handlers.js";
import type { ParsedCommand } from "../src/whatsapp/message-parser.js";
import type { MerchantStore } from "../src/db/merchant-store.js";
import type { TokenResolver } from "../src/db/token-resolver.js";

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

// --- Multi-merchant tests ---

function mockMerchantStore(tokens: Record<string, { token: string; name: string }> = {}): MerchantStore {
  const data = new Map(Object.entries(tokens));
  return {
    getToken: (phone: string) => data.get(phone)?.token ?? null,
    getMerchant: (phone: string) => {
      const d = data.get(phone);
      if (!d) return null;
      return { phone, merchantName: d.name, createdAt: "", updatedAt: "" };
    },
    setToken: (phone: string, token: string, name: string) => {
      data.set(phone, { token, name });
    },
    removeToken: (phone: string) => data.delete(phone),
    hasToken: (phone: string) => data.has(phone),
    listMerchants: () => [],
    getRawEncryptedToken: () => null,
    close: () => {},
  };
}

function mockResolver(tokens: Record<string, string>, fallback = ""): TokenResolver {
  return {
    resolve: (phone: string) => tokens[phone] ?? (fallback || null),
  };
}

describe("configurar command", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("sends usage when no args", async () => {
    const store = mockMerchantStore();
    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "",
      currency: "ARS",
      merchantStore: store,
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549111", { command: "configurar", args: [] });
    expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Uso: configurar"));
  });

  it("validates token by calling /users/me and stores on success", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      first_name: "Maria",
      last_name: "Lopez",
    }));

    const store = mockMerchantStore();
    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "",
      currency: "ARS",
      merchantStore: store,
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549111", { command: "configurar", args: ["APP_USR-valid-token"] });

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.mercadopago.com/users/me",
      expect.anything()
    );
    expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Maria Lopez"));
    expect(store.getToken("549111")).toBe("APP_USR-valid-token");
  });

  it("rejects invalid token (API returns 401)", async () => {
    mockFetch.mockResolvedValueOnce(new Response("Unauthorized", { status: 401 }));

    const store = mockMerchantStore();
    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "",
      currency: "ARS",
      merchantStore: store,
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549111", { command: "configurar", args: ["bad-token"] });

    expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Token invalido"));
    expect(store.getToken("549111")).toBeNull();
  });

  it("sends not available when merchantStore is not configured", async () => {
    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "MP_TOKEN",
      currency: "ARS",
      // no merchantStore
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549111", { command: "configurar", args: ["some-token"] });
    expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("no esta disponible"));
  });
});

describe("onboarding (no token)", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("sends onboarding for cobrar when no token resolved", async () => {
    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "",
      currency: "ARS",
      tokenResolver: mockResolver({}),
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549111", { command: "cobrar", args: ["5000", "test"] });
    expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("configurar"));
  });

  it("sends onboarding for pagos when no token resolved", async () => {
    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "",
      currency: "ARS",
      tokenResolver: mockResolver({}),
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549111", { command: "pagos", args: [] });
    expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("configurar"));
  });

  it("sends onboarding for estado when no token resolved", async () => {
    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "",
      currency: "ARS",
      tokenResolver: mockResolver({}),
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549111", { command: "estado", args: ["123"] });
    expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("configurar"));
  });

  it("sends onboarding for devolver when no token resolved", async () => {
    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "",
      currency: "ARS",
      tokenResolver: mockResolver({}),
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549111", { command: "devolver", args: ["123"] });
    expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("configurar"));
  });

  it("ayuda always works even without token", async () => {
    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "",
      currency: "ARS",
      tokenResolver: mockResolver({}),
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549111", { command: "ayuda", args: [] });
    expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("Comandos disponibles"));
  });
});

describe("per-merchant token resolution", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("uses merchant-specific token for cobrar", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      id: "pref_merchant",
      init_point: "https://mp.com/checkout/pref_merchant",
    }));

    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "GLOBAL_TOKEN",
      currency: "ARS",
      tokenResolver: mockResolver({ "549222": "MERCHANT_TOKEN" }, "GLOBAL_TOKEN"),
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549222", { command: "cobrar", args: ["1000", "mi producto"] });

    // Verify the fetch was called with the merchant token (in Authorization header)
    const fetchCall = mockFetch.mock.calls[0];
    const headers = fetchCall[1].headers;
    expect(headers.Authorization).toBe("Bearer MERCHANT_TOKEN");
    expect(spy).toHaveBeenCalledWith("549222", expect.stringContaining("pref_merchant"));
  });

  it("uses fallback token when merchant has no registered token", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({
      id: "pref_fallback",
      init_point: "https://mp.com/checkout/pref_fallback",
    }));

    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "GLOBAL_TOKEN",
      currency: "ARS",
      tokenResolver: mockResolver({}, "GLOBAL_TOKEN"),
    });
    const { wa } = createMockWa();
    await handleCommand(wa, "549333", { command: "cobrar", args: ["2000", "servicio"] });

    const fetchCall = mockFetch.mock.calls[0];
    const headers = fetchCall[1].headers;
    expect(headers.Authorization).toBe("Bearer GLOBAL_TOKEN");
  });

  it("help text includes configurar command", async () => {
    const { handleCommand } = createCommandHandlers({
      mpAccessToken: "MP_TOKEN",
      currency: "ARS",
    });
    const { wa, spy } = createMockWa();
    await handleCommand(wa, "549111", { command: "ayuda", args: [] });
    expect(spy).toHaveBeenCalledWith("549111", expect.stringContaining("configurar"));
  });
});
