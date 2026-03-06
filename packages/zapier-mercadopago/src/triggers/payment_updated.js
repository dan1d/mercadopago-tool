'use strict';

const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'GET',
    url: 'https://api.mercadopago.com/v1/payments/search',
    params: {
      sort: 'date_last_updated',
      criteria: 'desc',
      limit: 10,
    },
  });

  return response.data.results;
};

module.exports = {
  key: 'payment_updated',
  noun: 'Payment',
  display: {
    label: 'Payment Updated',
    description: 'Triggers when a payment is created or updated in Mercado Pago.',
  },
  operation: {
    type: 'polling',
    inputFields: [],
    perform,
    sample: {
      id: 123456789,
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 250.0,
      currency_id: 'ARS',
      description: 'Product purchase',
      date_created: '2025-01-15T10:30:00.000-04:00',
      date_last_updated: '2025-01-15T10:35:00.000-04:00',
    },
  },
};
