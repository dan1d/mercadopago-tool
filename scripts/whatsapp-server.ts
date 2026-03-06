/**
 * Minimal HTTP server to run the WhatsApp webhook locally.
 *
 * Usage:
 *   MERCADO_PAGO_ACCESS_TOKEN=... WHATSAPP_ACCESS_TOKEN=... WHATSAPP_PHONE_NUMBER_ID=... WHATSAPP_VERIFY_TOKEN=... npx tsx scripts/whatsapp-server.ts
 *
 * Then configure Meta to send webhooks to:
 *   https://your-domain.com/webhook (use ngrok for local dev)
 */

import { createServer } from "node:http";
import { createWhatsAppWebhookHandler } from "../src/whatsapp/webhook.js";

const PORT = Number(process.env.PORT ?? 3000);

const required = ["MERCADO_PAGO_ACCESS_TOKEN", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN"] as const;
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing env var: ${key}`);
    process.exit(1);
  }
}

const handler = createWhatsAppWebhookHandler({
  waAccessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
  waPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID!,
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN!,
  mpAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  currency: process.env.MP_CURRENCY ?? "ARS",
  successUrl: process.env.MP_SUCCESS_URL,
});

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (!url.pathname.startsWith("/webhook")) {
    res.writeHead(404).end("Not Found");
    return;
  }

  // Convert Node.js IncomingMessage → Web Request
  const body = await new Promise<string>((resolve) => {
    let data = "";
    req.on("data", (chunk: Buffer) => { data += chunk.toString(); });
    req.on("end", () => resolve(data));
  });

  const webRequest = new Request(url.toString(), {
    method: req.method,
    headers: req.headers as Record<string, string>,
    body: req.method === "GET" ? undefined : body,
  });

  const webResponse = await handler(webRequest);
  const text = await webResponse.text();
  res.writeHead(webResponse.status).end(text);
});

server.listen(PORT, () => {
  console.log(`WhatsApp webhook server running on http://localhost:${PORT}/webhook`);
  console.log("Use ngrok to expose: ngrok http " + PORT);
});
