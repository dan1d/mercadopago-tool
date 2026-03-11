import { describe, it, expect } from "vitest";
import { createTokenResolver } from "../src/db/token-resolver.js";
import type { MerchantStore } from "../src/db/merchant-store.js";

function mockStore(tokens: Record<string, string>): MerchantStore {
  return {
    getToken: (phone: string) => tokens[phone] ?? null,
    getMerchant: () => null,
    setToken: () => {},
    removeToken: () => false,
    hasToken: (phone: string) => phone in tokens,
    listMerchants: () => [],
    getRawEncryptedToken: () => null,
    close: () => {},
  };
}

describe("TokenResolver", () => {
  it("returns per-merchant token when found in store", () => {
    const store = mockStore({ "5491155551234": "merchant-token" });
    const resolver = createTokenResolver({ store, fallbackToken: "fallback" });
    expect(resolver.resolve("5491155551234")).toBe("merchant-token");
  });

  it("falls back to env var token when merchant has no registered token", () => {
    const store = mockStore({});
    const resolver = createTokenResolver({ store, fallbackToken: "env-token" });
    expect(resolver.resolve("9999999999")).toBe("env-token");
  });

  it("returns null when neither merchant token nor fallback exists", () => {
    const store = mockStore({});
    const resolver = createTokenResolver({ store, fallbackToken: "" });
    expect(resolver.resolve("9999999999")).toBeNull();
  });

  it("prefers merchant token over fallback", () => {
    const store = mockStore({ "111": "merchant-specific" });
    const resolver = createTokenResolver({ store, fallbackToken: "global-fallback" });
    expect(resolver.resolve("111")).toBe("merchant-specific");
  });

  it("works when store is null (no DB configured)", () => {
    const resolver = createTokenResolver({ store: null, fallbackToken: "env-only" });
    expect(resolver.resolve("5491155551234")).toBe("env-only");
  });

  it("returns null when store is null and fallback is empty", () => {
    const resolver = createTokenResolver({ store: null, fallbackToken: "" });
    expect(resolver.resolve("5491155551234")).toBeNull();
  });
});
