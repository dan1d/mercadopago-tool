import { describe, it, expect, vi, beforeEach } from "vitest";
import { MercadoPagoClient } from "../src/client.js";
import {
  createPaymentPreference,
  getPayment,
  createRefund,
  searchPayments,
  getMerchantInfo,
} from "../src/actions.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("actions", () => {
  const client = new MercadoPagoClient("TEST_TOKEN");

  beforeEach(() => {
    mockFetch.mockReset();
  });

  // ─── createPaymentPreference ────────────────────────────────

  describe("createPaymentPreference", () => {
    const validParams = {
      title: "Test Product",
      quantity: 1,
      currency: "ARS",
      unit_price: 1000,
    };

    it("creates a preference with correct payload", async () => {
      const expected = { id: "pref_123", init_point: "https://mp.com/checkout" };
      mockFetch.mockResolvedValueOnce(jsonResponse(expected));

      const result = await createPaymentPreference(client, validParams);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/checkout/preferences",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            items: [
              {
                title: "Test Product",
                quantity: 1,
                currency_id: "ARS",
                unit_price: 1000,
              },
            ],
          }),
        })
      );
      expect(result).toEqual(expected);
    });

    it("includes back_urls and auto_return when provided", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "pref_456" }));

      await createPaymentPreference(client, {
        ...validParams,
        back_urls: {
          success: "https://mysite.com/ok",
          failure: "https://mysite.com/fail",
          pending: "https://mysite.com/pending",
        },
      });

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.back_urls).toEqual({
        success: "https://mysite.com/ok",
        failure: "https://mysite.com/fail",
        pending: "https://mysite.com/pending",
      });
      expect(sentBody.auto_return).toBe("approved");
    });

    it("includes notification_url when provided", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "pref_789" }));

      await createPaymentPreference(client, {
        ...validParams,
        notification_url: "https://mysite.com/webhooks/mp",
      });

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.notification_url).toBe("https://mysite.com/webhooks/mp");
    });

    it("does not include back_urls or notification_url when omitted", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: "pref_000" }));

      await createPaymentPreference(client, validParams);

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody).not.toHaveProperty("back_urls");
      expect(sentBody).not.toHaveProperty("notification_url");
      expect(sentBody).not.toHaveProperty("auto_return");
    });

    it("rejects empty title", async () => {
      await expect(
        createPaymentPreference(client, { ...validParams, title: "" })
      ).rejects.toThrow("title is required");
    });

    it("rejects zero quantity", async () => {
      await expect(
        createPaymentPreference(client, { ...validParams, quantity: 0 })
      ).rejects.toThrow("quantity must be a positive number");
    });

    it("rejects negative unit_price", async () => {
      await expect(
        createPaymentPreference(client, { ...validParams, unit_price: -5 })
      ).rejects.toThrow("unit_price must be a positive number");
    });

    it("rejects empty currency", async () => {
      await expect(
        createPaymentPreference(client, { ...validParams, currency: "" })
      ).rejects.toThrow("currency is required");
    });
  });

  // ─── getPayment ─────────────────────────────────────────────

  describe("getPayment", () => {
    it("fetches payment by ID", async () => {
      const payment = { id: 456, status: "approved" };
      mockFetch.mockResolvedValueOnce(jsonResponse(payment));

      const result = await getPayment(client, { payment_id: "456" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/v1/payments/456",
        expect.anything()
      );
      expect(result).toEqual(payment);
    });

    it("rejects empty payment_id", async () => {
      await expect(
        getPayment(client, { payment_id: "" })
      ).rejects.toThrow("payment_id is required");
    });

    it("encodes payment_id in URL", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await getPayment(client, { payment_id: "12/34" });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/v1/payments/12%2F34",
        expect.anything()
      );
    });
  });

  // ─── createRefund ───────────────────────────────────────────

  describe("createRefund", () => {
    it("creates a full refund (no amount)", async () => {
      const refund = { id: 1001, payment_id: 456, amount: 1000 };
      mockFetch.mockResolvedValueOnce(jsonResponse(refund));

      const result = await createRefund(client, { payment_id: "456" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/v1/payments/456/refunds",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({}),
        })
      );
      expect(result).toEqual(refund);
    });

    it("creates a partial refund with amount", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1002 }));

      await createRefund(client, { payment_id: "456", amount: 250.50 });

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody).toEqual({ amount: 250.50 });
    });

    it("rejects empty payment_id", async () => {
      await expect(
        createRefund(client, { payment_id: "" })
      ).rejects.toThrow("payment_id is required");
    });

    it("rejects negative amount", async () => {
      await expect(
        createRefund(client, { payment_id: "456", amount: -10 })
      ).rejects.toThrow("amount must be a positive number");
    });

    it("rejects zero amount", async () => {
      await expect(
        createRefund(client, { payment_id: "456", amount: 0 })
      ).rejects.toThrow("amount must be a positive number");
    });

    it("encodes payment_id in refund URL", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}));
      await createRefund(client, { payment_id: "99/x" });
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/v1/payments/99%2Fx/refunds",
        expect.anything()
      );
    });
  });

  // ─── searchPayments ─────────────────────────────────────────

  describe("searchPayments", () => {
    it("calls search endpoint with no params", async () => {
      const data = { results: [], paging: { total: 0 } };
      mockFetch.mockResolvedValueOnce(jsonResponse(data));

      const result = await searchPayments(client);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/v1/payments/search",
        expect.anything()
      );
      expect(result).toEqual(data);
    });

    it("appends status filter as query param", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));

      await searchPayments(client, { status: "approved" });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/v1/payments/search?status=approved",
        expect.anything()
      );
    });

    it("appends multiple query params", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));

      await searchPayments(client, {
        status: "pending",
        sort: "date_created",
        criteria: "desc",
        limit: 10,
        offset: 20,
      });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("status=pending");
      expect(url).toContain("sort=date_created");
      expect(url).toContain("criteria=desc");
      expect(url).toContain("limit=10");
      expect(url).toContain("offset=20");
    });

    it("omits undefined params from query string", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ results: [] }));

      await searchPayments(client, { limit: 5 });

      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toBe("https://api.mercadopago.com/v1/payments/search?limit=5");
    });
  });

  // ─── getMerchantInfo ────────────────────────────────────────

  describe("getMerchantInfo", () => {
    it("calls users/me endpoint", async () => {
      const user = { id: 789, nickname: "TESTUSER" };
      mockFetch.mockResolvedValueOnce(jsonResponse(user));

      const result = await getMerchantInfo(client);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.mercadopago.com/users/me",
        expect.anything()
      );
      expect(result).toEqual(user);
    });
  });
});
