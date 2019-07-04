/* eslint-disable no-else-return */
import { db, SWAP_TYPE, TYPE, transaction } from '../utils';
import { bnb, loki } from '../helpers';

export async function checkAllBalances() {
  const lokiBalance = await getBalances(SWAP_TYPE.LOKI_TO_BLOKI);
  console.log(lokiBalance);

  const bnbBalance = await getBalances(SWAP_TYPE.BLOKI_TO_LOKI);
  console.log(bnbBalance);
}

export async function getBalances(swapType) {
  const now = Date.now();
  const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);

  const accountType = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? TYPE.LOKI : TYPE.BNB;
  const transactionBalance = await getBalanceFromIncomingTransactions(accountType, twoDaysAgo, now);
  const swapBalance = await getSwapBalance(swapType, twoDaysAgo, now);
  return {
    transactionBalance,
    swapBalance,
  };
}

export async function getSwapBalance(swapType, from, to) {
  const swaps = await db.getAllSwaps(swapType);
  const filtered = swaps.filter(s => !(s.created > to || s.created < from));
  // Sum up the amounts
  return filtered.reduce((total, current) => total + parseInt(current.amount, 10), 0);
}

/**
 * Get balance of the incoming transactions for the given account types.
 * @param {string} accountType The account type
 * @param {number} from The date to get incoming transactions from. The lower bound.
 * @param {number} to The date to get incoming transactions to. The upper bound.
 */
export async function getBalanceFromIncomingTransactions(accountType, from, to) {
  const clientAccounts = await db.getClientAccounts(accountType);

  let filtered = [];

  if (accountType === TYPE.LOKI) {
    // Get all incoming transactions from the client accounts
    const promises = clientAccounts.map(async c => transaction.getIncomingLokiTransactions(c.account.addressIndex));
    const lokiTransactions = await Promise.all(promises).then(array => array.flatMap(t => t));

    // Filter out all transactions that don't fit our date ranges
    filtered = lokiTransactions.filter(tx => {
      // Loki timestamps are in seconds
      const timestamp = tx.timestamp * 1000;
      return !(timestamp > to || timestamp < from);
    });

    // Sum up the amounts
    return filtered.reduce((total, current) => total + parseInt(current.amount, 10), 0);
  } else if (accountType === TYPE.BNB) {
    // Get all our incoming transactions which contain a memo
    const ourAddress = bnb.getOurAddress();
    const transactions = await transaction.getIncomingBNBTransactions(ourAddress, from);
    const memoTransactions = transactions.filter(t => t.memo && t.memo.length > 0);

    // Filter out all transactions that don't fit our date ranges
    filtered = memoTransactions.filter(tx => {
      const timestamp = Date.parse(tx.timeStamp);
      return !(timestamp > to || timestamp < from);
    });
  }

  // Sum up the amounts
  return filtered.reduce((total, current) => total + parseInt(current.amount, 10), 0);
}
