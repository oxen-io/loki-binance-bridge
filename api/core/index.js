import config from 'config';
import { TransactionHelper } from 'bridge-core';
import bnb from './binance';
import loki from './loki';
import { postgres, db } from './database';

const { depositAddress } = config.get('binance');

const transactionHelper = new TransactionHelper({
  binance: {
    client: bnb,
    ourAddress: depositAddress,
  },
  loki: { client: loki },
});

export { bnb, loki, postgres, db, transactionHelper };
