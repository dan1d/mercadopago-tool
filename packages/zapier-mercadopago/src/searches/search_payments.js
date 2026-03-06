'use strict';

const perform = async (z, bundle) => {
  const params = {
    sort: bundle.inputData.sort || 'date_created',
    criteria: bundle.inputData.criteria || 'desc',
    limit: bundle.inputData.limit || 10,
  };

  if (bundle.inputData.status) {
    params.status = bundle.inputData.status;
  }

  const response = await z.request({
    method: 'GET',
    url: 'https://api.mercadopago.com/v1/payments/search',
    params,
  });

  return response.data.results;
};

module.exports = {
  key: 'search_payments',
  noun: 'Payment',
  display: {
    label: 'Search Payments',
    description: 'Searches for Mercado Pago payments with optional filters.',
  },
  operation: {
    inputFields: [
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        required: false,
        choices: {
          approved: 'Approved',
          pending: 'Pending',
          rejected: 'Rejected',
          cancelled: 'Cancelled',
          refunded: 'Refunded',
        },
        helpText: 'Filter payments by status.',
      },
      {
        key: 'limit',
        label: 'Limit',
        type: 'integer',
        required: false,
        default: '10',
        helpText: 'Maximum number of results to return.',
      },
      {
        key: 'sort',
        label: 'Sort By',
        type: 'string',
        required: false,
        default: 'date_created',
        helpText: 'Field to sort results by.',
      },
      {
        key: 'criteria',
        label: 'Sort Criteria',
        type: 'string',
        required: false,
        default: 'desc',
        choices: {
          desc: 'Descending',
          asc: 'Ascending',
        },
        helpText: 'Sort order.',
      },
    ],
    perform,
    sample: {
      id: 123456789,
      status: 'approved',
      transaction_amount: 100.0,
      currency_id: 'ARS',
      date_created: '2025-01-15T10:30:00.000-04:00',
    },
  },
};
