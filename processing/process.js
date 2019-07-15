/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue  */
import chalk from 'chalk';
import { Command } from 'commander';
import { SWAP_TYPE } from 'bridge-core';
import { swaps, sweep, balance, auto } from './functions';
import log from './utils/log';

const program = new Command();

program
  .description('Perform processing')
  .option('--autoSwap', 'Process swaps automatically.')
  .option('--swap', 'Process all swaps.')
  .option('--sweep', 'Go through all transactions and add any new pending swaps.')
  .option('--check', 'Verify incoming transaction amounts with the amounts we have stored in the database')
  .option('--printInvalid', 'Print any transactions for which we do not have the memo for')
  .parse(process.argv);

async function run(options) {
  if (options.swap) {
    log.header(chalk.bold('Swap'));
    await swaps.processAllSwaps();

    // Set daily balance to 0
    Object.values(SWAP_TYPE).forEach(t => auto.saveDailyAmount(t, 0));
  } else if (options.sweep) {
    log.header(chalk.bold('=========== Sweep ==========='));
    await sweep.sweepAllPendingSwaps();
  } else if (options.check) {
    log.header(chalk.bold('=========== Balance Check ==========='));
    await balance.checkAllBalances();
  } else if (options.printInvalid) {
    log.header(chalk.bold('=========== Print Invalid ==========='));
    await balance.printBNBTransactionsWithIncorrectMemo();
  } else if (options.autoSwap) {
    log.setFilePrefix('auto-swap');
    log.header(chalk.bold('=========== Auto Swap ==========='));
    await auto.runAutoProcessing();
  } else {
    program.help();
  }
}

// Exit after running commands
run(program).catch(log.error);
