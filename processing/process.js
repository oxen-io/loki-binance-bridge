import { Command } from 'commander';
import { processAllSwaps } from './functions/swaps';
import { sweepAllPendingSwaps } from './functions/sweep';
import { checkAllBalances, printBNBTransactionsWithIncorrectMemo } from './functions/balance';

const program = new Command();

program
  .description('Perform processing')
  .option('--swap', 'Process all swaps.')
  .option('--sweep', 'Go through all transactions and add any new pending swaps.')
  .option('--check', 'Verify incoming transaction amounts with the amounts we have stored in the database')
  .option('--printInvalid', 'Print any transactions for which we do not have the memo for')
  .parse(process.argv);

async function run(options) {
  if (options.swap) {
    await processAllSwaps();
  } else if (options.sweep) {
    await sweepAllPendingSwaps();
  } else if (options.check) {
    await checkAllBalances();
  } else if (options.printInvalid) {
    await printBNBTransactionsWithIncorrectMemo();
  } else {
    program.help();
  }
}

// Exit after running commands
run(program).then(() => process.exit());
