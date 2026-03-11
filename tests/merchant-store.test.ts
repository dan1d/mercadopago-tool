import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createMerchantStore, type MerchantStore } from "../src/db/merchant-store.js";
import { randomBytes } from "node:crypto";

const TEST_KEY = randomBytes(32);

describe("MerchantStore", () => {
  let store: MerchantStore;

  beforeEach(() => {
    store = createMerchantStore({ dbPath: ":memory:", encryptionKey: TEST_KEY });
  });

  afterEach(() => {
    store.close();
  });

  describe("setToken + getToken", () => {
    it("stores and retrieves a token", () => {
      store.setToken("5491155551234", "APP_USR-my-token", "Juan Perez");
      expect(store.getToken("5491155551234")).toBe("APP_USR-my-token");
    });

    it("returns the merchant name", () => {
      store.setToken("5491155551234", "APP_USR-tok", "Maria Garcia");
      const record = store.getMerchant("5491155551234");
      expect(record).not.toBeNull();
      expect(record!.merchantName).toBe("Maria Garcia");
    });

    it("updates token on second set (upsert)", () => {
      store.setToken("5491155551234", "old-token", "Juan");
      store.setToken("5491155551234", "new-token", "Juan Updated");
      expect(store.getToken("5491155551234")).toBe("new-token");
      expect(store.getMerchant("5491155551234")!.merchantName).toBe("Juan Updated");
    });

    it("handles multiple merchants independently", () => {
      store.setToken("5491100001111", "token-a", "Merchant A");
      store.setToken("5491100002222", "token-b", "Merchant B");
      expect(store.getToken("5491100001111")).toBe("token-a");
      expect(store.getToken("5491100002222")).toBe("token-b");
    });

    it("handles long tokens (Meta access tokens)", () => {
      const longToken = "EAAm6CtAZBO7ABQ7cAaV3THoyFJQVEZBY5ReqZBj4nZAZBJJLsUhilYZB4StvomeRlrbMUoZBg9Icpc6Q3ZB2j70gKyZBRqV35I9TAnlqsS07Cmme5CXcY2uc22IF4SXPd6lMS47Rzx";
      store.setToken("5491155551234", longToken, "Test");
      expect(store.getToken("5491155551234")).toBe(longToken);
    });

    it("stores token encrypted (raw value is not plaintext)", () => {
      const plainToken = "APP_USR-plaintext-token";
      store.setToken("5491155551234", plainToken, "Test");
      const raw = store.getRawEncryptedToken("5491155551234");
      expect(raw).not.toBeNull();
      expect(raw).not.toBe(plainToken);
      expect(raw).toContain(":"); // iv:authTag:ciphertext format
    });
  });

  describe("getToken", () => {
    it("returns null for unknown phone", () => {
      expect(store.getToken("9999999999")).toBeNull();
    });
  });

  describe("getMerchant", () => {
    it("returns null for unknown phone", () => {
      expect(store.getMerchant("9999999999")).toBeNull();
    });

    it("returns full record with timestamps", () => {
      store.setToken("5491155551234", "tok", "Juan");
      const record = store.getMerchant("5491155551234");
      expect(record).not.toBeNull();
      expect(record!.phone).toBe("5491155551234");
      expect(record!.merchantName).toBe("Juan");
      expect(record!.createdAt).toBeTruthy();
      expect(record!.updatedAt).toBeTruthy();
    });
  });

  describe("hasToken", () => {
    it("returns false for unknown phone", () => {
      expect(store.hasToken("9999999999")).toBe(false);
    });

    it("returns true after setToken", () => {
      store.setToken("5491155551234", "tok", "Juan");
      expect(store.hasToken("5491155551234")).toBe(true);
    });

    it("returns false after removeToken", () => {
      store.setToken("5491155551234", "tok", "Juan");
      store.removeToken("5491155551234");
      expect(store.hasToken("5491155551234")).toBe(false);
    });
  });

  describe("removeToken", () => {
    it("returns true when token existed", () => {
      store.setToken("5491155551234", "tok", "Juan");
      expect(store.removeToken("5491155551234")).toBe(true);
    });

    it("returns false when token did not exist", () => {
      expect(store.removeToken("9999999999")).toBe(false);
    });

    it("token is no longer retrievable after removal", () => {
      store.setToken("5491155551234", "tok", "Juan");
      store.removeToken("5491155551234");
      expect(store.getToken("5491155551234")).toBeNull();
    });
  });

  describe("close", () => {
    it("does not throw when called", () => {
      expect(() => store.close()).not.toThrow();
    });

    it("does not throw when called twice", () => {
      store.close();
      expect(() => store.close()).not.toThrow();
    });
  });

  describe("listMerchants", () => {
    it("returns empty array when no merchants", () => {
      expect(store.listMerchants()).toEqual([]);
    });

    it("returns all merchants", () => {
      store.setToken("111", "tok-a", "A");
      store.setToken("222", "tok-b", "B");
      const merchants = store.listMerchants();
      expect(merchants).toHaveLength(2);
      expect(merchants.map((m) => m.phone).sort()).toEqual(["111", "222"]);
    });
  });
});
