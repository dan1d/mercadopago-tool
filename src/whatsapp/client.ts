const GRAPH_API_BASE = "https://graph.facebook.com/v22.0";

export interface WhatsAppClientConfig {
  accessToken: string;
  phoneNumberId: string;
}

export class WhatsAppClient {
  private accessToken: string;
  private phoneNumberId: string;

  constructor(config: WhatsAppClientConfig) {
    if (!config.accessToken) {
      throw new Error("WHATSAPP_ACCESS_TOKEN is required");
    }
    if (!config.phoneNumberId) {
      throw new Error("WHATSAPP_PHONE_NUMBER_ID is required");
    }
    this.accessToken = config.accessToken;
    this.phoneNumberId = config.phoneNumberId;
  }

  async sendMessage(phoneNumber: string, message: string): Promise<unknown> {
    if (!phoneNumber) {
      throw new Error("phoneNumber is required");
    }
    if (!message) {
      throw new Error("message is required");
    }

    const url = `${GRAPH_API_BASE}/${this.phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber,
        type: "text",
        text: { body: message },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`WhatsApp API error (${res.status}): ${body}`);
    }

    return res.json();
  }
}
