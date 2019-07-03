/* eslint-disable import/prefer-default-export */
import config from 'config';
import { bnb, loki } from '../helpers';
import { TYPE } from './constants';

/**
 * Get incoming transactions to the given account.
 *
 * @param {any} account The account.
 * @param {'loki'|'bnb'} accountType The account type.
 * @return {Promise<{ hash, amount }>} An array of incoming transactions
 */
export async function getIncomingTransactions(account, accountType) {
  switch (accountType) {
    case TYPE.BNB: {
      const ourAddress = bnb.getOurAddress();
      const { memo } = account;
      const transactions = await getIncomingBNBTransactions(ourAddress);
      return transactions.filter(t => t.memo.trim() === memo.trim());
    }
    case TYPE.LOKI: {
      const { addressIndex } = account;
      return getIncomingLokiTransactions(addressIndex);
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
export async function getIncomingBNBTransactions(address, since = null) {
  const transactions = await bnb.getIncomingTransactions(address, since);
  return transactions.map(tx => ({
    hash: tx.txHash,
    amount: tx.value,
    memo: tx.memo,
  }));
}

/**
 * Get incoming transactions from the given LOKI address
 * @param {number} addressIndex The LOKI address index
 */
export async function getIncomingLokiTransactions(addressIndex) {
  const transactions = await loki.getIncomingTransactions(addressIndex);
  const minConfirmations = config.get('loki.minConfirmations');

  // We only want transactions with a certain number of confirmations
  return transactions.filter(tx => tx.confirmations >= minConfirmations).map(tx => ({
    hash: tx.txid,
    amount: tx.amount,
  }));
}
