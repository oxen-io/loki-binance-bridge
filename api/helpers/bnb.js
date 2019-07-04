import ApiClient from '@binance-chain/javascript-sdk';
import config from 'config';

const { api, network, symbol } = config.get('binance');

let ourAddress = null;

/**
 * Get the public address of the wallet provided in the config
 */
export function getOurAddress() {
  if (!ourAddress) {
    ourAddress = getAddressFromMnemonic(config.get('binance.wallet.mnemonic'));
  }
  return ourAddress;
}

/**
 * Validate an address.
 * @param {string} address The BNB address to validate.
 * @returns {boolean} Wether the given `address` is valid or not.
 */
export function validateAddress(address) {
  return getClient().checkAddress(address);
}

/**
 * Get the wallet address from a mnemonic.
 * @param {string} mnemonic The mnemonic words.
 */
export function getAddressFromMnemonic(mnemonic) {
  const cleanedMnemonic = mnemonic.replace(/(\r\n|\n|\r)/gm, '');
  const { address } = getClient().recoverAccountFromMnemonic(cleanedMnemonic);

  return address;
}

/**
 * Get all incoming transactions sent to `address`.
 * This will only fetch transactions up to a month before the current date.
 *
 * @param {string} address The address we are getting the transactions from.
 * @param {number} since The date in milliseconds. The minimum time is 3 months before now.
 * @returns {Promise<[object]>} An array of BNB transactions with the value being in 1e9 format.
 */
export async function getIncomingTransactions(address, since = null) {
  if (!address) {
    throw new Error('Address should not be falsy');
  }

  // Get the time x months before now
  const getXMonthBeforeNow = number => {
    // We want to get all transaction from a month before
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - number);
    startDate.setHours(0, 0, 0, 0);
    return startDate.getTime();
  };

  const time = since || getXMonthBeforeNow(1);
  const minTime = getXMonthBeforeNow(3);
  const startTime = Math.max(minTime, time);

  try {
    const client = getClient();
    // eslint-disable-next-line no-underscore-dangle, max-len
    const data = await client._httpClient.request('get', `/api/v1/transactions?address=${address}&startTime=${startTime}&txAsset=${symbol}&side=RECEIVE&txType=TRANSFER`);
    const transactions = data.result.tx || [];
    return get1e9Transactions(transactions);
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
  const normalised = getDecimalOutputs(outputs);
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
 * Convert given outputs and format them for sending to BNB.
 * This function assumes the `amount` in outputs is in 1e9 format.
 *
 * @param {[{ to: string, coins: [{ denom: string, amount: number }]}]} outputs The outputs.
 * @returns The outputs with the `amount` in decimal format
 */
export function getDecimalOutputs(outputs) {
  return outputs.map(o => {
    const normalisedCoins = o.coins.map(c => ({ ...c, amount: toDecimalAmount(c.amount) }));
    return {
      ...o,
      coins: normalisedCoins,
    };
  });
}

/**
 * Convert given transactions and format them for sending to BNB.
 * This function assumes the `value` in transactions is in decimal format.
 *
 * @param {[object]} transactions The transactions.
 * @returns The transactions with the `value` in 1e9 format
 */
export function get1e9Transactions(transactions) {
  return transactions.map(t => ({
    ...t,
    value: to1e9Amount(t.value),
  }));
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
