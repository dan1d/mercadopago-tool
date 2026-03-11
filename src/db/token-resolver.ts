import type { MerchantStore } from "./merchant-store.js";

export interface TokenResolver {
  resolve(phone: string): string | null;
}

export function createTokenResolver(options: {
  store: MerchantStore | null;
  fallbackToken: string;
}): TokenResolver {
  return {
    resolve(phone: string): string | null {
      if (options.store) {
        const token = options.store.getToken(phone);
        if (token) return token;
      }
      return options.fallbackToken || null;
    },
  };
}
