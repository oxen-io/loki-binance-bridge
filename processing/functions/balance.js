/* eslint-disable no-else-return */
import chalk from 'chalk';
import { SWAP_TYPE, TYPE } from 'bridge-core';
import { db, transactionHelper } from '../core';
import log from '../utils/log';

const module = {
  async checkAllBalances() {
    const lokiBalance = await module.getBalances(SWAP_TYPE.LOKI_TO_BLOKI);
    module.printBalance(SWAP_TYPE.LOKI_TO_BLOKI, lokiBalance);

    const bnbBalance = await module.getBalances(SWAP_TYPE.BLOKI_TO_LOKI);
    module.printBalance(SWAP_TYPE.BLOKI_TO_LOKI, bnbBalance);
  },

  printBalance(swapType, balance, showWarning = true) {
    const receiveCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'LOKI' : 'B-LOKI';
    const swapCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? 'B-LOKI' : 'LOKI';
    log.header(chalk.blue(`Balance of ${swapType}`));
    log.info(chalk`{green Transaction balance:} {bold ${balance.transaction / 1e9}} {yellow ${receiveCurrency}}`);
    log.info(chalk`{green Swap balance:} {bold ${balance.swap / 1e9}} {yellow ${swapCurrency}}`);
    if (showWarning && balance.transaction !== balance.swap) {
      log.error(chalk.red('WARNING: AMOUNTS DO NOT MATCH! PLEASE TRY SWEEPING'));
    }
  },

  /**
 * Get both the transaction and swap balance for the given swap type.
 * @param {string} swapType The swap type.
 */
  async getBalances(swapType) {
    const now = Date.now();
    const twoDaysAgo = now - (2 * 24 * 60 * 60 * 1000);

    const accountType = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? TYPE.LOKI : TYPE.BNB;
    const transactionBalance = await module.getBalanceFromIncomingTransactions(accountType, twoDaysAgo, now);
    const swapBalance = await module.getSwapBalance(swapType, twoDaysAgo, now);
    return {
      transaction: transactionBalance,
      swap: swapBalance,
    };
  },

  /**
 * Get the total balance of the swaps in the database of the given type.
 * @param {string} swapType The swap type
 * @param {number} from The date to get incoming transactions from. The lower bound.
 * @param {number} to The date to get incoming transactions to. The upper bound.
 */
  async getSwapBalance(swapType, from, to) {
    const swaps = await db.getAllSwaps(swapType);
    const filtered = swaps.filter(s => {
      let created = Date.parse(s.deposit_transaction_created);

      // Just incase deposit_transaction_created is not set
      if (Number.isNaN(created)) created = Date.parse(s.created);

      return !(created > to || created < from);
    });
    // Sum up the amounts
    return filtered.reduce((total, current) => total + parseInt(current.amount, 10), 0);
  },

  /**
 * Get the total balance of the incoming transactions for the given account types.
 * @param {string} accountType The account type
 * @param {number} from The date to get incoming transactions from. The lower bound.
 * @param {number} to The date to get incoming transactions to. The upper bound.
 */
  async getBalanceFromIncomingTransactions(accountType, from, to) {
    const clientAccounts = await db.getClientAccounts(accountType);

    let filtered = [];

    if (accountType === TYPE.LOKI) {
    // Get all incoming transactions from the client accounts
      const promises = clientAccounts.map(async c => transactionHelper.getIncomingLokiTransactions(c.account.addressIndex));
      const lokiTransactions = await Promise.all(promises).then(array => array.flat());

      // Filter out all transactions that don't fit our date ranges
      filtered = lokiTransactions.filter(({ timestamp }) => !(timestamp > to || timestamp < from));

      // Sum up the amounts
      return filtered.reduce((total, current) => total + parseInt(current.amount, 10), 0);
    } else if (accountType === TYPE.BNB) {
    // Get all our incoming transactions which contain a memo
      const ourAddress = transactionHelper.ourBNBAddress;
      const transactions = await transactionHelper.getIncomingBNBTransactions(ourAddress, from);
      const bnbClientAccounts = await db.getClientAccounts(TYPE.BNB);
      const clientMemos = bnbClientAccounts.map(c => c.account.memo);

      // Only get the transactions with memos that we have
      const memoTransactions = transactions.filter(t => {
        const { memo } = t;
        return memo && memo.length > 0 && clientMemos.includes(memo);
      });

      // Filter out all transactions that don't fit our date ranges
      filtered = memoTransactions.filter(({ timestamp }) => !(timestamp > to || timestamp < from));
    }

    // Sum up the amounts
    return filtered.reduce((total, current) => total + parseInt(current.amount, 10), 0);
  },

  async printBNBTransactionsWithIncorrectMemo() {
  // Get all our incoming transactions which contain a memo
    const ourAddress = transactionHelper.ourBNBAddress;
    const transactions = await transactionHelper.getIncomingBNBTransactions(ourAddress);
    const bnbClientAccounts = await db.getClientAccounts(TYPE.BNB);
    const clientMemos = bnbClientAccounts.filter(c => c.account.memo);
    const unkownMemoTransactions = transactions.filter(t => {
      const { memo } = t;
      return memo && memo.length > 0 && !clientMemos.includes(memo);
    });

    const values = unkownMemoTransactions.map(({ hash, amount, memo, timestamp }) => ({
      hash,
      amount: amount / 1e9,
      memo,
      timestamp,
    }));

    values.forEach(({ hash, amount, memo, timestamp }) => {
      log.header(chalk.blue(hash));
      log.info(chalk`{green amount:} ${amount} BLOKI`);
      log.info(chalk`{green memo:} ${memo}`);
      log.info(chalk`{green timestamp:} ${timestamp}`);
    });
  },
};

export default module;
