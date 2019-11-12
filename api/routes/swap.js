/* eslint-disable no-extend-native */
import { TYPE, SWAP_TYPE } from 'bridge-core';
import { loki, transactionHelper, db } from '../core';
import { crypto, validation } from '../utils';

// A cache to store the currently processing transactions
// Maps client uuid to tx hash
const txCache = {};

// - Public

/**
 * Swap tokens
 * Request Data:
 *  - type: The type of swap (SWAP_TYPE).
 *  - address: An address. The type of address is determined from the `type` passed.
 *  E.g If `type = LOKI_TO_BLOKI` then the `address` is expected to be a loki address.
 */
export function swapToken(req, res, next) {
  crypto.decryptAPIPayload(req, res, next, async data => {
    const result = await validation.validateSwap(data);
    if (result != null) {
      res.status(400);
      res.body = { status: 400, success: false, result };
      return next(null, req, res, next);
    }

    const { type, address } = data;

    // We assume the address type is that of the currency we are swapping to.
    // So if the swap is LOKI_TO_BLOKI then we want the user to give the BNB address
    // We then generate a LOKI address that they will deposit to.
    // After the deposit we pay them out to the BNB address they passed.
    const addressType = type === SWAP_TYPE.LOKI_TO_BLOKI ? TYPE.BNB : TYPE.LOKI;

    try {
      const account = await db.getClientAccount(address, addressType);
      if (account) {
        res.status(205);
        res.body = { status: 200, success: true, result: formatClientAccount(account) };
        return next(null, req, res, next);
      }

      // Account type is the that of the currency we are swapping from
      const accountType = type === SWAP_TYPE.LOKI_TO_BLOKI ? TYPE.LOKI : TYPE.BNB;

      let newAccount = null;
      if (accountType === TYPE.BNB) {
        // Generate a random memo
        newAccount = { memo: crypto.generateRandomString(64) };
      } else if (accountType === TYPE.LOKI) {
        newAccount = await loki.createAccount();
      }

      if (!newAccount) {
        console.error('Failed to make new account for: ', accountType);
        throw new Error('Invalid swap');
      }

      const clientAccount = await db.insertClientAccount(address, addressType, newAccount);
      res.status(205);
      res.body = { status: 200, success: true, result: formatClientAccount(clientAccount) };
    } catch (error) {
      console.log(error);
      const message = (error && error.message);
      res.status(500);
      res.body = { status: 500, success: false, result: message || error };
    }

    return next(null, req, res, next);
  });
}

/**
 * Check to see if transfer was done.
 * Validate that against the swaps that have recorded previously.
 * Insert all new deposits into swaps.
 * Return all new deposits.
 *
 * Request Data:
 *  - uuid: The uuid that was returned in `swapToken` (client account uuid)
 */
export function finalizeSwap(req, res, next) {
  crypto.decryptAPIPayload(req, res, next, async data => {
    const result = validation.validateUuidPresent(data);
    if (result != null) {
      res.status(400);
      res.body = { status: 400, success: false, result };
      return next(null, req, res, next);
    }

    const currentHashes = [];
    const { uuid } = data;
    try {
      const clientAccount = await db.getClientAccountForUuid(uuid);
      if (!clientAccount) {
        res.status(400);
        res.body = { status: 400, success: false, result: 'Unable to find swap details' };
        return next(null, req, res, next);
      }

      // Prepare the cache
      if (!txCache[uuid]) { txCache[uuid] = []; }

      const { account, accountType } = clientAccount;

      const [transactions, swaps] = await Promise.all([
        transactionHelper.getIncomingTransactions(account, accountType),
        db.getSwapsForClientAccount(uuid),
      ]);

      if (!transactions || transactions.length === 0) {
        res.status(205);
        res.body = { status: 200, success: false, result: 'Unable to find a deposit' };
        return next(null, req, res, next);
      }

      const newTransactions = transactions.filter(tx => {
        // Filter out any transactions we aren't processing and haven't added to our swaps db
        const isProcessingTransaction = txCache[uuid].contains(tx.hash)
        const processedTransaction = swaps.find(s => s.deposit_transaction_hash === tx.hash) != undefined
        return !isProcessingTransaction && !processedTransaction;
      });

      if (newTransactions.length === 0) {
        res.status(205);
        res.body = { status: 200, success: false, result: 'Unable to find any new deposits' };
        return next(null, req, res, next);
      }

      // Add the new transactions to our processing cache
      currentHashes = newTransactions.map(tx => tx.hash)
      txCache[uuid] = [...txCache[uuid], ...currentHashes];

      // Give back the new swaps to the user
      const newSwaps = await db.insertSwaps(newTransactions, clientAccount);
      res.status(205);
      res.body = { status: 200, success: true, result: formatSwaps(newSwaps) };
    } catch (error) {
      console.log(error);
      const message = (error && error.message);
      res.status(500);
      res.body = { status: 500, success: false, result: message || error };
    }

    // Clear out the new transactions from the cache as we have done our work on them
    // This will allow us to retry swap creation if we somehow failed
    txCache[uuid] = txCache[uuid].filter(hash => !currentHashes.contains(hash));

    return next(null, req, res, next);
  });
}

/**
 * Get all the swaps for the given client uuid.
 * Request Data:
 *  - uuid: The uuid that was returned in `swapToken` (client account uuid)
 */
export async function getSwaps(req, res, next) {
  const data = req.query;

  const result = validation.validateUuidPresent(data);
  if (result != null) {
    res.status(400);
    res.body = { status: 400, success: false, result };
    return next(null, req, res, next);
  }

  const { uuid } = data;

  try {
    const clientAccount = await db.getClientAccountForUuid(uuid);
    if (!clientAccount) {
      res.status(400);
      res.body = { status: 400, success: false, result: 'Unable to find swap details' };
      return next(null, req, res, next);
    }

    const swaps = await db.getSwapsForClientAccount(uuid);
    if (!swaps) {
      res.status(400);
      res.body = { status: 400, success: false, result: 'Failed to fetch swaps' };
      return next(null, req, res, next);
    }

    const formatted = swaps.map(swap => {
      const transactionHashes = swap.transfer_transaction_hash;
      const transactionHashArray = (transactionHashes && transactionHashes.split(',')) || [];

      return {
        uuid: swap.uuid,
        type: swap.type,
        amount: swap.amount,
        txHash: swap.deposit_transaction_hash,
        transferTxHashes: transactionHashArray,
        created: swap.created,
      };
    });

    res.status(205);
    res.body = { status: 200, success: true, result: formatted };
  } catch (error) {
    console.log(error);
    const message = (error && error.message);
    res.status(500);
    res.body = { status: 500, success: false, result: message || error };
  }

  return next(null, req, res, next);
}

/**
 * Get all unconfirmed loki transactions
 * Request Data:
 *  - uuid: The uuid that was returned in `swapToken` (client account uuid)
 */
export async function getUncomfirmedLokiTransactions(req, res, next) {
  const data = req.query;

  const result = validation.validateUuidPresent(data);
  if (result != null) {
    res.status(400);
    res.body = { status: 400, success: false, result };
    return next(null, req, res, next);
  }

  const { uuid } = data;

  try {
    const clientAccount = await db.getClientAccountForUuid(uuid);
    const transactions = await transactionHelper.getIncomingLokiTransactions(clientAccount.account.addressIndex, { pool: true });
    const unconfirmed = transactions
      .filter(tx => !tx.confirmed)
      .map(({ hash, amount, timestamp }) => ({ hash, amount, created: timestamp }));

    res.status(205);
    res.body = { status: 200, success: true, result: unconfirmed };
  } catch (error) {
    console.log(error);
    const message = (error && error.message);
    res.status(500);
    res.body = { status: 500, success: false, result: message || error };
  }

  return next(null, req, res, next);
}

// - Util

function formatClientAccount({ uuid, accountType: type, account }) {
  const depositAddress = type === TYPE.LOKI ? account.address : transactionHelper.ourBNBAddress;
  const result = {
    uuid,
    type,
    depositAddress,
  };
  if (type === TYPE.BNB) result.memo = account.memo;

  return result;
}

function formatSwaps(swaps) {
  return swaps.map(swap => ({
    uuid: swap.uuid,
    type: swap.type,
    amount: swap.amount,
    txHash: swap.deposit_transaction_hash,
  }));
}
