'use strict';

const paymentUpdated = require('../src/triggers/payment_updated');

const createMockZ = (responseData) => ({
  request: jest.fn().mockResolvedValue({ data: responseData }),
});

describe('payment_updated', () => {
  it('returns results from payments search', async () => {
    const payments = [
      { id: 1, status: 'approved', transaction_amount: 100 },
      { id: 2, status: 'pending', transaction_amount: 200 },
    ];

    const z = createMockZ({ results: payments });
    const bundle = { inputData: {} };

    const result = await paymentUpdated.operation.perform(z, bundle);

    expect(result).toEqual(payments);
    expect(result).toHaveLength(2);
  });

  it('calls search endpoint with correct params', async () => {
    const z = createMockZ({ results: [] });
    const bundle = { inputData: {} };

    await paymentUpdated.operation.perform(z, bundle);

    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.method).toBe('GET');
    expect(callArgs.url).toBe('https://api.mercadopago.com/v1/payments/search');
    expect(callArgs.params.sort).toBe('date_last_updated');
    expect(callArgs.params.criteria).toBe('desc');
    expect(callArgs.params.limit).toBe(10);
  });

  it('returns empty array when no payments exist', async () => {
    const z = createMockZ({ results: [] });
    const bundle = { inputData: {} };

    const result = await paymentUpdated.operation.perform(z, bundle);

    expect(result).toEqual([]);
  });
});
