import { describe, it, expect, vi, beforeEach } from "vitest";
import { MakeClient } from "../src/api/mercadopago-client.js";
import { createPaymentPreference } from "../src/modules/create-payment-preference.js";
import { getPayment } from "../src/modules/get-payment.js";
import { searchPayments } from "../src/modules/search-payments.js";
import { createRefund } from "../src/modules/create-refund.js";
import { getMerchantInfo } from "../src/modules/get-merchant-info.js";

function mockFetch(response: unknown, status = 200) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(response),
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

describe("Modules", () => {
  let client: MakeClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    client = new MakeClient("test_token");
  });

  describe("createPaymentPreference", () => {
    it("should create a preference and return normalized result", async () => {
      mockFetch({
        id: "pref_123",
        init_point: "https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref_123",
        sandbox_init_point: "https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref_123",
      });

      const result = await createPaymentPreference(client, {
        title: "Test Product",
        quantity: 2,
        currency: "ARS",
        unitPrice: 100.5,
      });

      expect(result.preference_id).toBe("pref_123");
      expect(result.init_point).toContain("mercadopago.com");
      expect(result.sandbox_init_point).toContain("sandbox");
      expect(result.raw).toBeDefined();
    });

    it("should call the correct endpoint with correct payload", async () => {
      const fetchMock = mockFetch({ id: "p1", init_point: "", sandbox_init_point: "" });

      await createPaymentPreference(client, {
        title: "Widget",
        quantity: 1,
        currency: "USD",
        unitPrice: 25,
        notificationUrl: "https://example.com/webhook",
        externalReference: "order-789",
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.items[0].title).toBe("Widget");
      expect(callBody.items[0].unit_price).toBe(25);
      expect(callBody.notification_url).toBe("https://example.com/webhook");
      expect(callBody.external_reference).toBe("order-789");
    });

    it("should throw if title is missing", async () => {
      await expect(
        createPaymentPreference(client, {
          title: "",
          quantity: 1,
          currency: "ARS",
          unitPrice: 10,
        })
      ).rejects.toThrow("title is required");
    });

    it("should throw if quantity is zero", async () => {
      await expect(
        createPaymentPreference(client, {
          title: "Test",
          quantity: 0,
          currency: "ARS",
          unitPrice: 10,
        })
      ).rejects.toThrow("quantity is required");
    });

    it("should throw if unitPrice is negative", async () => {
      await expect(
        createPaymentPreference(client, {
          title: "Test",
          quantity: 1,
          currency: "ARS",
          unitPrice: -5,
        })
      ).rejects.toThrow("unitPrice is required");
    });
  });

  describe("getPayment", () => {
    it("should fetch payment by ID", async () => {
      const fetchMock = mockFetch({ id: 12345, status: "approved" });

      const result = await getPayment(client, 12345);

      expect(result).toEqual({ id: 12345, status: "approved" });
      expect(fetchMock.mock.calls[0][0]).toContain("/v1/payments/12345");
    });

    it("should accept string payment ID", async () => {
      mockFetch({ id: 999 });

      const result = await getPayment(client, "999");

      expect(result).toEqual({ id: 999 });
    });

    it("should throw if paymentId is empty", async () => {
      await expect(getPayment(client, "")).rejects.toThrow("paymentId is required");
    });

    it("should throw if paymentId is not numeric", async () => {
      await expect(getPayment(client, "abc")).rejects.toThrow("paymentId must be numeric");
    });
  });

  describe("searchPayments", () => {
    it("should search without params", async () => {
      const fetchMock = mockFetch({
        results: [{ id: 1 }],
        paging: { total: 1, limit: 30, offset: 0 },
      });

      const result = await searchPayments(client);

      expect(result.results).toHaveLength(1);
      expect(result.paging.total).toBe(1);
      expect(fetchMock.mock.calls[0][0]).toContain("/v1/payments/search");
    });

    it("should include search params in query string", async () => {
      const fetchMock = mockFetch({
        results: [],
        paging: { total: 0, limit: 10, offset: 0 },
      });

      await searchPayments(client, {
        status: "approved",
        limit: 10,
        offset: 5,
      });

      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain("status=approved");
      expect(url).toContain("limit=10");
      expect(url).toContain("offset=5");
    });
  });

  describe("createRefund", () => {
    it("should create a full refund", async () => {
      const fetchMock = mockFetch({ id: 1, amount: 100 });

      const result = await createRefund(client, 12345);

      expect(result).toEqual({ id: 1, amount: 100 });
      expect(fetchMock.mock.calls[0][0]).toContain("/v1/payments/12345/refunds");
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body).toEqual({});
    });

    it("should create a partial refund with amount", async () => {
      const fetchMock = mockFetch({ id: 2, amount: 50 });

      await createRefund(client, 12345, 50);

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body).toEqual({ amount: 50 });
    });

    it("should throw if paymentId is missing", async () => {
      await expect(createRefund(client, "")).rejects.toThrow("paymentId is required");
    });
  });

  describe("getMerchantInfo", () => {
    it("should fetch merchant profile", async () => {
      const fetchMock = mockFetch({
        id: 123456,
        nickname: "TEST_USER",
        email: "test@example.com",
      });

      const result = await getMerchantInfo(client);

      expect(result).toEqual({
        id: 123456,
        nickname: "TEST_USER",
        email: "test@example.com",
      });
      expect(fetchMock.mock.calls[0][0]).toContain("/users/me");
    });
  });
});
