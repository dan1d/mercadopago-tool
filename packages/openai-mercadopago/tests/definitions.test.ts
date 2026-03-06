import { describe, it, expect } from "vitest";
import { mercadoPagoFunctions, FunctionDefinition } from "../src/definitions.js";

describe("mercadoPagoFunctions", () => {
  it("exports exactly 5 function definitions", () => {
    expect(mercadoPagoFunctions).toHaveLength(5);
  });

  it("each function has name, description, and parameters", () => {
    for (const fn of mercadoPagoFunctions) {
      expect(fn.name).toBeTypeOf("string");
      expect(fn.name.length).toBeGreaterThan(0);
      expect(fn.description).toBeTypeOf("string");
      expect(fn.description.length).toBeGreaterThan(0);
      expect(fn.parameters).toBeDefined();
      expect(fn.parameters.type).toBe("object");
      expect(fn.parameters.properties).toBeDefined();
    }
  });

  it("contains all expected function names", () => {
    const names = mercadoPagoFunctions.map((fn) => fn.name);
    expect(names).toContain("create_payment_preference");
    expect(names).toContain("get_payment");
    expect(names).toContain("search_payments");
    expect(names).toContain("create_refund");
    expect(names).toContain("get_merchant_info");
  });

  describe("create_payment_preference", () => {
    let fn: FunctionDefinition;
    beforeAll(() => {
      fn = mercadoPagoFunctions.find((f) => f.name === "create_payment_preference")!;
    });

    it("requires title, quantity, currency, unit_price", () => {
      expect(fn.parameters.required).toEqual(
        expect.arrayContaining(["title", "quantity", "currency", "unit_price"])
      );
      expect(fn.parameters.required).toHaveLength(4);
    });

    it("has correct parameter types", () => {
      expect(fn.parameters.properties.title.type).toBe("string");
      expect(fn.parameters.properties.quantity.type).toBe("number");
      expect(fn.parameters.properties.currency.type).toBe("string");
      expect(fn.parameters.properties.unit_price.type).toBe("number");
    });

    it("includes optional notification_url parameter", () => {
      expect(fn.parameters.properties.notification_url).toBeDefined();
      expect(fn.parameters.properties.notification_url.type).toBe("string");
    });
  });

  describe("get_payment", () => {
    let fn: FunctionDefinition;
    beforeAll(() => {
      fn = mercadoPagoFunctions.find((f) => f.name === "get_payment")!;
    });

    it("requires payment_id", () => {
      expect(fn.parameters.required).toEqual(["payment_id"]);
    });

    it("payment_id is a string", () => {
      expect(fn.parameters.properties.payment_id.type).toBe("string");
    });
  });

  describe("create_refund", () => {
    let fn: FunctionDefinition;
    beforeAll(() => {
      fn = mercadoPagoFunctions.find((f) => f.name === "create_refund")!;
    });

    it("requires payment_id", () => {
      expect(fn.parameters.required).toEqual(["payment_id"]);
    });

    it("has optional amount parameter of type number", () => {
      expect(fn.parameters.properties.amount).toBeDefined();
      expect(fn.parameters.properties.amount.type).toBe("number");
    });
  });

  describe("search_payments", () => {
    let fn: FunctionDefinition;
    beforeAll(() => {
      fn = mercadoPagoFunctions.find((f) => f.name === "search_payments")!;
    });

    it("has no required fields", () => {
      expect(fn.parameters.required ?? []).toEqual([]);
    });

    it("has status, sort, criteria, limit, offset parameters", () => {
      const props = Object.keys(fn.parameters.properties);
      expect(props).toContain("status");
      expect(props).toContain("sort");
      expect(props).toContain("criteria");
      expect(props).toContain("limit");
      expect(props).toContain("offset");
    });

    it("limit and offset are numbers", () => {
      expect(fn.parameters.properties.limit.type).toBe("number");
      expect(fn.parameters.properties.offset.type).toBe("number");
    });
  });

  describe("get_merchant_info", () => {
    let fn: FunctionDefinition;
    beforeAll(() => {
      fn = mercadoPagoFunctions.find((f) => f.name === "get_merchant_info")!;
    });

    it("has no required fields", () => {
      expect(fn.parameters.required ?? []).toEqual([]);
    });

    it("has no parameters (empty properties)", () => {
      expect(Object.keys(fn.parameters.properties)).toHaveLength(0);
    });
  });
});

import { beforeAll } from "vitest";
