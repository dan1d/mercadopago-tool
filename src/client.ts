import { MercadoPagoError } from "./errors.js";

const BASE_URL = "https://api.mercadopago.com";

export interface ClientOptions {
  idempotencyKey?: string;
}

export class MercadoPagoClient {
  private accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN is required");
    }
    this.accessToken = accessToken;
  }

  private headers(opts?: ClientOptions): Record<string, string> {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
    if (opts?.idempotencyKey) {
      h["X-Idempotency-Key"] = opts.idempotencyKey;
    }
    return h;
  }

  async get<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new MercadoPagoError("GET", path, res.status, body);
    }
    return res.json() as Promise<T>;
  }

  async post<T = unknown>(path: string, body: unknown, opts?: ClientOptions): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: this.headers(opts),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new MercadoPagoError("POST", path, res.status, text);
    }
    return res.json() as Promise<T>;
  }
}
