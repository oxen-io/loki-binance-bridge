/* eslint-disable import/prefer-default-export */
import { bnb, loki } from '../helpers';
import { TYPE } from './constants';
import * as db from './db';

/**
 * Get incoming transactions to the given address.
 *
 * @param {string} accountAddress The account address.
 * @param {'loki'|'bnb'} accountType The account type.
 * @return {Promise<{ hash, amount }>} An array of incoming transactions
 */
export async function getIncomingTransactions(accountAddress, accountType) {
  switch (accountType) {
    case TYPE.BNB: {
      const transactions = await bnb.getIncomingTransactions(accountAddress);
      return transactions.map(tx => ({
        hash: tx.txHash,
        amount: tx.value,
      }));
    }
    case TYPE.LOKI: {
      const lokiAccount = await db.getLokiAccount(accountAddress);
      if (!lokiAccount) return [];

      const transactions = await loki.getIncomingTransactions(lokiAccount.address_index);

      // We only want transactions with a certain number of confirmations
      return transactions.filter(tx => tx.confirmations >= 6).map(tx => ({
        hash: tx.txid,
        amount: tx.amount,
      }));
    }
    default:
      return [];
  }
}
