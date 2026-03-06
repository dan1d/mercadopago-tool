/**
 * Integration test — run against the real Mercado Pago API.
 *
 * Usage:
 *   MERCADO_PAGO_ACCESS_TOKEN=APP_USR-... npx tsx scripts/integration.ts
 *
 * This will:
 *   1. Fetch your merchant profile
 *   2. Create a test payment preference
 *   3. Search recent payments
 *   4. Print results
 */

import { createMercadoPagoTools } from "../src/index.js";

const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
if (!token) {
  console.error("Set MERCADO_PAGO_ACCESS_TOKEN env var first.");
  console.error("  MERCADO_PAGO_ACCESS_TOKEN=APP_USR-... npx tsx scripts/integration.ts");
  process.exit(1);
}

const mp = createMercadoPagoTools(token);

async function run() {
  console.log("--- Merchant Info ---");
  const me = await mp.tools.get_merchant_info();
  console.log(JSON.stringify(me, null, 2));

  console.log("\n--- Create Payment Preference ---");
  const pref = (await mp.tools.create_payment_preference({
    title: "Integration Test Product",
    quantity: 1,
    currency: "ARS",
    unit_price: 100,
    back_urls: {
      success: "https://example.com/success",
      failure: "https://example.com/failure",
      pending: "https://example.com/pending",
    },
  })) as { id: string; init_point: string; sandbox_init_point: string };
  console.log("Preference ID:", pref.id);
  console.log("Checkout URL:", pref.init_point);
  console.log("Sandbox URL:", pref.sandbox_init_point);

  console.log("\n--- Search Recent Payments ---");
  const payments = (await mp.tools.search_payments({ limit: 3 })) as {
    results: Array<{ id: number; status: string; transaction_amount: number }>;
    paging: { total: number };
  };
  console.log(`Total payments: ${payments.paging.total}`);
  for (const p of payments.results) {
    console.log(`  #${p.id} — ${p.status} — $${p.transaction_amount}`);
  }

  console.log("\n--- Done ---");
}

run().catch((err) => {
  console.error("Integration test failed:", err);
  process.exit(1);
});
