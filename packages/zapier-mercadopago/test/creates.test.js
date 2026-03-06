'use strict';

const createPaymentPreference = require('../src/creates/create_payment_preference');
const createRefund = require('../src/creates/create_refund');

const createMockZ = (responseData) => ({
  request: jest.fn().mockResolvedValue({ data: responseData }),
});

describe('create_payment_preference', () => {
  it('sends correct body with items array', async () => {
    const mockResponse = {
      id: '999',
      init_point: 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=999',
      sandbox_init_point: 'https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=999',
    };

    const z = createMockZ(mockResponse);
    const bundle = {
      inputData: {
        title: 'Test Product',
        quantity: 2,
        currency: 'ARS',
        unit_price: '49.99',
      },
    };

    const result = await createPaymentPreference.operation.perform(z, bundle);

    expect(z.request).toHaveBeenCalledTimes(1);
    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.method).toBe('POST');
    expect(callArgs.url).toBe('https://api.mercadopago.com/checkout/preferences');
    expect(callArgs.body.items).toHaveLength(1);
    expect(callArgs.body.items[0]).toEqual({
      title: 'Test Product',
      quantity: 2,
      currency_id: 'ARS',
      unit_price: 49.99,
    });
    expect(result).toEqual(mockResponse);
  });

  it('includes back_urls when provided', async () => {
    const z = createMockZ({ id: '1000' });
    const bundle = {
      inputData: {
        title: 'Product',
        quantity: 1,
        currency: 'ARS',
        unit_price: '100',
        back_url_success: 'https://example.com/success',
        back_url_failure: 'https://example.com/failure',
        back_url_pending: 'https://example.com/pending',
      },
    };

    await createPaymentPreference.operation.perform(z, bundle);

    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.body.back_urls).toEqual({
      success: 'https://example.com/success',
      failure: 'https://example.com/failure',
      pending: 'https://example.com/pending',
    });
  });

  it('includes notification_url when provided', async () => {
    const z = createMockZ({ id: '1001' });
    const bundle = {
      inputData: {
        title: 'Product',
        quantity: 1,
        currency: 'ARS',
        unit_price: '50',
        notification_url: 'https://example.com/webhook',
      },
    };

    await createPaymentPreference.operation.perform(z, bundle);

    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.body.notification_url).toBe('https://example.com/webhook');
  });

  it('omits back_urls when none are provided', async () => {
    const z = createMockZ({ id: '1002' });
    const bundle = {
      inputData: {
        title: 'Product',
        quantity: 1,
        currency: 'ARS',
        unit_price: '25',
      },
    };

    await createPaymentPreference.operation.perform(z, bundle);

    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.body.back_urls).toBeUndefined();
  });
});

describe('create_refund', () => {
  it('sends POST to correct refund URL', async () => {
    const mockResponse = {
      id: 555,
      payment_id: 12345,
      amount: 100,
      status: 'approved',
    };

    const z = createMockZ(mockResponse);
    const bundle = {
      inputData: {
        payment_id: '12345',
      },
    };

    const result = await createRefund.operation.perform(z, bundle);

    expect(z.request).toHaveBeenCalledTimes(1);
    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.method).toBe('POST');
    expect(callArgs.url).toBe('https://api.mercadopago.com/v1/payments/12345/refunds');
    expect(callArgs.body).toEqual({});
    expect(result).toEqual(mockResponse);
  });

  it('includes amount for partial refund', async () => {
    const z = createMockZ({ id: 556, amount: 50 });
    const bundle = {
      inputData: {
        payment_id: '12345',
        amount: '50.00',
      },
    };

    await createRefund.operation.perform(z, bundle);

    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.body.amount).toBe(50.0);
  });
});
