import { describe, it, expect } from "vitest";
import { MercadoPagoError } from "../src/errors.js";

describe("MercadoPagoError", () => {
  it("formats error message correctly", () => {
    const err = new MercadoPagoError("GET", "/v1/payments/1", 404, "not found");
    expect(err.message).toBe("GET /v1/payments/1 failed (404): not found");
    expect(err.name).toBe("MercadoPagoError");
    expect(err.status).toBe(404);
    expect(err.method).toBe("GET");
    expect(err.path).toBe("/v1/payments/1");
    expect(err.body).toBe("not found");
  });

  it("detects unauthorized", () => {
    const err = new MercadoPagoError("GET", "/", 401, "bad token");
    expect(err.isUnauthorized).toBe(true);
    expect(err.isNotFound).toBe(false);
    expect(err.isRateLimited).toBe(false);
  });

  it("detects not found", () => {
    const err = new MercadoPagoError("GET", "/", 404, "");
    expect(err.isNotFound).toBe(true);
  });

  it("detects rate limited", () => {
    const err = new MercadoPagoError("GET", "/", 429, "too many");
    expect(err.isRateLimited).toBe(true);
  });

  it("is instanceof Error", () => {
    const err = new MercadoPagoError("POST", "/", 500, "");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(MercadoPagoError);
  });
});
