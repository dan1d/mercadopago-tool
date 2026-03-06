'use strict';

const perform = async (z, bundle) => {
  const response = await z.request({
    method: 'GET',
    url: 'https://api.mercadopago.com/users/me',
  });

  return [response.data];
};

module.exports = {
  key: 'get_merchant_info',
  noun: 'Merchant',
  display: {
    label: 'Get Merchant Info',
    description: 'Retrieves the authenticated Mercado Pago merchant account information.',
  },
  operation: {
    inputFields: [],
    perform,
    sample: {
      id: 123456789,
      nickname: 'TESTUSER',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      country_id: 'AR',
      site_id: 'MLA',
    },
  },
};
