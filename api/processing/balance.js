/* eslint-disable no-else-return */
import { db, SWAP_TYPE, TYPE, transaction } from '../utils';
import { bnb } from '../helpers';

export async function checkAllBalances() {
  const lokiBalance = await getBalances(SWAP_TYPE.LOKI_TO_BLOKI);
  printBalance(SWAP_TYPE.LOKI_TO_BLOKI, lokiBalance);

  const bnbBalance = await getBalances(SWAP_TYPE.BLOKI_TO_LOKI);
  printBalance(SWAP_TYPE.BLOKI_TO_LOKI, bnbBalance);
}

function printBalance(swapType, balance) {
  const receiveCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'LOKI' : 'BLOKI';
  const swapCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'BLOKI' : 'LOKI';
  console.log(`${receiveCurrency} to ${swapCurrency}:`);
  console.log(` received: ${balance.transaction / 1e9} ${receiveCurrency}`);
  console.log(` swapped: ${balance.swap / 1e9} ${swapCurrency}`);
  if (balance.transaction !== balance.swap) console.log(' \n WARNING: AMOUNTS DO NOT MATCH! PLEASE TRY SWEEPING');
  console.log('');
}

/**
 * Get both the transaction and swap balance for the given swap type.
 * @param {string} swapType The swap type.
 */
export async function getBalances(swapType) {
  const now = Date.now();
  const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);

  const accountType = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? TYPE.LOKI : TYPE.BNB;
  const transactionBalance = await getBalanceFromIncomingTransactions(accountType, twoDaysAgo, now);
  const swapBalance = await getSwapBalance(swapType, twoDaysAgo, now);
  return {
    transaction: transactionBalance,
    swap: swapBalance,
  };
}

/**
 * Get the total balance of the swaps in the database of the given type.
 * @param {string} swapType The swap type
 * @param {number} from The date to get incoming transactions from. The lower bound.
 * @param {number} to The date to get incoming transactions to. The upper bound.
 */
export async function getSwapBalance(swapType, from, to) {
  const swaps = await db.getAllSwaps(swapType);
  const filtered = swaps.filter(s => !(s.created > to || s.created < from));
  // Sum up the amounts
  return filtered.reduce((total, current) => total + parseInt(current.amount, 10), 0);
}

/**
 * Get the total balance of the incoming transactions for the given account types.
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
    const lokiTransactions = await Promise.all(promises).then(array => array.flat());

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
    const bnbClientAccounts = await db.getClientAccounts(TYPE.BNB);
    const clientMemos = bnbClientAccounts.map(c => c.account.memo);

    // Only get the transactions with memos that we have
    const memoTransactions = transactions.filter(t => {
      const { memo } = t;
      return memo && memo.length > 0 && clientMemos.includes(memo);
    });

    // Filter out all transactions that don't fit our date ranges
    filtered = memoTransactions.filter(tx => {
      const timestamp = Date.parse(tx.timeStamp);
      return !(timestamp > to || timestamp < from);
    });
  }

  // Sum up the amounts
  return filtered.reduce((total, current) => total + parseInt(current.amount, 10), 0);
}

export async function printBNBTransactionsWithIncorrectMemo() {
  // Get all our incoming transactions which contain a memo
  const ourAddress = bnb.getOurAddress();
  const transactions = await transaction.getIncomingBNBTransactions(ourAddress);
  const bnbClientAccounts = await db.getClientAccounts(TYPE.BNB);
  const clientMemos = bnbClientAccounts.filter(c => c.account.memo);
  const unkownMemoTransactions = transactions.filter(t => {
    const { memo } = t;
    return memo && memo.length > 0 && !clientMemos.includes(memo);
  });

  unkownMemoTransactions.forEach(t => {
    console.info(`hash: ${t.hash}\namount: ${t.amount / 1e9} BLOKI\nmemo: ${t.memo}\ntimestamp: ${t.timeStamp}\n\n`);
  });
}
