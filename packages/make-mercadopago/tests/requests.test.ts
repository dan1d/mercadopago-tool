import { describe, it, expect } from "vitest";
import {
  buildPreferencePayload,
  buildSearchQuery,
  buildRefundPayload,
} from "../src/api/requests.js";

describe("buildPreferencePayload", () => {
  it("should build a basic preference payload", () => {
    const payload = buildPreferencePayload({
      title: "Blue T-Shirt",
      quantity: 3,
      currency: "ARS",
      unitPrice: 1500,
    });

    expect(payload.items).toEqual([
      {
        title: "Blue T-Shirt",
        quantity: 3,
        currency_id: "ARS",
        unit_price: 1500,
      },
    ]);
    expect(payload.back_urls).toBeUndefined();
    expect(payload.notification_url).toBeUndefined();
    expect(payload.external_reference).toBeUndefined();
  });

  it("should include back_urls when provided", () => {
    const payload = buildPreferencePayload({
      title: "Product",
      quantity: 1,
      currency: "BRL",
      unitPrice: 50,
      backUrls: {
        success: "https://example.com/success",
        failure: "https://example.com/failure",
        pending: "https://example.com/pending",
      },
    });

    expect(payload.back_urls).toEqual({
      success: "https://example.com/success",
      failure: "https://example.com/failure",
      pending: "https://example.com/pending",
    });
  });

  it("should include notification_url and external_reference", () => {
    const payload = buildPreferencePayload({
      title: "Item",
      quantity: 1,
      currency: "USD",
      unitPrice: 10,
      notificationUrl: "https://hooks.example.com/mp",
      externalReference: "order-42",
    });

    expect(payload.notification_url).toBe("https://hooks.example.com/mp");
    expect(payload.external_reference).toBe("order-42");
  });
});

describe("buildSearchQuery", () => {
  it("should return empty string with no params", () => {
    expect(buildSearchQuery()).toBe("");
    expect(buildSearchQuery({})).toBe("");
  });

  it("should build query string with status and limit", () => {
    const qs = buildSearchQuery({ status: "approved", limit: 20 });
    expect(qs).toContain("status=approved");
    expect(qs).toContain("limit=20");
  });

  it("should include all provided params", () => {
    const qs = buildSearchQuery({
      status: "pending",
      externalReference: "ref-001",
      sort: "date_created",
      criteria: "desc",
      limit: 10,
      offset: 5,
    });

    expect(qs).toContain("status=pending");
    expect(qs).toContain("external_reference=ref-001");
    expect(qs).toContain("sort=date_created");
    expect(qs).toContain("criteria=desc");
    expect(qs).toContain("limit=10");
    expect(qs).toContain("offset=5");
  });

  it("should handle offset of 0", () => {
    const qs = buildSearchQuery({ offset: 0 });
    expect(qs).toContain("offset=0");
  });
});

describe("buildRefundPayload", () => {
  it("should return empty object for full refund", () => {
    expect(buildRefundPayload()).toEqual({});
  });

  it("should return amount for partial refund", () => {
    expect(buildRefundPayload(50.25)).toEqual({ amount: 50.25 });
  });
});
