export type CommandName = "cobrar" | "pagos" | "estado" | "devolver" | "ayuda";

export interface ParsedCommand {
  command: CommandName;
  args: string[];
}

const VALID_COMMANDS: ReadonlySet<string> = new Set([
  "cobrar",
  "pagos",
  "estado",
  "devolver",
  "ayuda",
  "help",
]);

export function parseMessage(text: string): ParsedCommand | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const raw = parts[0].toLowerCase().replace(/^\//, "");

  if (!VALID_COMMANDS.has(raw)) return null;

  const command: CommandName = raw === "help" ? "ayuda" : raw as CommandName;
  return { command, args: parts.slice(1) };
}

export interface IncomingWhatsAppMessage {
  from: string;
  text: string;
  messageId: string;
  timestamp: string;
}

interface WhatsAppWebhookEntry {
  changes?: Array<{
    value?: {
      messages?: Array<{
        from?: string;
        id?: string;
        timestamp?: string;
        type?: string;
        text?: { body?: string };
      }>;
    };
  }>;
}

interface WhatsAppWebhookPayload {
  object?: string;
  entry?: WhatsAppWebhookEntry[];
}

export function extractMessages(body: WhatsAppWebhookPayload): IncomingWhatsAppMessage[] {
  const messages: IncomingWhatsAppMessage[] = [];

  if (body.object !== "whatsapp_business_account") return messages;

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        if (msg.type === "text" && msg.text?.body && msg.from && msg.id) {
          messages.push({
            from: msg.from,
            text: msg.text.body,
            messageId: msg.id,
            timestamp: msg.timestamp ?? "",
          });
        }
      }
    }
  }

  return messages;
}
