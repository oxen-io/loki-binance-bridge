import ApiClient from '@binance-chain/javascript-sdk';
import config from 'config';

const { api, network, symbol } = config.get('binance');

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
  return this.getClient().checkAddress(address);
}

/**
 * Get the wallet address from a mnemonic.
 * @param {string} mnemonic The mnemonic words.
 */
export function getAddressFromMnemonic(mnemonic) {
  const cleanedMnemonic = mnemonic.replace(/(\r\n|\n|\r)/gm, '');
  const { address } = this.getClient().recoverAccountFromMnemonic(cleanedMnemonic);

  return address;
}

/**
 * Get all incoming transactions sent to `address`.
 * This will only fetch transactions up to a month before the current date.
 *
 * @param {string} address The address we are getting the transactions from.
 * @returns {Promise<[object]>} An array of BNB transactions with the value being in 1e9 format.
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
    const data = await client._httpClient.request('get', `/api/v1/transactions?address=${address}&startTime=${startTime}&txAsset=${symbol}&side=RECEIVE&txType=TRANSFER`);
    const transactions = data.result.tx || [];
    return transactions.map(t => ({
      ...t,
      value: to1e9Amount(t.value),
    }));
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
 * @param {[{ to: string, coins: [{ denom: string, amount: number }]}]} outputs The outputs to send. The amount must be in 1e9 format.
 * @param {string} message The message to attach to the transaction.
 * @returns {Promise<[string]>} The transaction hashes
 */
export async function multiSend(mnemonic, outputs, message) {
  const normalised = outputs.map(o => {
    const normalisedCoins = o.coins.map(c => ({ ...c, amount: toDecimalAmount(c.amount) }));
    return {
      ...o,
      coins: normalisedCoins,
    };
  });

  const cleanedMnemonic = mnemonic.replace(/(\r\n|\n|\r)/gm, '');

  const client = getClient();
  const { privateKey, address } = client.recoverAccountFromMnemonic(cleanedMnemonic);

  await client.setPrivateKey(privateKey);
  await client.initChain();

  // eslint-disable-next-line no-underscore-dangle
  const data = await client._httpClient.request('get', `/api/v1/account/${address}/sequence`);
  const sequence = (data && data.result && data.result.sequence) || 0;

  try {
    const sendResult = await client.multiSend(address, normalised, message, sequence);
    if (!sendResult || !sendResult.result || sendResult.result.length === 0) {
      throw new Error(`[BNB] Failed to send transactions: ${String(sendResult)}`);
    }
    return sendResult.result.map(r => r.hash);
  } catch (e) {
    throw new Error(e.message);
  }
}

/**
 * Convert the given value in decimal format to a 1e9 format
 * @param {number} value The value in decimal format
 */
export function to1e9Amount(value) {
  return (parseFloat(value) * 1e9).toFixed(0);
}

/**
 * Convert the given value in 1e9 format to the a decimal format
 * @param {number} value The value in 1e9 format
 */
export function toDecimalAmount(value) {
  return parseFloat(value) / 1e9;
}

function getClient() {
  const client = new ApiClient(api);
  client.chooseNetwork(network);
  return client;
}
