/* eslint-disable no-else-return */
import config from 'config';
import { db, TYPE } from '../utils';
import { bnb, loki } from '../helpers';

const binanceSymbol = config.get('binance.symbol');

export async function checkBalances(swapType) {

}

export async function getTotalClientAccountsBalance(accountType) {
  const clientAccounts = await db.getClientAccounts(accountType);
  const addresses = clientAccounts.map(a => a.accountAddress);

  if (accountType === TYPE.LOKI) {
    const addressIndicies = await db.getLokiAddressIndicies(addresses);
    if (!addressIndicies) {
      console.log('[Processing] Failed to get account indicies for loki addresses');
      return 0;
    }

    // Return the sum of the unlocked balances
    const balances = await loki.getBalances(addressIndicies);
    return balances.reduce((acc, current) => acc + current.unlocked, 0);
  } else if (accountType === TYPE.BNB) {
    try {
      const getBalance = async address => {
        const balances = bnb.getBalances(address);
        return balances.find(b => b.symbol === binanceSymbol);
      };

      const promises = addresses.map(getBalance);
      const balances = await Promise.all(promises);

      // Filter out any invalid balances and sum everything
      const sum = balances.filter(b => !!b).reduce((acc, current) => acc + current.free, 0);
      return sum;
    } catch (e) {
      console.log('[Processing] Failed to get account indicies for bnb addresses: ', e);
      return 0;
    }
  }
}

export async function getTotalSwapAmount(swapType) {

}
