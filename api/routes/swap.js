/* eslint-disable no-extend-native */
import { bnb, loki } from '../helpers';
import { validateSwap, validateFinalizeSwap } from '../utils/validation';
import { SWAP_TYPE, TYPE } from '../utils/constants';
import { decryptAPIPayload } from '../utils/crypto';
import * as db from '../utils/db';

// - Public

/**
 * Swap tokens
 * Request Data:
 *  - type: The type of swap (SWAP_TYPE).
 *  - address: An address. The type of address is determined from the `type` passed.
 *  E.g If `type = LOKI_TO_BNB` then the `address` is expected to be a loki address.
 */
export function swapToken(req, res, next) {
  decryptAPIPayload(req, res, next, async data => {
    const result = await validateSwap(data);
    if (result != null) {
      res.status(400);
      res.body = { status: 400, success: false, result };
      return next(null, req, res, next);
    }

    const { type, address } = data;

    // We assume the address type is that of the currency we are swapping to.
    // So if the swap is LOKI_TO_BNB then we want the user to give the BNB address
    // We then generate a LOKI address that they will deposit to.
    // After the deposit we pay them out to the BNB address they passed.
    const addressType = type === SWAP_TYPE.LOKI_TO_BNB ? TYPE.BNB : TYPE.LOKI;

    try {
      const account = await db.getClientAccount(address, addressType);
      if (account) {
        res.status(205);
        res.body = { status: 200, success: true, result: account };
        return next(null, req, res, next);
      }

      let newAccount = null;
      if (addressType === TYPE.LOKI) {
        // Create a BNB account
        newAccount = bnb.createAccountWithMnemonic();
      } else if (addressType === TYPE.BNB) {
        newAccount = await loki.createAccount();
      }

      if (!newAccount) {
        console.error('Failed to make new account for: ', addressType);
        throw new Error('Invalid swap');
      }

      const clientAccount = await db.insertClientAccount(address, addressType, newAccount);
      res.status(205);
      res.body = { status: 200, success: true, result: clientAccount };
    } catch (error) {
      console.log(error);
      res.status(500);
      res.body = { status: 500, success: false, result: error };
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
  decryptAPIPayload(req, res, next, async data => {
    const result = validateFinalizeSwap(data);
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

      const { accountAddress, accountType } = clientAccount;

      const [transactions, swaps] = await Promise.all([
        getIncomingTransactions(accountAddress, accountType),
        db.getSwaps(uuid),
      ]);

      if (!transactions || transactions.length === 0) {
        res.status(400);
        res.body = { status: 400, success: false, result: 'Unable to find a deposit' };
        return next(null, req, res, next);
      }

      // Filter out any transactions we haven't added to our swaps db
      const newTransactions = transactions.filter(tx => !swaps.find(s => s.deposit_transaction_hash === tx.hash));
      if (newTransactions.length === 0) {
        res.status(400);
        res.body = { status: 400, success: false, result: 'Unable to find any new deposits' };
        return next(null, req, res, next);
      }

      // Give back the new swaps to the user
      const newSwaps = await db.insertSwaps(newTransactions, clientAccount);
      res.status(205);
      res.body = { status: 200, success: true, result: newSwaps };
    } catch (error) {
      console.log(error);
      res.status(500);
      res.body = { status: 500, success: false, result: error };
    }

    return next(null, req, res, next);
  });
}

/**
 * Get incoming transactions to the given address.
 * @param {string} accountAddress The account address.
 * @param {'loki'|'bnb'} accountType The account type
 */
async function getIncomingTransactions(accountAddress, accountType) {
  switch (accountType) {
    case TYPE.BNB: {
      const transactions = await bnb.getIncomingTransactions(accountAddress);
      return transactions.map(tx => ({
        hash: tx.txHash,
        amount: tx.value,
      }));
    }
    case TYPE.LOKI: {
      const lokiAccount = await db.getLokiAccount(accountAddress);
      if (!lokiAccount) return [];

      const transactions = await loki.getIncomingTransactions(lokiAccount.address_index);

      // We only want transactions with a certain number of confirmations
      return transactions.filter(tx => tx.confirmations >= 6).map(tx => ({
        hash: tx.txid,
        amount: tx.amount,
      }));
    }
    default:
      return [];
  }
}
