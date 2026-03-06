'use strict';

const perform = async (z, bundle) => {
  const body = {
    items: [
      {
        title: bundle.inputData.title,
        quantity: bundle.inputData.quantity || 1,
        currency_id: bundle.inputData.currency || 'ARS',
        unit_price: parseFloat(bundle.inputData.unit_price),
      },
    ],
  };

  if (bundle.inputData.notification_url) {
    body.notification_url = bundle.inputData.notification_url;
  }

  const hasBackUrls =
    bundle.inputData.back_url_success ||
    bundle.inputData.back_url_failure ||
    bundle.inputData.back_url_pending;

  if (hasBackUrls) {
    body.back_urls = {};
    if (bundle.inputData.back_url_success) {
      body.back_urls.success = bundle.inputData.back_url_success;
    }
    if (bundle.inputData.back_url_failure) {
      body.back_urls.failure = bundle.inputData.back_url_failure;
    }
    if (bundle.inputData.back_url_pending) {
      body.back_urls.pending = bundle.inputData.back_url_pending;
    }
  }

  const response = await z.request({
    method: 'POST',
    url: 'https://api.mercadopago.com/checkout/preferences',
    body,
  });

  return response.data;
};

module.exports = {
  key: 'create_payment_preference',
  noun: 'Payment Preference',
  display: {
    label: 'Create Payment Preference',
    description: 'Creates a new Mercado Pago checkout payment preference.',
  },
  operation: {
    inputFields: [
      {
        key: 'title',
        label: 'Title',
        type: 'string',
        required: true,
        helpText: 'Title of the item being sold.',
      },
      {
        key: 'quantity',
        label: 'Quantity',
        type: 'integer',
        required: true,
        default: '1',
        helpText: 'Number of units.',
      },
      {
        key: 'currency',
        label: 'Currency',
        type: 'string',
        required: true,
        default: 'ARS',
        helpText: 'Currency ID (e.g. ARS, BRL, MXN, USD).',
      },
      {
        key: 'unit_price',
        label: 'Unit Price',
        type: 'number',
        required: true,
        helpText: 'Price per unit.',
      },
      {
        key: 'notification_url',
        label: 'Notification URL',
        type: 'string',
        required: false,
        helpText: 'URL to receive IPN (Instant Payment Notification) webhooks.',
      },
      {
        key: 'back_url_success',
        label: 'Back URL (Success)',
        type: 'string',
        required: false,
        helpText: 'URL to redirect after successful payment.',
      },
      {
        key: 'back_url_failure',
        label: 'Back URL (Failure)',
        type: 'string',
        required: false,
        helpText: 'URL to redirect after failed payment.',
      },
      {
        key: 'back_url_pending',
        label: 'Back URL (Pending)',
        type: 'string',
        required: false,
        helpText: 'URL to redirect when payment is pending.',
      },
    ],
    perform,
    sample: {
      id: '123456789',
      init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789',
      sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789',
    },
  },
};
