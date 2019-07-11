/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue  */
import { Command } from 'commander';
import { swaps, sweep, balance, auto } from './functions';

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
    await swaps.processAllSwaps();
  } else if (options.sweep) {
    await sweep.sweepAllPendingSwaps();
  } else if (options.check) {
    await balance.checkAllBalances();
  } else if (options.printInvalid) {
    await balance.printBNBTransactionsWithIncorrectMemo();
  } else if (options.autoSwap) {
    await auto.runAutoProcessing();
  } else {
    program.help();
  }
}

// Exit after running commands
run(program).catch(console.error).finally(() => process.exit());
