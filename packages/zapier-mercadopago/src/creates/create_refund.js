'use strict';

const perform = async (z, bundle) => {
  const paymentId = bundle.inputData.payment_id;
  if (!/^\d+$/.test(paymentId)) {
    throw new Error('Invalid payment ID: must be numeric.');
  }

  const body = {};

  if (bundle.inputData.amount) {
    body.amount = parseFloat(bundle.inputData.amount);
  }

  const response = await z.request({
    method: 'POST',
    url: `https://api.mercadopago.com/v1/payments/${paymentId}/refunds`,
    body,
  });

  return response.data;
};

module.exports = {
  key: 'create_refund',
  noun: 'Refund',
  display: {
    label: 'Create Refund',
    description: 'Creates a full or partial refund for a Mercado Pago payment.',
  },
  operation: {
    inputFields: [
      {
        key: 'payment_id',
        label: 'Payment ID',
        type: 'string',
        required: true,
        helpText: 'The ID of the payment to refund.',
      },
      {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        required: false,
        helpText: 'Amount to refund. Leave empty for a full refund.',
      },
    ],
    perform,
    sample: {
      id: 987654321,
      payment_id: 123456789,
      amount: 100.0,
      status: 'approved',
      date_created: '2025-01-15T10:30:00.000-04:00',
    },
  },
};
