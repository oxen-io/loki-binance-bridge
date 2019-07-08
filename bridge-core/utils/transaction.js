/* eslint-disable import/prefer-default-export */
import { TYPE } from './constants';

/**
 * Helper class for incoming transactions
 */
export default class TransactionHelper {

  /**
   * Create a helper instance.
   * @param {{ binance: { client, ourAddress }, loki: { client, minConfirmations }}} config The helper config.
   */
  constructor(config) {
    const { binance, loki } = config;

    this.bnb = binance.client;
    this.ourBNBAddress = binance.ourAddress;

    this.loki = loki.client;
    this.minLokiConfirmations = loki.minConfirmations;
  }
  /**
   * Get incoming transactions to the given account.
   *
   * @param {any} account The account.
   * @param {'loki'|'bnb'} accountType The account type.
   * @return {Promise<{ hash, amount }>} An array of incoming transactions
   */
  async getIncomingTransactions(account, accountType) {
    switch (accountType) {
      case TYPE.BNB: {
        const { memo } = account;
        const transactions = await this.getIncomingBNBTransactions(this.ourBNBAddress);
        return transactions
          .filter(tx => tx.memo.trim() === memo.trim())
          .map(({ hash, amount }) => ({ hash, amount }));
      }
      case TYPE.LOKI: {
        const { addressIndex } = account;

        // We only want transactions with a certain number of confirmations
        const transactions = await this.getIncomingLokiTransactions(addressIndex);
        return transactions
          .filter(tx => tx.confirmations >= this.minLokiConfirmations)
          .map(({ hash, amount }) => ({ hash, amount }));
      }
      default:
        return [];
    }
  }

  /**
   * Get incoming transactions from the given BNB address.
   * @param {string} address The BNB address
   * @param {number} since The time since a given date in milliseconds.
   */
  async getIncomingBNBTransactions(address, since = null) {
    const transactions = await this.bnb.getIncomingTransactions(address, since);
    return transactions.map(tx => ({
      ...tx,
      hash: tx.txHash,
      amount: tx.value,
    }));
  }

  /**
   * Get incoming transactions from the given LOKI address.
   * @param {number} addressIndex The LOKI address index.
   * @param {{ pool: boolean }} options Any additional options
   */
  async getIncomingLokiTransactions(addressIndex, options = {}) {
    const transactions = await this.loki.getIncomingTransactions(addressIndex, options);
    return transactions.map(tx => ({
      ...tx,
      hash: tx.txid,
      amount: tx.amount,
    }));
  }
};

