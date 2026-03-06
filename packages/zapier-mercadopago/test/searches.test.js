'use strict';

const findPayment = require('../src/searches/find_payment');
const searchPayments = require('../src/searches/search_payments');
const getMerchantInfo = require('../src/searches/get_merchant_info');

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

describe('find_payment - path traversal prevention', () => {
  it('should reject payment_id with path traversal characters', async () => {
    const z = createMockZ({ id: 1 });
    const bundle = {
      inputData: {
        payment_id: '../../users/me',
      },
    };

    await expect(findPayment.operation.perform(z, bundle)).rejects.toThrow('Invalid payment ID: must be numeric.');
  });

  it('should reject non-numeric payment_id', async () => {
    const z = createMockZ({ id: 1 });
    const bundle = {
      inputData: {
        payment_id: 'abc',
      },
    };

    await expect(findPayment.operation.perform(z, bundle)).rejects.toThrow('Invalid payment ID: must be numeric.');
  });

  it('should allow numeric payment_id', async () => {
    const z = createMockZ({ id: 77777 });
    const bundle = {
      inputData: {
        payment_id: '77777',
      },
    };

    const result = await findPayment.operation.perform(z, bundle);
    expect(result).toHaveLength(1);
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

describe('get_merchant_info', () => {
  it('returns merchant data wrapped in an array', async () => {
    const merchantData = {
      id: 123456789,
      nickname: 'TESTMERCHANT',
      email: 'merchant@example.com',
      country_id: 'AR',
    };

    const z = createMockZ(merchantData);
    const bundle = { inputData: {} };

    const result = await getMerchantInfo.operation.perform(z, bundle);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(merchantData);
  });

  it('calls the users/me endpoint', async () => {
    const z = createMockZ({ id: 1 });
    const bundle = { inputData: {} };

    await getMerchantInfo.operation.perform(z, bundle);

    const callArgs = z.request.mock.calls[0][0];
    expect(callArgs.method).toBe('GET');
    expect(callArgs.url).toBe('https://api.mercadopago.com/users/me');
  });
});
