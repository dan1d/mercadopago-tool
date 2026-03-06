'use strict';

const { authentication, addBearerToken } = require('./authentication');

const createPaymentPreference = require('./creates/create_payment_preference');
const createRefund = require('./creates/create_refund');

const findPayment = require('./searches/find_payment');
const searchPayments = require('./searches/search_payments');

const paymentUpdated = require('./triggers/payment_updated');

module.exports = {
  version: require('../package.json').version,
  platformVersion: require('../package.json').zapier.platformVersion,

  authentication,

  beforeRequest: [addBearerToken],

  afterResponse: [],

  creates: {
    [createPaymentPreference.key]: createPaymentPreference,
    [createRefund.key]: createRefund,
  },

  searches: {
    [findPayment.key]: findPayment,
    [searchPayments.key]: searchPayments,
  },

  triggers: {
    [paymentUpdated.key]: paymentUpdated,
  },
};
