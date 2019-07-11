/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue  */
import config from 'config';
import Decimal from 'decimal.js';
import { SWAP_TYPE } from 'bridge-core';
import { localDB } from '../core';
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
          console.error(`Balances do not match for ${swapType}. Aborting!\n`);
          return Promise.resolve();
        }

        const dailyAmount = module.getDailyAmount(swapType);
        const { dailyLimit } = module;

        // Make sure we can keep processing
        if (dailyAmount >= dailyLimit) {
          console.info('Daily limit hit!');
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
          console.info(`Amount sent in swaps: $${info.totalUSD} USD`);
          console.info(`Amount sent in a day: $${newDailyAmount} USD\n`);
        } catch (e) {
          if (e instanceof swaps.Errors.NoSwapsToProcess) {
            console.info(`No swaps to process for ${swapType}\n`);
            continue;
          }

          if (e instanceof swaps.Errors.DailyLimitHit) {
            console.info('Daily limit hit!');
            continue;
          }

          if (e instanceof swaps.Errors.PriceFetchFailed) {
            console.error('Failed to fetch price of LOKI\nWill try again next time.\n');
            continue;
          }

          throw e;
        }
      }

      // Keep infinitely processing if we haven't hit the daily limit
      return keepProcessing ? module.runAutoProcessing(newOptions) : Promise.resolve();
    } catch (e) {
      console.error(`Error: ${e.message}\n`);
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
