import config from 'config';
import { TransactionHelper } from 'bridge-core';
import bnb from './binance';
import loki from './loki';
import { postgres, db } from './database';

const { minConfirmations } = config.get('loki');

const transactionHelper = new TransactionHelper({
  binance: {
    client: bnb,
    ourAddress: bnb.getAddressFromMnemonic(config.get('binance.mnemonic')),
  },
  loki: {
    client: loki,
    minConfirmations,
  },
});

export { bnb, loki, postgres, db, transactionHelper };
