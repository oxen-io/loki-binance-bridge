import ApiClient from '@binance-chain/javascript-sdk';

function roundDown(number, decimals = 0) {
  return (Math.floor(number * (10 ** decimals)) / (10 ** decimals));
}

/**
 * A client to communicate with Binance chain.
 */
export default class BinanceClient {

  /**
   * Create a Binance client
   * @param {{ api: string, network: string, symbol: string }} config The client configuration
   */
  constructor(config) {
    const { api, network, symbol } = config;
    this.api = api;
    this.network = network;
    this.symbol = symbol;
  }

  /**
  * Validate an address.
  * @param {string} address The BNB address to validate.
  * @returns {boolean} Wether the given `address` is valid or not.
  */
  validateAddress(address) {
    return this.getClient().checkAddress(address);
  }

  /**
  * Get the wallet address from a mnemonic.
  * @param {string} mnemonic The mnemonic words.
  */
  getAddressFromMnemonic(mnemonic) {
    const cleanedMnemonic = mnemonic.replace(/(\r\n|\n|\r)/gm, '');
    const { address } = this.getClient().recoverAccountFromMnemonic(cleanedMnemonic);

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
  async getIncomingTransactions(address, since = null) {
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
      const client = this.getClient();
      // eslint-disable-next-line no-underscore-dangle, max-len
      const data = await client._httpClient.request('get', `/api/v1/transactions?address=${address}&startTime=${startTime}&txAsset=${this.symbol}&side=RECEIVE&txType=TRANSFER`);
      const transactions = data.result.tx || [];
      return this.get1e9Transactions(transactions);
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
  async getBalances(address) {
    try {
      const client = this.getClient();
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
  async multiSend(mnemonic, outputs, message) {
    const normalised = this.getDecimalOutputs(outputs);
    const cleanedMnemonic = mnemonic.replace(/(\r\n|\n|\r)/gm, '');

    const client = this.getClient();
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
  getDecimalOutputs(outputs) {
    return outputs.map(o => {
      // The amount in the output must be 8 decimals in length
      const normaliseAmount = amount => roundDown(toDecimalAmount(amount), 8);
      const normalisedCoins = o.coins.map(c => ({ ...c, amount: normaliseAmount(c.amount) }));
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
  get1e9Transactions(transactions) {
    return transactions.map(t => ({
      ...t,
      value: this.to1e9Amount(t.value),
    }));
  }

  /**
  * Convert the given value in decimal format to a 1e9 format
  * @param {number} value The value in decimal format
  */
  to1e9Amount(value) {
    return (parseFloat(value) * 1e9).toFixed(0);
  }

  /**
  * Convert the given value in 1e9 format to the a decimal format
  * @param {number} value The value in 1e9 format
  */
  toDecimalAmount(value) {
    return parseFloat(value) / 1e9;
  }

  getClient() {
    const client = new ApiClient(this.api);
    client.chooseNetwork(this.network);
    return client;
  }
}
