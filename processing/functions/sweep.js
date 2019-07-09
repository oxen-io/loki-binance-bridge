/* eslint-disable no-restricted-syntax, no-else-return, max-len */
import { TYPE, SWAP_TYPE } from 'bridge-core';
import { db, transactionHelper, postgres } from '../core';

/**
 * Sweep any pending swaps
 */
export async function sweepAllPendingSwaps() {
  await sweepPendingLokiToBloki();
  await sweepPendingBlokiToLoki();
}

/**
 * Sweep any pending loki_to_bloki swaps
 */
export async function sweepPendingLokiToBloki() {
  console.info(`Sweeping ${SWAP_TYPE.LOKI_TO_BLOKI}`);

  // Get all the client accounts
  const clientAccounts = await db.getClientAccounts(TYPE.LOKI);

  // Get all incoming transactions from the client accounts
  const promises = clientAccounts.map(async c => {
    const { address } = c.account;
    const transactions = await transactionHelper.getIncomingTransactions(c.account, TYPE.LOKI);
    return transactions.map(t => ({ ...t, address }));
  });
  const lokiTransactions = await Promise.all(promises).then(array => array.flat());

  // Get all the deposit hases from the db
  const hashes = await db.getAllSwapDepositHashes(SWAP_TYPE.LOKI_TO_BLOKI);

  // Get all the new transactions
  const newTransactions = lokiTransactions.filter(t => !hashes.includes(t.hash));
  if (newTransactions.length === 0) {
    console.info(`No new ${SWAP_TYPE.LOKI_TO_BLOKI} transactions`);
    return;
  }

  // Go through all the transactions and add them to the client account
  const swapPromises = [];
  for (const newTransaction of newTransactions) {
    const clientAccount = clientAccounts.find(c => c.account.address === newTransaction.address);
    if (clientAccount) {
      swapPromises.push(db.insertSwap(newTransaction, clientAccount));
    }
  }

  const count = await postgres.tx(t => t.batch(promises));
  console.info(`Inserted ${count.length} swaps for ${SWAP_TYPE.LOKI_TO_BLOKI}\n`);
}

/**
 * Sweep any pending bloki_to_loki swaps
 */
export async function sweepPendingBlokiToLoki() {
  console.info(`Sweeping ${SWAP_TYPE.BLOKI_TO_LOKI}`);
  const ourAddress = transactionHelper.ourBNBAddress;

  // Get all our incoming transactions which contain a memo
  const transactions = await transactionHelper.getIncomingBNBTransactions(ourAddress);
  const memoTransactions = transactions.filter(t => t.memo && t.memo.length > 0);

  // Get all the deposit hases from the db
  const hashes = await db.getAllSwapDepositHashes(SWAP_TYPE.BLOKI_TO_LOKI);

  // Get all the new transactions
  const newTransactions = memoTransactions.filter(t => !hashes.includes(t.hash));
  if (newTransactions.length === 0) {
    console.info(`No new ${SWAP_TYPE.BLOKI_TO_LOKI} transactions`);
    return;
  }

  // Get all the client accounts
  const memos = newTransactions.map(t => t.memo.trim());
  const clientAccounts = await db.getClientAccountsWithMemos(memos);
  if (clientAccounts.length === 0) {
    console.error('Failed to insert new transactions. Could not find any client accounts');
    return;
  }

  // Go through all the transactions and add them to the client account
  const promises = [];
  for (const newTransaction of newTransactions) {
    const clientAccount = clientAccounts.find(c => c.account.memo === newTransaction.memo);
    if (clientAccount) {
      promises.push(db.insertSwap(newTransaction, clientAccount));
    }
  }

  const count = await postgres.tx(t => t.batch(promises));
  console.info(`Inserted ${count.length} swaps for ${SWAP_TYPE.BLOKI_TO_LOKI}`);
}
