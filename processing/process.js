/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue  */
import { Command } from 'commander';
import { SWAP_TYPE } from 'bridge-core';
import swaps from './functions/swaps';
import * as sweep from './functions/sweep';
import * as balance from './functions/balance';

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
    await swaps.processAllSwaps();
  } else if (options.sweep) {
    await sweep.sweepAllPendingSwaps();
  } else if (options.check) {
    await balance.checkAllBalances();
  } else if (options.printInvalid) {
    await balance.printBNBTransactionsWithIncorrectMemo();
  } else {
    program.help();
  }
}

export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// TODO: Move to a module for better testing
export async function runAutoProcessing() {
  // Sleep for 10 minutes
  await sleep(10 * 60 * 1000);

  try {
    // Sweep
    await sweep.sweepAllPendingSwaps();

    // Keep track of wether we should keep processing
    let keepProcessing = false;

    // Go through each swap type
    for (const swapType of Object.values(SWAP_TYPE)) {
      // Get balances and check
      const currentBalance = await balance.getBalances(swapType);
      balance.printBalance(swapType, currentBalance, false);
      if (currentBalance.transaction !== currentBalance.swap) {
        console.error(`Balances do not match for ${swapType}. Aborting!\n`);
        return Promise.resolve();
      }

      // TODO: Get these from a stored file
      const dailyAmount = 0;
      const maxDailyAmount = 100;

      // Make sure we can keep processing
      if (dailyAmount >= maxDailyAmount) {
        console.info('Daily limit hit!');
        continue;
      }

      // Keep processing since we haven't hit the daily amount
      keepProcessing = true;

      const info = await swaps.processAutoSwaps(dailyAmount, maxDailyAmount, swapType);
      if (!info) {
        console.info(`No swaps to process for ${swapType}\n`);
      }

      swaps.printInfo(info);
      console.info(`Amount sent in swaps: $${info.totalUSD} USD`);

      // TODO: Save daily amount here
      console.info(`Amount sent in a day: $${info.dailyAmount} USD`);
    }

    // Keep infinitely processing if we haven't hit the daily limit
    return keepProcessing ? runAutoProcessing() : Promise.resolve();
  } catch (e) {
    if (e instanceof swaps.Errors.PriceFetchFailed) {
      console.error('Failed to fetch price of LOKI\nWill try again next time.\n');
      return runAutoProcessing();
    }
    console.error(`Error: ${e.message}\n`);
    return Promise.resolve();
  }
}

// Exit after running commands
run(program).finally(() => process.exit());
