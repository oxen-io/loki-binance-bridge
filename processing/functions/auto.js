/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue  */
import config from 'config';
import chalk from 'chalk';
import Decimal from 'decimal.js';
import { SWAP_TYPE } from 'bridge-core';
import { localDB } from '../core';
import log from '../utils/log';
import swaps from './swaps';
import balance from './balance';
import sweep from './sweep';

const module = {
  dailyLimit: config.get('dailyLimit'),
  autoRunInterval: config.get('autoRunInterval') || 10,
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },
  async runAutoProcessing(options = {}) {
    // Just to make testing easy
    if (options.runOnce && options.callCount === 1) return Promise.resolve();

    const newOptions = {
      ...options,
      callCount: (options.callCount || 0) + 1,
    };

    // Sleep for 10 minutes
    await module.sleep(module.autoRunInterval * 60 * 1000);

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
          log.error(chalk.red('Balances do not match. Aborting!'));
          return Promise.resolve();
        }

        log.header(chalk.blue(`Processing swaps for ${swapType}`));

        const dailyAmount = module.getDailyAmount(swapType);
        const { dailyLimit } = module;

        // Make sure we can keep processing
        if (dailyAmount >= dailyLimit) {
          log.info(chalk.yellow('Daily limit hit!'));
          continue;
        }

        // Keep processing since we haven't hit the daily amount
        keepProcessing = true;

        // Process swaps
        try {
          const info = await swaps.processAutoSwaps(dailyAmount, dailyLimit, swapType);

          // Save processed amount
          const newDailyAmount = new Decimal(dailyAmount).add(info.totalUSD || 0).toNumber();
          module.saveDailyAmount(swapType, newDailyAmount);

          swaps.printInfo(info);
          log.info(chalk`{green Amount sent in swaps:} {white.bold $${info.totalUSD}} {yellow USD}`);
          log.info(chalk`{green Amount sent in a day:} {white.bold $${newDailyAmount}} {yellow USD}`);
        } catch (e) {
          if (e instanceof swaps.Errors.NoSwapsToProcess) {
            log.info(chalk.yellow('No swaps to process'));
            continue;
          }

          if (e instanceof swaps.Errors.DailyLimitHit) {
            log.info(chalk.yellow('Daily limit hit!'));
            continue;
          }

          if (e instanceof swaps.Errors.PriceFetchFailed) {
            log.error(chalk.yellow('Failed to fetch price of LOKI. Will try again next time.'));
            continue;
          }

          throw e;
        }
      }

      // Keep infinitely processing if we haven't hit the daily limit
      return keepProcessing ? module.runAutoProcessing(newOptions) : Promise.resolve();
    } catch (e) {
      log.error(chalk.red(`Error: ${e.message}`));
      return Promise.resolve();
    }
  },
  getDailyAmount(swapType) {
    const key = `${swapType}.dailyAmount`;
    return localDB.has(key) ? localDB.get(key).value() : 0;
  },
  saveDailyAmount(swapType, value) {
    const float = parseFloat(value);
    const key = `${swapType}.dailyAmount`;
    localDB.set(key, float).write();
  },
};

export default module;
