'use strict';

const perform = async (z, bundle) => {
  const paymentId = bundle.inputData.payment_id;
  if (!/^\d+$/.test(paymentId)) {
    throw new Error('Invalid payment ID: must be numeric.');
  }

  const response = await z.request({
    method: 'GET',
    url: `https://api.mercadopago.com/v1/payments/${paymentId}`,
  });

  return [response.data];
};

module.exports = {
  key: 'find_payment',
  noun: 'Payment',
  display: {
    label: 'Find Payment',
    description: 'Finds a Mercado Pago payment by its ID.',
  },
  operation: {
    inputFields: [
      {
        key: 'payment_id',
        label: 'Payment ID',
        type: 'string',
        required: true,
        helpText: 'The ID of the payment to look up.',
      },
    ],
    perform,
    sample: {
      id: 123456789,
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 100.0,
      currency_id: 'ARS',
      description: 'Test payment',
      date_created: '2025-01-15T10:30:00.000-04:00',
      date_approved: '2025-01-15T10:30:05.000-04:00',
    },
  },
};
