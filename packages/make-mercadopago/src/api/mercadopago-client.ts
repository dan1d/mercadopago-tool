const BASE_URL = "https://api.mercadopago.com";

export class MercadoPagoApiError extends Error {
  public readonly status: number;
  public readonly method: string;
  public readonly path: string;
  public readonly responseBody: unknown;

  constructor(status: number, method: string, path: string, responseBody: unknown) {
    super(`MercadoPago API error: ${method} ${path} responded with ${status}`);
    this.name = "MercadoPagoApiError";
    this.status = status;
    this.method = method;
    this.path = path;
    this.responseBody = responseBody;
  }
}

export class MakeClient {
  private readonly accessToken: string;

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error("accessToken is required");
    }
    this.accessToken = accessToken;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async get<T = unknown>(path: string): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.headers,
    });

    const body = await response.json();

    if (!response.ok) {
      throw new MercadoPagoApiError(response.status, "GET", path, body);
    }

    return body as T;
  }

  async post<T = unknown>(path: string, body: unknown): Promise<T> {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(body),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      throw new MercadoPagoApiError(response.status, "POST", path, responseBody);
    }

    return responseBody as T;
  }
}
