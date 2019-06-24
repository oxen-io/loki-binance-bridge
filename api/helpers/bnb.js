import ApiClient from '@binance-chain/javascript-sdk';
import config from 'config';

const bnConfig = config.get('binance');

function createAccountWithMnemonic() {
  const client = getClient();
  return client.createAccountWithMneomnic();
}

function generateKeyStore(privateKey, password) {
  return ApiClient.crypto.generateKeyStore(privateKey, password);
}

function validateAddress(address) {
  return ApiClient.crypto.checkAddress(address);
}

function getIncomingTransactions(address) {
  if (!address) {
    throw new Error('Address should not be falsy');
  }

  const client = getClient();

  // We want to get all transaction from a month before
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1);
  startDate.setHours(0, 0, 0, 0);
  const startTime = startDate.getTime();

  try {
    // eslint-disable-next-line no-underscore-dangle
    const data = client._httpClient.request('get', `/api/v1/transactions?address=${address}&startTime=${startTime}&side=RECEIVE`);
    return data.result.tx || [];
  } catch (err) {
    return [];
  }
}

function getClient() {
  const client = new ApiClient(bnConfig.api);
  client.chooseNetwork(bnConfig.network);
  client.initChain();
  return client;
}

export default {
  createAccountWithMnemonic,
  generateKeyStore,
  validateAddress,
  getIncomingTransactions,
};
