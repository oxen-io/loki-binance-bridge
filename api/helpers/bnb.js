import ApiClient from '@binance-chain/javascript-sdk';
import config from 'config';

const { api, network } = config.get('binance');

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

/**
 * Get all the balances from the given `address`
 *
 * @param {string} address The bnb address to get balances from.
 * @returns {Promise<[{ symbol, free, locked, frozen }]>} An array of balances.
 */
export async function getBalances(address) {
  try {
    const client = getClient();
    const balances = await client.getBalance(address);
    return balances || [];
  } catch (e) {
    console.log('[BNB] Failed to get balance: ', e);
    return [];
  }
}

/**
 * Send multiple transactions.
 *
 * @param {string} mnemonic The mnemonic of the wallet to send from.
 * @param {[{ to: string, coins: [{ denom: string, amount: number }]}]} outputs The outputs to send.
 * @param {string} message The message to attach to the transaction.
 * @returns {Promise<[string]>} The transaction hashes
 */
export async function multiSend(mnemonic, outputs, message) {
  const cleanedMnemonic = mnemonic.replace(/(\r\n|\n|\r)/gm, '');
  const privateKey = ApiClient.crypto.getPrivateKeyFromMnemonic(cleanedMnemonic);

  const client = getClient();
  await client.setPrivateKey(privateKey);
  await client.initChain();

  const address = client.getClientKeyAddress();
  // eslint-disable-next-line no-underscore-dangle
  const res = await client._httpClient.request('get', `/api/v1/account/${address}/sequence`);
  const sequence = (res && res.data && res.data.sequence) || 0;

  const sendResult = client.multiSend(address, outputs, message, sequence);

  if (!sendResult || !sendResult.result || sendResult.result.length === 0) {
    throw new Error(`[BNB] Failed to send transactions: ${String(sendResult)}`);
  }

  return sendResult.result.map(r => r.hash);
}

function getClient() {
  const client = new ApiClient(api);
  client.chooseNetwork(network);
  return client;
}
