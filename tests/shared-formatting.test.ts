import { describe, it, expect } from "vitest";
import { statusEmoji, statusLabel, formatMoney, friendlyError } from "../src/shared/formatting.js";
import { MercadoPagoError } from "../src/errors.js";

describe("shared/formatting", () => {
  describe("statusEmoji", () => {
    it("returns check for approved", () => expect(statusEmoji("approved")).toBe("\u2705"));
    it("returns hourglass for pending", () => expect(statusEmoji("pending")).toBe("\u23f3"));
    it("returns hourglass for in_process", () => expect(statusEmoji("in_process")).toBe("\u23f3"));
    it("returns X for rejected", () => expect(statusEmoji("rejected")).toBe("\u274c"));
    it("returns X for cancelled", () => expect(statusEmoji("cancelled")).toBe("\u274c"));
    it("returns arrows for refunded", () => expect(statusEmoji("refunded")).toBe("\ud83d\udd04"));
    it("returns arrows for charged_back", () => expect(statusEmoji("charged_back")).toBe("\ud83d\udd04"));
    it("returns question for unknown", () => expect(statusEmoji("xyz")).toBe("\u2753"));
  });

  describe("statusLabel", () => {
    it("maps approved", () => expect(statusLabel("approved")).toBe("Aprobado"));
    it("maps pending", () => expect(statusLabel("pending")).toBe("Pendiente"));
    it("maps refunded", () => expect(statusLabel("refunded")).toBe("Devuelto"));
    it("returns raw for unknown", () => expect(statusLabel("xyz")).toBe("xyz"));
  });

  describe("formatMoney", () => {
    it("formats with currency", () => {
      const result = formatMoney(5000, "ARS");
      expect(result).toContain("5");
      expect(result).toContain("ARS");
    });

    it("formats decimals", () => {
      const result = formatMoney(1500.5, "BRL");
      expect(result).toContain("BRL");
    });
  });

  describe("friendlyError", () => {
    it("handles unauthorized MercadoPagoError", () => {
      const err = new MercadoPagoError("GET", "/", 401, "bad token");
      expect(friendlyError(err)).toContain("autenticacion");
    });

    it("handles not found MercadoPagoError", () => {
      const err = new MercadoPagoError("GET", "/", 404, "nope");
      expect(friendlyError(err)).toContain("No se encontro");
    });

    it("handles rate limited MercadoPagoError", () => {
      const err = new MercadoPagoError("GET", "/", 429, "slow down");
      expect(friendlyError(err)).toContain("Demasiadas");
    });

    it("handles generic MercadoPagoError", () => {
      const err = new MercadoPagoError("POST", "/x", 500, "server error");
      expect(friendlyError(err)).toContain("500");
    });

    it("does not leak raw body for non-standard status codes", () => {
      const err = new MercadoPagoError("GET", "/x", 503, "sensitive internal details");
      const msg = friendlyError(err);
      expect(msg).toContain("503");
      expect(msg).not.toContain("sensitive internal details");
    });

    it("handles regular Error", () => {
      expect(friendlyError(new Error("boom"))).toBe("Error: boom");
    });

    it("handles unknown error", () => {
      expect(friendlyError("random")).toContain("inesperado");
    });
  });
});
