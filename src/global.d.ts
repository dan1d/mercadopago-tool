export {};

declare global {
  // Node 18+ provides fetch globally
  const fetch: typeof globalThis.fetch;
}
