import ApiClient from '@binance-chain/javascript-sdk';
import config from 'config';

const bnConfig = config.get('binance');

function createAccountWithMnemonic() {
  const client = ApiClient(bnConfig.api);
  client.chooseNetwork(bnConfig.network);
  return client.createAccountWithMneomnic();
}

function generateKeyStore(privateKey, password) {
  return ApiClient.crypto.generateKeyStore(privateKey, password);
}

function validateAddress(address) {
  return ApiClient.crypto.checkAddress(address);
}

export default {
  createAccountWithMnemonic,
  generateKeyStore,
  validateAddress,
};
