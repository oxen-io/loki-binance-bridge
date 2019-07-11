/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { assert } from 'chai';
import sinon from 'sinon';
import config from 'config';
import { SWAP_TYPE, TYPE } from 'bridge-core';
import { bnb, loki, postgres, db } from '../../core';
import { sweep, swaps, balance, auto } from '../../functions';
import { dbHelper } from '../helpers';

const sandbox = sinon.createSandbox();

const stub = (options = {}) => {
  const defaults = {
    dailyAmount: 0,
    dailyLimit: 100,
    balance: { swap: 100e9, transaction: 100e9 },
    usdPrice: 0.5,
  };

  const values = {
    ...defaults,
    ...options,
  };

  sandbox.stub(swaps, 'getCurrentLokiPriceInUSD').resolves(values.usdPrice);
  sandbox.stub(auto, 'sleep').resolves();
  sandbox.stub(sweep, 'sweepAllPendingSwaps').resolves();
  sandbox.stub(balance, 'getBalances').resolves(values.balance);
  sandbox.stub(auto, 'getDailyAmount').returns(values.dailyAmount);
  sandbox.stub(auto, 'dailyLimit').value(values.dailyLimit);
  sandbox.spy(auto, 'runAutoProcessing');
};

describe('Auto Processing', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#runAutoProcessing', () => {
    it('should terminate if balances are not equal', async () => {
      stub({ balance: { swap: 100, transaction: 101 } });

      await auto.runAutoProcessing();
      assert.equal(auto.runAutoProcessing.callCount, 1);
    });

    it('should terminate if daily limit on all swap types were hit', async () => {
      stub({
        dailyAmount: 100,
        dailyLimit: 10,
      });

      await auto.runAutoProcessing();
      assert.equal(auto.runAutoProcessing.callCount, 1);
    });

    it('should skip the swap type if daily limit was hit', async () => {
      stub({
        dailyAmount: 100,
        dailyLimit: 10,
      });

      await auto.runAutoProcessing();
      assert.equal(auto.getDailyAmount.callCount, Object.values(SWAP_TYPE).length);
    });

    it('should skip the swap type if no swaps were processed', async () => {
      stub();
      sandbox.stub(db, 'getPendingSwaps').resolves([]);
      sandbox.stub(swaps, 'processAutoSwaps').throws(new swaps.Errors.NoSwapsToProcess());

      await auto.runAutoProcessing({ runOnce: true });
      assert.equal(auto.getDailyAmount.callCount, Object.values(SWAP_TYPE).length);
    });

    it('should skip the swap type if we failed to fetch the price', async () => {
      stub();
      sandbox.stub(swaps, 'processAutoSwaps').throws(new swaps.Errors.PriceFetchFailed());

      await auto.runAutoProcessing({ runOnce: true });
      assert.equal(auto.getDailyAmount.callCount, Object.values(SWAP_TYPE).length);
    });

    it('should terminate if an error occurred', async () => {
      stub();
      sandbox.stub(swaps, 'processAutoSwaps').throws(new Error());

      await auto.runAutoProcessing();
      assert.equal(auto.runAutoProcessing.callCount, 1);
    });

    it('should recurse if everything went right', async () => {
      stub({ usdPrice: 0.5 });
      sandbox.stub(swaps, 'processAutoSwaps').resolves({
        swaps: [{ uuid: 1, amount: 1e9, address: 'a' }],
        totalAmount: 1e9,
        totalFee: 0,
        totalUSD: 1,
      });
      sandbox.stub(auto, 'saveDailyAmount').returns();

      await auto.runAutoProcessing({ runOnce: true });
      assert.equal(auto.runAutoProcessing.callCount, 2);
    });

    it('should correctly add to the daily amount', async () => {
      stub({ usdPrice: 0.5, dailyAmount: 1.34 });
      sandbox.stub(swaps, 'processAutoSwaps').resolves({
        swaps: [{ uuid: 1, amount: 1e9, address: 'a' }],
        totalAmount: 1e9,
        totalFee: 0,
        totalUSD: 5.4,
      });

      let called = false;
      sandbox.stub(auto, 'saveDailyAmount').callsFake((swapType, value) => {
        assert.equal(value, 6.74);
        called = true;
      });

      await auto.runAutoProcessing({ runOnce: true });
      assert.isTrue(called);
    });
  });
});
