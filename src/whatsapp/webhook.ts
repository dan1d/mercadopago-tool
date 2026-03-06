import { WhatsAppClient } from "./client.js";
import { extractMessages, parseMessage } from "./message-parser.js";
import { createCommandHandlers } from "./handlers.js";
import type { HandlersConfig } from "./handlers.js";

export interface WhatsAppWebhookConfig {
  waAccessToken: string;
  waPhoneNumberId: string;
  verifyToken: string;
  mpAccessToken: string;
  currency?: string;
  successUrl?: string;
  allowedPhones?: Set<string>;
}

export function createWhatsAppWebhookHandler(config: WhatsAppWebhookConfig) {
  const wa = new WhatsAppClient({
    accessToken: config.waAccessToken,
    phoneNumberId: config.waPhoneNumberId,
  });

  const handlersConfig: HandlersConfig = {
    mpAccessToken: config.mpAccessToken,
    currency: config.currency ?? "ARS",
    successUrl: config.successUrl,
  };

  const { handleCommand } = createCommandHandlers(handlersConfig);

  return async (request: Request): Promise<Response> => {
    // GET — Meta webhook verification challenge
    if (request.method === "GET") {
      const url = new URL(request.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === config.verifyToken) {
        return new Response(challenge ?? "", { status: 200 });
      }

      return new Response("Forbidden", { status: 403 });
    }

    // POST — incoming messages
    if (request.method === "POST") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return new Response("Bad request", { status: 400 });
      }

      const messages = extractMessages(body as Record<string, unknown>);

      for (const msg of messages) {
        // Access control: if allowedPhones is set, only respond to those numbers
        if (config.allowedPhones && !config.allowedPhones.has(msg.from)) {
          continue;
        }

        const parsed = parseMessage(msg.text);
        if (parsed) {
          try {
            await handleCommand(wa, msg.from, parsed);
          } catch {
            // Best-effort: don't fail the webhook on handler errors
          }
        }
      }

      // Always return 200 to acknowledge receipt (Meta requires this)
      return new Response("OK", { status: 200 });
    }

    return new Response("Method not allowed", { status: 405 });
  };
}

export { WhatsAppClient } from "./client.js";
export type { WhatsAppClientConfig } from "./client.js";
export { parseMessage, extractMessages } from "./message-parser.js";
export type { ParsedCommand, IncomingWhatsAppMessage, CommandName } from "./message-parser.js";
export { createCommandHandlers, createPaymentNotifier } from "./handlers.js";
export type { HandlersConfig } from "./handlers.js";
