'use strict';

const findPayment = require('../src/searches/find_payment');
const searchPayments = require('../src/searches/search_payments');

const createMockZ = (responseData) => ({
  request: jest.fn().mockResolvedValue({ data: responseData }),
});

describe('find_payment', () => {
  it('returns result wrapped in an array', async () => {
    const paymentData = {
      id: 99999,
      status: 'approved',
      transaction_amount: 150.0,
    };

    const z = createMockZ(paymentData);
    const bundle = {
      inputData: {
        payment_id: '99999',
      },
    };

    const result = await findPayment.operation.perform(z, bundle);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(paymentData);
  });

  it('calls correct URL with payment ID', async () => {
    const z = createMockZ({ id: 77777 });
    const bundle = {
      inputData: {
        payment_id: '77777',
      },
    };

    await findPayment.operation.perform(z, bundle);

    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.method).toBe('GET');
    expect(callArgs.url).toBe('https://api.mercadopago.com/v1/payments/77777');
  });
});

describe('search_payments', () => {
  it('builds query params correctly with defaults', async () => {
    const z = createMockZ({
      results: [
        { id: 1, status: 'approved' },
        { id: 2, status: 'pending' },
      ],
    });
    const bundle = {
      inputData: {},
    };

    const result = await searchPayments.operation.perform(z, bundle);

    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.method).toBe('GET');
    expect(callArgs.url).toBe('https://api.mercadopago.com/v1/payments/search');
    expect(callArgs.params.sort).toBe('date_created');
    expect(callArgs.params.criteria).toBe('desc');
    expect(callArgs.params.limit).toBe(10);
    expect(callArgs.params.status).toBeUndefined();
    expect(result).toHaveLength(2);
  });

  it('includes status filter when provided', async () => {
    const z = createMockZ({ results: [] });
    const bundle = {
      inputData: {
        status: 'approved',
        limit: 5,
        sort: 'date_approved',
        criteria: 'asc',
      },
    };

    await searchPayments.operation.perform(z, bundle);

    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.params.status).toBe('approved');
    expect(callArgs.params.limit).toBe(5);
    expect(callArgs.params.sort).toBe('date_approved');
    expect(callArgs.params.criteria).toBe('asc');
  });

  it('returns results array from response', async () => {
    const z = createMockZ({
      results: [{ id: 10 }, { id: 20 }, { id: 30 }],
    });
    const bundle = { inputData: {} };

    const result = await searchPayments.operation.perform(z, bundle);

    expect(result).toEqual([{ id: 10 }, { id: 20 }, { id: 30 }]);
  });
});
