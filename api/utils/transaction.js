/* eslint-disable import/prefer-default-export */
import config from 'config';
import { bnb, loki } from '../helpers';
import { TYPE } from './constants';

const transaction = {
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
        const ourAddress = bnb.getOurAddress();
        const { memo } = account;
        const transactions = await transaction.getIncomingBNBTransactions(ourAddress);
        return transactions
          .filter(tx => tx.memo.trim() === memo.trim())
          .map(({ hash, amount }) => ({ hash, amount }));
      }
      case TYPE.LOKI: {
        const { addressIndex } = account;
        const minConfirmations = config.get('loki.minConfirmations');

        // We only want transactions with a certain number of confirmations
        const transactions = await transaction.getIncomingLokiTransactions(addressIndex);
        return transactions
          .filter(tx => tx.confirmations >= minConfirmations)
          .map(({ hash, amount }) => ({ hash, amount }));
      }
      default:
        return [];
    }
  },

  /**
   * Get incoming transactions from the given BNB address.
   * @param {string} address The BNB address
   * @param {number} since The time since a given date in milliseconds.
   */
  async getIncomingBNBTransactions(address, since = null) {
    const transactions = await bnb.getIncomingTransactions(address, since);
    return transactions.map(tx => ({
      ...tx,
      hash: tx.txHash,
      amount: tx.value,
    }));
  },

  /**
   * Get incoming transactions from the given LOKI address.
   * @param {number} addressIndex The LOKI address index.
   * @param {{ pool: boolean }} options Any additional options
   */
  async getIncomingLokiTransactions(addressIndex, options = {}) {
    const transactions = await loki.getIncomingTransactions(addressIndex, options);
    return transactions.map(tx => ({
      ...tx,
      hash: tx.txid,
      amount: tx.amount,
    }));
  },
};

export default transaction;
