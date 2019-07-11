/* eslint-disable no-else-return, no-restricted-syntax, no-await-in-loop */
import config from 'config';
import { SWAP_TYPE, TYPE } from 'bridge-core';
import { db, bnb, loki } from '../core';

// The fee charged for withdrawing loki
const configFees = { [TYPE.LOKI]: config.get('loki.withdrawalFee') };

// The fees in 1e9 format
const fees = { [TYPE.LOKI]: (parseFloat(configFees[TYPE.LOKI]) * 1e9).toFixed(0) };

const symbols = {
  [TYPE.LOKI]: 'LOKI',
  [TYPE.BNB]: 'BLOKI',
};

/**
 * Process all pending swaps and send out the coins.
 */
export async function processAllSwaps() {
  try {
    for (const swapType of Object.values(SWAP_TYPE)) {
      console.info(`Processing swaps for ${swapType}`);
      const info = await processAllSwapsOfType(swapType);
      printInfo(info);
    }
  } catch (e) {
    console.log(`Error: ${e.message}\n`);
  }
}

/**
 * Print out info to the console
*/
function printInfo(info, swapType) {
  if (!info) {
    console.info(`No swaps found for ${swapType}\n`);
    return;
  }

  const { swaps, totalAmount } = info;
  const sentCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? TYPE.BNB : TYPE.LOKI;

  console.info(`Completed ${swaps} swaps`);
  console.info(`Amount sent: ${totalAmount / 1e9} ${symbols[sentCurrency]}\n`);
}

/**
 * Process all pending swaps and send out the coins.
 *
 * @param {string} swapType The type of swap.
 * @returns {{ swaps, totalAmount, totalFee }} The completed swap info.
 */
export async function processAllSwapsOfType(swapType) {
  const swaps = await db.getPendingSwaps(swapType);
  return processSwaps(swaps, swapType);
}

/**
 * Process the given swaps and send out the coins
 * @param {[*]} swaps The swaps.
 * @param {string} swapType The swap type.
 * * @returns {{ swaps, totalAmount, totalFee }} The completed swap info.
 */
export async function processSwaps(swaps, swapType) {
  const ids = swaps.map(s => s.uuid);
  const transactions = getTransactions(swaps);

  if (!transactions || transactions.length === 0) {
    return null;
  }

  const txHashes = await send(swapType, transactions);
  await db.updateSwapsTransferTransactionHash(ids, txHashes.join(','));

  const sentCurrency = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? TYPE.BNB : TYPE.LOKI;
  const transactionAmount = transactions.reduce((total, current) => total + current.amount, 0);

  // Fee is per transaction (1 transaction = 1 user)
  const totalFee = (fees[sentCurrency] || 0) * transactions.length;
  const totalAmount = transactionAmount - totalFee;

  return {
    swaps,
    totalAmount,
    totalFee,
  };
}

/**
 * Take an array of `swaps` and combine the ones going to the same `address`.
 *
 * @param {[{ amount, address: string }]} swaps An array of swaps.
 * @returns Simplified transactions from the swaps.
 */
export function getTransactions(swaps) {
  const amounts = {};

  // eslint-disable-next-line no-restricted-syntax
  for (const swap of swaps) {
    if (swap.address in amounts) {
      amounts[swap.address] += parseFloat(swap.amount) || 0;
    } else {
      amounts[swap.address] = parseFloat(swap.amount) || 0;
    }
  }

  return Object.keys(amounts).map(k => ({ address: k, amount: amounts[k] }));
}

/**
 * Send the given `swaps`.
 *
 * @param {string} swapType The type of swap.
 * @param {[{ address: string, amount: number }]} transactions An array of transactions.
 * @returns An array of transaction hashes
 */
export async function send(swapType, transactions) {
  // Multi-send always returns an array of hashes
  if (swapType === SWAP_TYPE.LOKI_TO_BLOKI) {
    const symbol = config.get('binance.symbol');
    const outputs = transactions.map(({ address, amount }) => ({
      to: address,
      coins: [{
        denom: symbol,
        amount,
      }],
    }));

    // Send BNB to the users
    return bnb.multiSend(config.get('binance.mnemonic'), outputs, 'Loki Bridge');
  } else if (swapType === SWAP_TYPE.BLOKI_TO_LOKI) {
    // Deduct the loki withdrawal fees
    const outputs = transactions.map(({ address, amount }) => {
      const fee = fees[TYPE.LOKI] || 0;
      return {
        address,
        amount: Math.max(0, amount - fee),
      };
    });

    // Send Loki to the users
    return loki.multiSend(outputs);
  }

  throw new Error('Invalid swap type');
}
