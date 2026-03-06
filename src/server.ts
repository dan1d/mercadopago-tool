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

const PORT = Number(process.env.PORT ?? 3000);
const MP_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN ?? "";
const MP_WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

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

// ─── HTTP Server ──────────────────────────────────────────
async function nodeToWebRequest(
  req: import("node:http").IncomingMessage,
  url: URL
): Promise<Request> {
  const body = await new Promise<string>((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => {
      data += chunk.toString();
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });

  return new Request(url.toString(), {
    method: req.method,
    headers: req.headers as Record<string, string>,
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

  // Health check
  if (path === "/health" || path === "/") {
    const status = {
      ok: true,
      telegram: TELEGRAM_ENABLED,
      whatsapp: WA_ENABLED,
      mp_webhook: !!mpWebhookHandler,
      uptime: process.uptime(),
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(status));
    return;
  }

  // WhatsApp webhook
  if (path.startsWith("/whatsapp") && waHandler) {
    const webReq = await nodeToWebRequest(req, url);
    const webRes = await waHandler(webReq);
    await webToNodeResponse(webRes, res);
    return;
  }

  // Mercado Pago IPN webhook
  if (path.startsWith("/mp-webhook") && mpWebhookHandler) {
    const webReq = await nodeToWebRequest(req, url);
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
  console.log(`MP Webhook: ${mpWebhookHandler ? "ON" : "OFF"}`);
  if (WA_NOTIFY_PHONE) console.log(`WA Notifications: ${WA_NOTIFY_PHONE}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`================================\n`);
});
