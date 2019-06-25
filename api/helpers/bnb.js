import ApiClient from '@binance-chain/javascript-sdk';
import config from 'config';

const bnConfig = config.get('binance');

/**
 * Create an account.
 * This account will be created with a random mnemonic.
 *
 * @returns {{ privateKey: string, address: string, mnemonic: string }} The new bnb account.
 */
export function createAccountWithMnemonic() {
  const client = getClient();
  return client.createAccountWithMneomnic();
}

/**
 * Generates a keystore object (web3 secret storage format) given a private key to store and a password.
 * @param {string} privateKey the private key hexstring.
 * @param {string} password the password.
 * @returns the keystore object.
 */
export function generateKeyStore(privateKey, password) {
  return ApiClient.crypto.generateKeyStore(privateKey, password);
}

/**
 * Validate an address.
 * @param {string} address The BNB address to validate.
 * @returns {boolean} Wether the given `address` is valid or not.
 */
export function validateAddress(address) {
  return ApiClient.crypto.checkAddress(address);
}

/**
 * Get all incoming transactions sent to `address`.
 * This will only fetch transactions up to a month before the current date.
 *
 * @param {string} address The address we are getting the transactions from.
 * @returns {Promise<[object]>} An array of BNB transactions.
 */
export async function getIncomingTransactions(address) {
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
    const data = await client._httpClient.request('get', `/api/v1/transactions?address=${address}&startTime=${startTime}&side=RECEIVE`);
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
