'use strict';

const addBearerToken = (request, z, bundle) => {
  if (bundle.authData.accessToken) {
    request.headers.Authorization = `Bearer ${bundle.authData.accessToken}`;
  }
  return request;
};

const test = async (z, bundle) => {
  const response = await z.request({
    method: 'GET',
    url: 'https://api.mercadopago.com/users/me',
  });
  return response.data;
};

const authentication = {
  type: 'custom',
  fields: [
    {
      key: 'accessToken',
      label: 'Access Token',
      type: 'string',
      required: true,
      helpText: 'Your Mercado Pago Access Token. Found in your MP developer dashboard under Credentials.',
    },
  ],
  test,
  connectionLabel: (z, bundle) => {
    return bundle.inputData.nickname || bundle.inputData.email;
  },
};

module.exports = {
  authentication,
  addBearerToken,
};
