import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Shared mock state ───────────────────────────────────────
let serverHandler: (req: any, res: any) => Promise<void>;
let listenCallback: () => void;

const mockServer = {
  listen: vi.fn((_port: number, cb: () => void) => {
    listenCallback = cb;
    return mockServer;
  }),
};

const mockStartBot = vi.fn();
const mockCreateWhatsAppWebhookHandler = vi.fn();
const mockCreateWebhookHandler = vi.fn();
const mockWhatsAppClientConstructor = vi.fn();
const mockCreatePaymentNotifier = vi.fn();
const mockSendMessage = vi.fn();

// ─── Module mocks (hoisted) ─────────────────────────────────
vi.mock("dotenv/config", () => ({}));

vi.mock("node:http", () => ({
  createServer: vi.fn((handler: any) => {
    serverHandler = handler;
    return mockServer;
  }),
}));

vi.mock("../src/telegram-bot.js", () => ({
  startBot: (...args: any[]) => mockStartBot(...args),
}));

vi.mock("../src/whatsapp/webhook.js", () => ({
  createWhatsAppWebhookHandler: (...args: any[]) =>
    mockCreateWhatsAppWebhookHandler(...args),
}));

vi.mock("../src/webhook.js", () => ({
  createWebhookHandler: (...args: any[]) => mockCreateWebhookHandler(...args),
}));

vi.mock("../src/whatsapp/client.js", () => ({
  WhatsAppClient: class {
    constructor(...args: any[]) {
      mockWhatsAppClientConstructor(...args);
    }
  },
}));

vi.mock("../src/whatsapp/handlers.js", () => ({
  createPaymentNotifier: (...args: any[]) => mockCreatePaymentNotifier(...args),
}));

vi.mock("../src/landing.js", () => ({
  landingHTML: "<html>MOCK LANDING</html>",
}));

// ─── Helpers ─────────────────────────────────────────────────
function mockReq(method: string, url: string, body?: string) {
  const events: Record<string, Function[]> = {};
  const req: any = {
    method,
    url,
    headers: { "content-type": "application/json" },
    on(event: string, handler: Function) {
      if (!events[event]) events[event] = [];
      events[event].push(handler);
      if (event === "end") {
        setTimeout(() => {
          if (body && events["data"]) {
            events["data"].forEach((h) => h(Buffer.from(body)));
          }
          events["end"]?.forEach((h) => h());
        }, 0);
      }
      return req;
    },
  };
  return req;
}

function mockReqWithError(method: string, url: string) {
  const events: Record<string, Function[]> = {};
  const req: any = {
    method,
    url,
    headers: {},
    on(event: string, handler: Function) {
      if (!events[event]) events[event] = [];
      events[event].push(handler);
      if (event === "error") {
        setTimeout(() => {
          events["error"]?.forEach((h) => h(new Error("stream error")));
        }, 0);
      }
      return req;
    },
  };
  return req;
}

function mockRes() {
  const res: any = {
    writeHead: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
  return res;
}

// ─── Tests ───────────────────────────────────────────────────

describe("server.ts — minimal config (no optional features)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockWhatsAppClientConstructor.mockReset();
    mockCreatePaymentNotifier.mockReset();
    mockSendMessage.mockReset();
    mockServer.listen.mockClear();

    // Minimal env: no optional features enabled
    vi.stubEnv("PORT", "4000");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "");
    vi.stubEnv("WA_NOTIFY_PHONE", "");
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates server and listens on PORT", async () => {
    await import("../src/server.js");

    expect(mockServer.listen).toHaveBeenCalledWith(4000, expect.any(Function));
  });

  it("listen callback logs startup info", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await import("../src/server.js");

    listenCallback();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("mercadopago-tool server")
    );
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Port: 4000"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Telegram: OFF"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("WhatsApp: OFF"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("MP Webhook: OFF"));
  });

  it("does not start telegram bot when TELEGRAM_BOT_TOKEN is empty", async () => {
    await import("../src/server.js");
    expect(mockStartBot).not.toHaveBeenCalled();
  });

  it("does not create WhatsApp handler when WA env vars are missing", async () => {
    await import("../src/server.js");
    expect(mockCreateWhatsAppWebhookHandler).not.toHaveBeenCalled();
  });

  it("does not create MP webhook handler when MP_TOKEN is empty", async () => {
    await import("../src/server.js");
    expect(mockCreateWebhookHandler).not.toHaveBeenCalled();
  });

  describe("HTTP routes (minimal config)", () => {
    beforeEach(async () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      await import("../src/server.js");
    });

    it("GET / returns landing HTML", async () => {
      const req = mockReq("GET", "/");
      const res = mockRes();
      await serverHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(200, {
        "Content-Type": "text/html; charset=utf-8",
      });
      expect(res.end).toHaveBeenCalledWith("<html>MOCK LANDING</html>");
    });

    it("GET /health returns JSON status", async () => {
      const req = mockReq("GET", "/health");
      const res = mockRes();
      await serverHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(200, {
        "Content-Type": "application/json",
      });
      const body = JSON.parse(res.end.mock.calls[0][0]);
      expect(body).toMatchObject({
        ok: true,
        telegram: false,
        whatsapp: false,
        mp_webhook: false,
      });
      expect(typeof body.uptime).toBe("number");
    });

    it("GET /og.svg returns SVG with caching headers", async () => {
      const req = mockReq("GET", "/og.svg");
      const res = mockRes();
      await serverHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(200, {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      });
      const svgContent = res.end.mock.calls[0][0];
      expect(svgContent).toContain("<svg");
      expect(svgContent).toContain("CobroYa");
    });

    it("GET /unknown returns 404", async () => {
      const req = mockReq("GET", "/unknown");
      const res = mockRes();
      await serverHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(404);
      expect(res.end).toHaveBeenCalledWith("Not Found");
    });

    it("GET /whatsapp without waHandler returns 404", async () => {
      const req = mockReq("GET", "/whatsapp");
      const res = mockRes();
      await serverHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(404);
      expect(res.end).toHaveBeenCalledWith("Not Found");
    });

    it("POST /mp-webhook without mpWebhookHandler returns 404", async () => {
      const req = mockReq("POST", "/mp-webhook", '{"type":"payment"}');
      const res = mockRes();
      await serverHandler(req, res);

      expect(res.writeHead).toHaveBeenCalledWith(404);
      expect(res.end).toHaveBeenCalledWith("Not Found");
    });

    it("handles request with null url (defaults to /)", async () => {
      const req = mockReq("GET", undefined as any);
      const res = mockRes();
      await serverHandler(req, res);

      // Should default to "/" and serve landing page
      expect(res.writeHead).toHaveBeenCalledWith(200, {
        "Content-Type": "text/html; charset=utf-8",
      });
    });

    it("console payment callback logs payment info", async () => {
      // The console callback is always pushed. We need to trigger it via
      // the onPayment callback captured by createWebhookHandler.
      // Since MP_TOKEN is empty in this config, we test the console callback
      // by re-importing with MP_TOKEN set.
    });
  });
});

describe("server.ts — full config (all features enabled)", () => {
  let capturedOnPayment: (payment: unknown) => Promise<void>;
  const mockWaHandler = vi.fn();
  const mockMpHandler = vi.fn();
  const mockWaNotifier = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockWhatsAppClientConstructor.mockReset();
    mockCreatePaymentNotifier.mockReset();
    mockSendMessage.mockReset();
    mockServer.listen.mockClear();
    mockWaHandler.mockReset();
    mockMpHandler.mockReset();
    mockWaNotifier.mockReset();

    vi.stubEnv("PORT", "5000");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "TEST_MP_TOKEN");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "test_secret");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "test-telegram-token");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "12345");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "wa-token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "wa-phone-id");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "wa-verify");
    vi.stubEnv("WA_NOTIFY_PHONE", "+5491155551234");
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "+5491100001111, +5491100002222");
    vi.stubEnv("MP_CURRENCY", "USD");
    vi.stubEnv("MP_SUCCESS_URL", "https://example.com/success");

    mockStartBot.mockReturnValue({ sendMessage: mockSendMessage });
    mockCreateWhatsAppWebhookHandler.mockReturnValue(mockWaHandler);
    mockCreateWebhookHandler.mockImplementation((opts: any) => {
      capturedOnPayment = opts.onPayment;
      return mockMpHandler;
    });
    mockCreatePaymentNotifier.mockReturnValue(mockWaNotifier);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("starts telegram bot when token is set", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    await import("../src/server.js");
    expect(mockStartBot).toHaveBeenCalled();
  });

  it("creates WhatsApp webhook handler with correct config", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    await import("../src/server.js");

    expect(mockCreateWhatsAppWebhookHandler).toHaveBeenCalledWith({
      waAccessToken: "wa-token",
      waPhoneNumberId: "wa-phone-id",
      verifyToken: "wa-verify",
      mpAccessToken: "TEST_MP_TOKEN",
      currency: "USD",
      successUrl: "https://example.com/success",
      allowedPhones: new Set(["+5491100001111", "+5491100002222"]),
    });
  });

  it("creates MP webhook handler with access token and secret", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    await import("../src/server.js");

    expect(mockCreateWebhookHandler).toHaveBeenCalledWith({
      accessToken: "TEST_MP_TOKEN",
      secret: "test_secret",
      onPayment: expect.any(Function),
    });
  });

  it("creates WhatsAppClient for payment notifications", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    await import("../src/server.js");

    expect(mockWhatsAppClientConstructor).toHaveBeenCalledWith({
      accessToken: "wa-token",
      phoneNumberId: "wa-phone-id",
    });
    expect(mockCreatePaymentNotifier).toHaveBeenCalledWith(
      expect.any(Object),
      "+5491155551234"
    );
  });

  it("listen callback logs all features as ON", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await import("../src/server.js");

    listenCallback();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Port: 5000"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("Telegram: ON"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("WhatsApp: ON"));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("MP Webhook: ON"));
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("WA Notifications: +5491155551234")
    );
  });

  it("GET /health shows all features enabled", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    await import("../src/server.js");

    const req = mockReq("GET", "/health");
    const res = mockRes();
    await serverHandler(req, res);

    const body = JSON.parse(res.end.mock.calls[0][0]);
    expect(body).toMatchObject({
      ok: true,
      telegram: true,
      whatsapp: true,
      mp_webhook: true,
    });
  });

  describe("WhatsApp webhook route", () => {
    beforeEach(async () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      await import("../src/server.js");
    });

    it("GET /whatsapp delegates to waHandler", async () => {
      mockWaHandler.mockResolvedValue(new Response("OK", { status: 200 }));

      const req = mockReq("GET", "/whatsapp?hub.mode=subscribe&hub.verify_token=wa-verify&hub.challenge=test123");
      const res = mockRes();
      await serverHandler(req, res);

      expect(mockWaHandler).toHaveBeenCalledWith(expect.any(Request));
      expect(res.writeHead).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalledWith("OK");
    });

    it("POST /whatsapp delegates to waHandler", async () => {
      mockWaHandler.mockResolvedValue(new Response("accepted", { status: 200 }));

      const req = mockReq("POST", "/whatsapp", '{"entry":[]}');
      const res = mockRes();
      await serverHandler(req, res);

      expect(mockWaHandler).toHaveBeenCalled();
      expect(res.writeHead).toHaveBeenCalledWith(200);
    });

    it("/whatsapp/subpath also delegates to waHandler", async () => {
      mockWaHandler.mockResolvedValue(new Response("ok", { status: 200 }));

      const req = mockReq("GET", "/whatsapp/subpath");
      const res = mockRes();
      await serverHandler(req, res);

      expect(mockWaHandler).toHaveBeenCalled();
    });
  });

  describe("MP webhook route", () => {
    beforeEach(async () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      await import("../src/server.js");
    });

    it("POST /mp-webhook delegates to mpWebhookHandler", async () => {
      mockMpHandler.mockResolvedValue(new Response("ok", { status: 200 }));

      const req = mockReq("POST", "/mp-webhook", '{"type":"payment","data":{"id":"123"}}');
      const res = mockRes();
      await serverHandler(req, res);

      expect(mockMpHandler).toHaveBeenCalledWith(expect.any(Request));
      expect(res.writeHead).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalledWith("ok");
    });

    it("/mp-webhook/subpath also delegates to mpWebhookHandler", async () => {
      mockMpHandler.mockResolvedValue(new Response("ok", { status: 200 }));

      const req = mockReq("POST", "/mp-webhook/extra", '{}');
      const res = mockRes();
      await serverHandler(req, res);

      expect(mockMpHandler).toHaveBeenCalled();
    });
  });

  describe("payment callbacks (onPayment)", () => {
    beforeEach(async () => {
      vi.spyOn(console, "log").mockImplementation(() => {});
      mockWaNotifier.mockResolvedValue(undefined);
      mockSendMessage.mockResolvedValue(undefined);
      await import("../src/server.js");
    });

    it("calls all payment callbacks via Promise.allSettled", async () => {
      const payment = {
        id: 999,
        status: "approved",
        transaction_amount: 1500,
        description: "Test product",
      };

      await capturedOnPayment(payment);

      // WhatsApp notifier should have been called
      expect(mockWaNotifier).toHaveBeenCalledWith(payment);

      // Telegram sendMessage should have been called (approved payment)
      expect(mockSendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining("Pago recibido")
      );
      expect(mockSendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining("$1500")
      );
      expect(mockSendMessage).toHaveBeenCalledWith(
        12345,
        expect.stringContaining("Descripcion: Test product")
      );
    });

    it("telegram callback skips non-approved payments", async () => {
      const payment = {
        id: 888,
        status: "pending",
        transaction_amount: 500,
      };

      await capturedOnPayment(payment);

      // Telegram should NOT send message for non-approved
      expect(mockSendMessage).not.toHaveBeenCalled();
      // But WA notifier and console log are still called
      expect(mockWaNotifier).toHaveBeenCalledWith(payment);
    });

    it("telegram callback works without description", async () => {
      const payment = {
        id: 777,
        status: "approved",
        transaction_amount: 200,
      };

      await capturedOnPayment(payment);

      expect(mockSendMessage).toHaveBeenCalledWith(
        12345,
        expect.not.stringContaining("Descripcion")
      );
    });

    it("console callback logs payment info", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const payment = {
        id: 555,
        status: "approved",
        transaction_amount: 300,
      };

      await capturedOnPayment(payment);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[PAYMENT] #555")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("approved")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("$300")
      );
    });

    it("handles callback failures gracefully via allSettled", async () => {
      mockWaNotifier.mockRejectedValue(new Error("WA send failed"));
      mockSendMessage.mockRejectedValue(new Error("TG send failed"));

      const payment = {
        id: 444,
        status: "approved",
        transaction_amount: 100,
      };

      // Should not throw even though callbacks fail
      await expect(capturedOnPayment(payment)).resolves.toBeUndefined();
    });
  });
});

describe("server.ts — telegram bot failure", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockServer.listen.mockClear();

    vi.stubEnv("PORT", "3000");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "bad-token");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "");
    vi.stubEnv("WA_NOTIFY_PHONE", "");
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("catches telegram bot startup error and logs it", async () => {
    const error = new Error("Bot init failed");
    mockStartBot.mockImplementation(() => {
      throw error;
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/server.js");

    expect(mockStartBot).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "Telegram bot failed to start:",
      error
    );
  });
});

describe("server.ts — default PORT", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockServer.listen.mockClear();

    // Do not set PORT so the default 3000 is used
    vi.stubEnv("PORT", "");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "");
    vi.stubEnv("WA_NOTIFY_PHONE", "");
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("defaults to port 3000 when PORT env is not set", async () => {
    // Empty string PORT -> Number("") is 0, but the code uses ?? so empty string is truthy
    // Actually Number("") === 0, and the code does Number(process.env.PORT ?? 3000)
    // Since we stubbed PORT="" and "" is truthy, Number("") = NaN...
    // Let's delete PORT instead
    delete process.env.PORT;
    vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/server.js");

    expect(mockServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  });
});

describe("server.ts — WA_ALLOWED_PHONES not set", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockServer.listen.mockClear();

    vi.stubEnv("PORT", "3000");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "token");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "wa-token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "wa-phone");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "wa-verify");
    vi.stubEnv("WA_NOTIFY_PHONE", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes undefined allowedPhones when WHATSAPP_ALLOWED_PHONES is not set", async () => {
    delete process.env.WHATSAPP_ALLOWED_PHONES;
    vi.spyOn(console, "log").mockImplementation(() => {});
    mockCreateWhatsAppWebhookHandler.mockReturnValue(vi.fn());
    mockCreateWebhookHandler.mockImplementation((opts: any) => vi.fn());

    await import("../src/server.js");

    expect(mockCreateWhatsAppWebhookHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        allowedPhones: undefined,
      })
    );
  });

  it("uses default currency ARS when MP_CURRENCY is not set", async () => {
    delete process.env.WHATSAPP_ALLOWED_PHONES;
    delete process.env.MP_CURRENCY;
    delete process.env.MP_SUCCESS_URL;
    vi.spyOn(console, "log").mockImplementation(() => {});
    mockCreateWhatsAppWebhookHandler.mockReturnValue(vi.fn());
    mockCreateWebhookHandler.mockImplementation((opts: any) => vi.fn());

    await import("../src/server.js");

    expect(mockCreateWhatsAppWebhookHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: "ARS",
      })
    );
  });
});

describe("server.ts — nodeToWebRequest error path", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockServer.listen.mockClear();

    vi.stubEnv("PORT", "3000");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "token");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "wa-token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "wa-phone");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "wa-verify");
    vi.stubEnv("WA_NOTIFY_PHONE", "");
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects when request stream emits an error", async () => {
    const mockWaFn = vi.fn();
    mockCreateWhatsAppWebhookHandler.mockReturnValue(mockWaFn);
    mockCreateWebhookHandler.mockImplementation((opts: any) => vi.fn());
    vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/server.js");

    const req = mockReqWithError("POST", "/whatsapp");
    const res = mockRes();

    await expect(serverHandler(req, res)).rejects.toThrow("stream error");
  });
});

describe("server.ts — telegram enabled without notify chat id", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockServer.listen.mockClear();
    mockSendMessage.mockReset();

    vi.stubEnv("PORT", "3000");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "token");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "tg-token");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", ""); // No chat ID
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "");
    vi.stubEnv("WA_NOTIFY_PHONE", "");
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("starts telegram bot but does not add telegram payment callback", async () => {
    let capturedOnPayment: (payment: unknown) => Promise<void>;
    mockStartBot.mockReturnValue({ sendMessage: mockSendMessage });
    mockCreateWebhookHandler.mockImplementation((opts: any) => {
      capturedOnPayment = opts.onPayment;
      return vi.fn();
    });
    vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/server.js");

    expect(mockStartBot).toHaveBeenCalled();

    // Trigger onPayment - should only run console callback, not telegram
    const payment = { id: 1, status: "approved", transaction_amount: 100 };
    await capturedOnPayment!(payment);

    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});

describe("server.ts — WA enabled without WA_NOTIFY_PHONE", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockWhatsAppClientConstructor.mockReset();
    mockCreatePaymentNotifier.mockReset();
    mockServer.listen.mockClear();

    vi.stubEnv("PORT", "3000");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "token");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "wa-token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "wa-phone");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "wa-verify");
    vi.stubEnv("WA_NOTIFY_PHONE", ""); // No notify phone
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not create WhatsApp payment notifier when WA_NOTIFY_PHONE is empty", async () => {
    mockCreateWhatsAppWebhookHandler.mockReturnValue(vi.fn());
    mockCreateWebhookHandler.mockImplementation((opts: any) => vi.fn());
    vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/server.js");

    expect(mockCreateWhatsAppWebhookHandler).toHaveBeenCalled();
    expect(mockWhatsAppClientConstructor).not.toHaveBeenCalled();
    expect(mockCreatePaymentNotifier).not.toHaveBeenCalled();
  });
});

describe("server.ts — listen callback without WA_NOTIFY_PHONE", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockServer.listen.mockClear();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();

    vi.stubEnv("PORT", "3000");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "");
    vi.stubEnv("WA_NOTIFY_PHONE", "");
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not log WA Notifications line when WA_NOTIFY_PHONE is not set", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/server.js");
    listenCallback();

    const allCalls = consoleSpy.mock.calls.map((c) => c[0]);
    expect(allCalls.some((msg: string) => msg.includes("WA Notifications"))).toBe(false);
  });
});

describe("server.ts — PORT NaN fallback", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockServer.listen.mockClear();

    vi.stubEnv("PORT", "abc");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "");
    vi.stubEnv("WA_NOTIFY_PHONE", "");
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to port 3000 when PORT is non-numeric", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    await import("../src/server.js");

    expect(mockServer.listen).toHaveBeenCalledWith(3000, expect.any(Function));
  });
});

describe("server.ts — body size limit (413)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockServer.listen.mockClear();

    vi.stubEnv("PORT", "3000");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "token");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "wa-token");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "wa-phone");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "wa-verify");
    vi.stubEnv("WA_NOTIFY_PHONE", "");
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns 413 when request body exceeds 1MB", async () => {
    mockCreateWhatsAppWebhookHandler.mockReturnValue(vi.fn());
    mockCreateWebhookHandler.mockImplementation((opts: any) => vi.fn());
    vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/server.js");

    // Create a body larger than 1MB
    const largeBody = "x".repeat(1024 * 1024 + 1);
    const req = mockReq("POST", "/whatsapp", largeBody);
    const res = mockRes();
    await serverHandler(req, res);

    expect(res.writeHead).toHaveBeenCalledWith(413);
    expect(res.end).toHaveBeenCalledWith("Payload Too Large");
  });
});

describe("server.ts — nodeToWebRequest builds correct Request objects", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    mockStartBot.mockReset();
    mockCreateWhatsAppWebhookHandler.mockReset();
    mockCreateWebhookHandler.mockReset();
    mockServer.listen.mockClear();

    vi.stubEnv("PORT", "3000");
    vi.stubEnv("MERCADO_PAGO_ACCESS_TOKEN", "token");
    vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
    vi.stubEnv("TELEGRAM_NOTIFY_CHAT_ID", "");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "");
    vi.stubEnv("WHATSAPP_VERIFY_TOKEN", "");
    vi.stubEnv("WA_NOTIFY_PHONE", "");
    vi.stubEnv("WHATSAPP_ALLOWED_PHONES", "");
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("MP_CURRENCY", "");
    vi.stubEnv("MP_SUCCESS_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("POST request includes body in the web Request", async () => {
    let capturedRequest: Request | null = null;
    const mockMpFn = vi.fn(async (req: Request) => {
      capturedRequest = req;
      return new Response("ok", { status: 200 });
    });
    mockCreateWebhookHandler.mockImplementation((opts: any) => mockMpFn);
    vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/server.js");

    const req = mockReq("POST", "/mp-webhook", '{"type":"payment"}');
    const res = mockRes();
    await serverHandler(req, res);

    expect(capturedRequest).not.toBeNull();
    expect(capturedRequest!.method).toBe("POST");
    const body = await capturedRequest!.text();
    expect(body).toBe('{"type":"payment"}');
  });

  it("GET request has no body in the web Request", async () => {
    let capturedRequest: Request | null = null;
    const mockMpFn = vi.fn(async (req: Request) => {
      capturedRequest = req;
      return new Response("ok", { status: 200 });
    });
    mockCreateWebhookHandler.mockImplementation((opts: any) => mockMpFn);
    vi.spyOn(console, "log").mockImplementation(() => {});

    await import("../src/server.js");

    const req = mockReq("GET", "/mp-webhook?topic=payment&id=123");
    const res = mockRes();
    await serverHandler(req, res);

    expect(capturedRequest).not.toBeNull();
    expect(capturedRequest!.method).toBe("GET");
    expect(capturedRequest!.body).toBeNull();
  });
});
