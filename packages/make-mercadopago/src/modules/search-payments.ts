import { MakeClient } from "../api/mercadopago-client.js";
import { buildSearchQuery, SearchParams } from "../api/requests.js";

export interface SearchPaymentsResult {
  results: Record<string, unknown>[];
  paging: {
    total: number;
    limit: number;
    offset: number;
  };
}

export async function searchPayments(
  client: MakeClient,
  params?: SearchParams
): Promise<SearchPaymentsResult> {
  const query = buildSearchQuery(params);
  const path = query ? `/v1/payments/search?${query}` : "/v1/payments/search";

  const response = await client.get<SearchPaymentsResult>(path);

  return {
    results: response.results,
    paging: response.paging,
  };
}
