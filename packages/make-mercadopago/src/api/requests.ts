export interface PreferenceParams {
  title: string;
  quantity: number;
  currency: string;
  unitPrice: number;
  backUrls?: {
    success?: string;
    failure?: string;
    pending?: string;
  };
  notificationUrl?: string;
  externalReference?: string;
}

export interface SearchParams {
  status?: string;
  externalReference?: string;
  sort?: string;
  criteria?: string;
  limit?: number;
  offset?: number;
}

export function buildPreferencePayload(params: PreferenceParams): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    items: [
      {
        title: params.title,
        quantity: params.quantity,
        currency_id: params.currency,
        unit_price: params.unitPrice,
      },
    ],
  };

  if (params.backUrls) {
    payload.back_urls = {
      ...(params.backUrls.success && { success: params.backUrls.success }),
      ...(params.backUrls.failure && { failure: params.backUrls.failure }),
      ...(params.backUrls.pending && { pending: params.backUrls.pending }),
    };
  }

  if (params.notificationUrl) {
    payload.notification_url = params.notificationUrl;
  }

  if (params.externalReference) {
    payload.external_reference = params.externalReference;
  }

  return payload;
}

export function buildSearchQuery(params?: SearchParams): string {
  const searchParams = new URLSearchParams();

  if (!params) {
    return searchParams.toString();
  }

  if (params.status) {
    searchParams.set("status", params.status);
  }

  if (params.externalReference) {
    searchParams.set("external_reference", params.externalReference);
  }

  if (params.sort) {
    searchParams.set("sort", params.sort);
  }

  if (params.criteria) {
    searchParams.set("criteria", params.criteria);
  }

  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }

  if (params.offset !== undefined) {
    searchParams.set("offset", String(params.offset));
  }

  return searchParams.toString();
}

export function buildRefundPayload(amount?: number): Record<string, unknown> {
  if (amount !== undefined) {
    return { amount };
  }
  return {};
}
