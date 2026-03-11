import "dotenv/config";

/**
 * Unified production server.
 *
 * Runs in a single process:
 *   - Telegram bot (polling)
 *   - WhatsApp webhook (POST /whatsapp)
 *   - Mercado Pago IPN webhook (POST /mp-webhook)
 *   - Health check (GET /health)
 *
 * Deploy this on Railway, Fly.io, Render, or any VPS.
 */

import { createServer } from "node:http";
import { startBot } from "./telegram-bot.js";
import { createWhatsAppWebhookHandler } from "./whatsapp/webhook.js";
import { createWebhookHandler } from "./webhook.js";
import { WhatsAppClient } from "./whatsapp/client.js";
import { createPaymentNotifier } from "./whatsapp/handlers.js";
import { landingHTML } from "./landing.js";
import { privacyHTML } from "./privacy.js";
import { termsHTML } from "./terms.js";
import { handleMcpSse, handleMcpMessage, handleMcpOptions, getActiveSessionCount } from "./mcp-sse.js";
import { createMcpServer } from "./mcp-server.js";
import { createMerchantStore } from "./db/merchant-store.js";
import { createTokenResolver } from "./db/token-resolver.js";
import type { MerchantStore } from "./db/merchant-store.js";

const PORT = Number(process.env.PORT) || 3000;
const MP_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "";
const MP_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

// ─── Multi-Merchant Store ────────────────────────────────
const TOKEN_ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;
const DB_PATH = process.env.DB_PATH ?? "/data/cobroya.db";

let merchantStore: MerchantStore | null = null;
if (TOKEN_ENCRYPTION_KEY) {
  try {
    const keyBuffer = Buffer.from(TOKEN_ENCRYPTION_KEY, "hex");
    if (keyBuffer.length !== 32) {
      console.error("TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes). Multi-merchant disabled.");
    } else {
      merchantStore = createMerchantStore({ dbPath: DB_PATH, encryptionKey: keyBuffer });
      console.log(`Multi-merchant store initialized (${DB_PATH})`);
    }
  } catch (err) {
    console.error("Failed to initialize merchant store:", err);
  }
}

const tokenResolver = createTokenResolver({
  store: merchantStore,
  fallbackToken: MP_TOKEN,
});

// ─── Telegram Bot ─────────────────────────────────────────
const TELEGRAM_ENABLED = !!process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_NOTIFY_CHAT_ID = process.env.TELEGRAM_NOTIFY_CHAT_ID;
let telegramBot: ReturnType<typeof startBot> | null = null;

if (TELEGRAM_ENABLED) {
  try {
    telegramBot = startBot();
  } catch (err) {
    console.error("Telegram bot failed to start:", err);
  }
}

// ─── WhatsApp Webhook ─────────────────────────────────────
const WA_ENABLED =
  !!process.env.WHATSAPP_ACCESS_TOKEN &&
  !!process.env.WHATSAPP_PHONE_NUMBER_ID &&
  !!process.env.WHATSAPP_VERIFY_TOKEN;

const WA_ALLOWED_PHONES = process.env.WHATSAPP_ALLOWED_PHONES
  ? new Set(process.env.WHATSAPP_ALLOWED_PHONES.split(",").map((p) => p.trim()))
  : undefined;

const waHandler = WA_ENABLED
  ? createWhatsAppWebhookHandler({
      waAccessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
      waPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
      mpAccessToken: MP_TOKEN,
      currency: process.env.MP_CURRENCY ?? "ARS",
      successUrl: process.env.MP_SUCCESS_URL,
      allowedPhones: WA_ALLOWED_PHONES,
      appSecret: process.env.WHATSAPP_APP_SECRET,
      tokenResolver,
      merchantStore: merchantStore ?? undefined,
    })
  : null;

// ─── MP IPN Webhook + Notifications ──────────────────────
// If WhatsApp is enabled and a notify phone is set, forward approved payments
const WA_NOTIFY_PHONE = process.env.WA_NOTIFY_PHONE;

const paymentCallbacks: Array<(payment: unknown) => Promise<void>> = [];

// WhatsApp notification
if (WA_ENABLED && WA_NOTIFY_PHONE) {
  const waClient = new WhatsAppClient({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  });
  paymentCallbacks.push(createPaymentNotifier(waClient, WA_NOTIFY_PHONE));
}

// Telegram notification
if (telegramBot && TELEGRAM_NOTIFY_CHAT_ID) {
  const chatId = Number(TELEGRAM_NOTIFY_CHAT_ID);
  paymentCallbacks.push(async (payment: unknown) => {
    const p = payment as { id: number; status: string; transaction_amount: number; description?: string };
    if (p.status !== "approved") return;
    await telegramBot!.sendMessage(
      chatId,
      `Pago recibido\nMonto: $${p.transaction_amount}\nID: ${p.id}` +
        (p.description ? `\nDescripcion: ${p.description}` : "")
    );
  });
}

// Console log (always)
paymentCallbacks.push(async (payment: unknown) => {
  const p = payment as { id: number; status: string; transaction_amount: number };
  console.log(`[PAYMENT] #${p.id} — ${p.status} — $${p.transaction_amount}`);
});

const mpWebhookHandler = MP_TOKEN
  ? createWebhookHandler({
      accessToken: MP_TOKEN,
      secret: MP_WEBHOOK_SECRET,
      onPayment: async (payment) => {
        await Promise.allSettled(paymentCallbacks.map((cb) => cb(payment)));
      },
    })
  : null;

// ─── MCP SSE (Hosted Endpoint) ───────────────────────────
const MCP_SSE_ENABLED = !!MP_TOKEN;
const mcpServerInstance = MCP_SSE_ENABLED ? createMcpServer(MP_TOKEN) : null;

// ─── HTTP Server ──────────────────────────────────────────
const MAX_BODY_SIZE = 1024 * 1024; // 1 MB

class PayloadTooLargeError extends Error {
  constructor() {
    super("Payload Too Large");
    this.name = "PayloadTooLargeError";
  }
}

function flattenHeaders(raw: import("node:http").IncomingHttpHeaders): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    out[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  return out;
}

async function nodeToWebRequest(
  req: import("node:http").IncomingMessage,
  url: URL
): Promise<Request> {
  const body = await new Promise<string>((resolve, reject) => {
    let data = "";
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_SIZE) {
        reject(new PayloadTooLargeError());
        return;
      }
      data += chunk.toString();
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  return new Request(url.toString(), {
    method: req.method,
    headers: flattenHeaders(req.headers),
    body: req.method === "GET" ? undefined : body,
  });
}

async function webToNodeResponse(
  webRes: Response,
  res: import("node:http").ServerResponse
) {
  const text = await webRes.text();
  res.writeHead(webRes.status).end(text);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const path = url.pathname;

  // OG Image (SVG)
  if (path === "/og.svg") {
    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#09090b"/>
      <rect x="0" y="0" width="1200" height="4" fill="url(#g)"/>
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs>
      <text x="100" y="200" font-family="system-ui,sans-serif" font-size="72" font-weight="800" fill="#fafafa">CobroYa</text>
      <text x="100" y="300" font-family="system-ui,sans-serif" font-size="42" fill="#a1a1aa">Cobra con Mercado Pago</text>
      <text x="100" y="360" font-family="system-ui,sans-serif" font-size="42" fill="#a1a1aa">en 10 segundos</text>
      <text x="100" y="460" font-family="system-ui,sans-serif" font-size="28" fill="#3b82f6">Telegram</text>
      <text x="310" y="460" font-family="system-ui,sans-serif" font-size="28" fill="#27272a">|</text>
      <text x="350" y="460" font-family="system-ui,sans-serif" font-size="28" fill="#22c55e">WhatsApp</text>
      <text x="590" y="460" font-family="system-ui,sans-serif" font-size="28" fill="#27272a">|</text>
      <text x="630" y="460" font-family="system-ui,sans-serif" font-size="28" fill="#8b5cf6">AI Agents</text>
      <text x="100" y="550" font-family="system-ui,sans-serif" font-size="22" fill="#52525b">cobroya.app</text>
    </svg>`;
    res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" });
    res.end(svg);
    return;
  }

  // Landing page
  if (path === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(landingHTML);
    return;
  }

  // Privacy policy
  if (path === "/privacy") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(privacyHTML);
    return;
  }

  // Terms of service
  if (path === "/terms") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(termsHTML);
    return;
  }

  // Health check
  if (path === "/health") {
    const status = {
      ok: true,
      telegram: TELEGRAM_ENABLED,
      whatsapp: WA_ENABLED,
      multi_merchant: !!merchantStore,
      mp_webhook: !!mpWebhookHandler,
      mcp_sse: MCP_SSE_ENABLED,
      mcp_sessions: getActiveSessionCount(),
      uptime: process.uptime(),
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(status));
    return;
  }

  // MCP SSE — hosted MCP endpoint
  if (path === "/mcp/sse" && req.method === "GET" && mcpServerInstance) {
    await handleMcpSse(req, res, mcpServerInstance);
    return;
  }
  if (path === "/mcp/message" && req.method === "POST" && MCP_SSE_ENABLED) {
    await handleMcpMessage(req, res);
    return;
  }
  if (path.startsWith("/mcp/") && req.method === "OPTIONS") {
    handleMcpOptions(req, res);
    return;
  }

  // WhatsApp webhook
  if (path.startsWith("/whatsapp") && waHandler) {
    let webReq: Request;
    try {
      webReq = await nodeToWebRequest(req, url);
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        res.writeHead(413).end("Payload Too Large");
        return;
      }
      throw err;
    }
    const webRes = await waHandler(webReq);
    await webToNodeResponse(webRes, res);
    return;
  }

  // Mercado Pago IPN webhook
  if (path.startsWith("/mp-webhook") && mpWebhookHandler) {
    let webReq: Request;
    try {
      webReq = await nodeToWebRequest(req, url);
    } catch (err) {
      if (err instanceof PayloadTooLargeError) {
        res.writeHead(413).end("Payload Too Large");
        return;
      }
      throw err;
    }
    const webRes = await mpWebhookHandler(webReq);
    await webToNodeResponse(webRes, res);
    return;
  }

  res.writeHead(404).end("Not Found");
});

server.listen(PORT, () => {
  console.log(`\n=== mercadopago-tool server ===`);
  console.log(`Port: ${PORT}`);
  console.log(`Telegram: ${TELEGRAM_ENABLED ? "ON" : "OFF"}`);
  console.log(`WhatsApp: ${WA_ENABLED ? "ON" : "OFF"}`);
  console.log(`Multi-Merchant: ${merchantStore ? "ON" : "OFF"}`);
  console.log(`MP Webhook: ${mpWebhookHandler ? "ON" : "OFF"}`);
  console.log(`MCP SSE: ${MCP_SSE_ENABLED ? "ON" : "OFF"}`);
  if (WA_NOTIFY_PHONE) console.log(`WA Notifications: ${WA_NOTIFY_PHONE}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`================================\n`);
});

// Graceful shutdown
function shutdown() {
  if (merchantStore) {
    merchantStore.close();
  }
  server.close();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
