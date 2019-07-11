/* eslint-disable no-restricted-syntax, no-await-in-loop */
import { assert } from 'chai';
import sinon from 'sinon';
import config from 'config';
import { SWAP_TYPE, TYPE } from 'bridge-core';
import { bnb, loki, postgres, db } from '../../core';
import functions from '../../functions/swaps';
import { dbHelper } from '../helpers';

const processSwapFake = swaps => {
  const transactions = functions.getTransactions(swaps);
  if (!transactions || transactions.length === 0) {
    return null;
  }

  const totalAmount = transactions.reduce((total, current) => total + current.amount, 0);

  return {
    swaps,
    totalFee: 0,
    totalAmount,
  };
};

const sandbox = sinon.createSandbox();

describe('Processing Swaps', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#getTransactions', () => {
    it('should return an empty array if swaps is not an array', () => {
      const invalid = [0, null, {}, undefined, 'abc'];
      for (const val of invalid) {
        const transactions = functions.getTransactions(val);
        assert.lengthOf(transactions, 0);
      }

      const valid = [{ address: '1', amount: '10' }];
      const transactions = functions.getTransactions(valid);
      assert.lengthOf(transactions, 1);
    });

    it('should combine swap amounts', () => {
      const swaps = [
        { address: '1', amount: '10' },
        { address: '1', amount: 20 },
        { address: '2', amount: '15' },
      ];

      const transactions = functions.getTransactions(swaps);
      assert.deepEqual(transactions, [
        { address: '1', amount: 30 },
        { address: '2', amount: 15 },
      ]);
    });

    it('should be able to parse string amounts', () => {
      const transactions = functions.getTransactions([{ address: '1', amount: '12.3456789' }]);
      assert.deepEqual(transactions, [{ address: '1', amount: 12.3456789 }]);
    });

    it('should return a 0 amount if swap amount was not a number', () => {
      const transactions = functions.getTransactions([{ address: '1', amount: 'invalid amount' }]);
      assert.deepEqual(transactions, [{ address: '1', amount: 0 }]);
    });
  });

  describe('#send', () => {
    const transactions = [{ address: '1', amount: 7 * 1e9 }];

    let bnbStub;
    let lokiStub;

    beforeEach(() => {
      bnbStub = sandbox.stub(bnb, 'multiSend');
      lokiStub = sandbox.stub(loki, 'multiSend');
    });

    it('should send to BNB if swap type is LOKI_TO_BLOKI', async () => {
      await functions.send(SWAP_TYPE.LOKI_TO_BLOKI, transactions);
      assert(bnbStub.called, 'bnb.multiSend was not called');
    });

    it('should send to LOKI if swap type is BLOKI_TO_LOKI', async () => {
      await functions.send(SWAP_TYPE.BLOKI_TO_LOKI, transactions);
      assert(lokiStub.called, 'loki.multiSend was not called');
    });

    it('should throw an error if swap type was invalid', async () => {
      try {
        await functions.send('invalid', transactions);
        assert.fail('Should have failed');
      } catch (e) {
        assert.strictEqual(e.message, 'Invalid swap type');
      }
    });

    it('should convert the transactions to correct outputs for BNB', async () => {
      await functions.send(SWAP_TYPE.LOKI_TO_BLOKI, transactions);

      const { args } = bnbStub.getCalls()[0];
      assert.lengthOf(args, 3);

      const outputs = args[1];
      assert.isNotNull(outputs);
      assert.deepEqual(outputs, [{
        to: transactions[0].address,
        coins: [{
          denom: 'TEST', // Defines in test.json
          amount: transactions[0].amount,
        }],
      }]);
    });

    it('should deduct the widthdrawal fee from each transaction for Loki', async () => {
      const fee = config.get('loki.withdrawalFee');

      await functions.send(SWAP_TYPE.BLOKI_TO_LOKI, transactions);

      const { args } = lokiStub.getCalls()[0];
      assert.lengthOf(args, 1);

      const outputs = args[0];
      assert.isNotNull(outputs);
      assert.deepEqual(outputs, [{
        address: transactions[0].address,
        amount: transactions[0].amount - (fee * 1e9),
      }]);
    });
  });

  describe('#processSwaps', () => {
    beforeEach(async () => {
      sandbox.stub(bnb, 'multiSend').resolves(['bnbTxHash1', 'bnbTxHash2']);
      sandbox.stub(loki, 'multiSend').resolves(['lokiTxHash1', 'lokiTxHash2']);
      sandbox.stub(db, 'updateSwapsTransferTransactionHash').resolves();
    });

    it('should throw an error if swaps were empty', async () => {
      try {
        await functions.processSwaps([], SWAP_TYPE.LOKI_TO_BLOKI);
        assert.fail();
      } catch (e) {
        assert.instanceOf(e, functions.Errors.NoSwapsToProcess);
      }
    });

    it('should return the correct data if it succeeds', async () => {
      const fee = 20;
      sandbox.stub(functions, 'fees').value({
        [TYPE.LOKI]: fee,
        [TYPE.BNB]: 0,
      });

      const values = {
        a: [100, 200],
        b: [150],
      };

      const swaps = Object.keys(values).flatMap((address, i) => {
        const amounts = values[address];
        return amounts.map(amount => ({ uuid: i, amount, address }));
      });

      const total = Object.values(values).flat().reduce((acc, v) => acc + v, 0);

      // Fee should only be charged once per address
      const expectedFees = fee * Object.keys(values).length;

      // Make sure we get the LOKI fees
      const data = await functions.processSwaps(swaps, SWAP_TYPE.BLOKI_TO_LOKI);
      assert.isNotNull(data);
      assert.deepEqual(data, {
        swaps,
        totalAmount: total - expectedFees,
        totalFee: expectedFees,
      });
    });
  });

  describe('#processAutoSwaps', () => {
    const usdPrice = 0.5;
    beforeEach(async () => {
      sandbox.stub(functions, 'getCurrentLokiPriceInUSD').resolves(usdPrice);
      sandbox.stub(functions, 'processSwaps').callsFake(processSwapFake);
    });

    it('should throw an error if usd price is null', async () => {
      sandbox.restore();
      sandbox.stub(functions, 'getCurrentLokiPriceInUSD').resolves(null);

      try {
        await functions.processAutoSwaps(10, 100, SWAP_TYPE.LOKI_TO_BLOKI);
        assert.fail();
      } catch (e) {
        assert.instanceOf(e, functions.Errors.PriceFetchFailed);
      }
    });

    it('should throw an error if usd price was less than 0', async () => {
      sandbox.restore();
      sandbox.stub(functions, 'getCurrentLokiPriceInUSD').resolves(-1);

      try {
        await functions.processAutoSwaps(10, 100, SWAP_TYPE.BLOKI_TO_LOKI);
        assert.fail();
      } catch (e) {
        assert.instanceOf(e, functions.Errors.PriceFetchFailed);
      }
    });

    it('should throw an error if no swaps were processed', async () => {
      sandbox.stub(db, 'getPendingSwaps').resolves([]);

      try {
        await functions.processAutoSwaps(10, 100, SWAP_TYPE.BLOKI_TO_LOKI);
        assert.fail();
      } catch (e) {
        assert.instanceOf(e, functions.Errors.NoSwapsToProcess);
      }
    });

    it('should throw an error if daily amount is greater or equal to the limit', async () => {
      sandbox.stub(db, 'getPendingSwaps').resolves([{ uuid: 1, amount: 100, address: 'a' }]);

      const pairs = [[100, 100], [101, 100]];
      for (const [amount, limit] of pairs) {
        try {
          await functions.processAutoSwaps(amount, limit, SWAP_TYPE.BLOKI_TO_LOKI);
          assert.fail();
        } catch (e) {
          assert.instanceOf(e, functions.Errors.DailyLimitHit);
        }
      }
    });

    it('should not throw an error if daily amount is less than the limit', async () => {
      sandbox.stub(db, 'getPendingSwaps').resolves([{ uuid: 1, amount: 100, address: 'a' }]);

      try {
        await functions.processAutoSwaps(10, 100, SWAP_TYPE.BLOKI_TO_LOKI);
      } catch (e) {
        console.log(e);
        assert.fail();
      }
    });

    it('should process all transactions if daily limit has not been hit', async () => {
      const swaps = ['a', 'b', 'c'].map((a, i) => ({ uuid: i, amount: (i + 1) * 1e9, address: a }));
      sandbox.stub(db, 'getPendingSwaps').resolves(swaps);

      const data = await functions.processAutoSwaps(0, 99 * 1e9, SWAP_TYPE.LOKI_TO_BLOKI);
      assert.deepEqual(data.swaps, swaps);
    });

    it('should only process transactions up to the daily limit', async () => {
      const amounts = [1e9, 2e9, 3e9, 5.7e9];
      const swaps = ['a', 'b', 'c'].map((a, i) => ({ uuid: i, amount: amounts[i], address: a }));
      sandbox.stub(db, 'getPendingSwaps').resolves(swaps);

      // This will target amounts[0] and amounts[1]
      const max = amounts[0] + amounts[1];
      const maxUSD = (max / 1e9) * usdPrice;

      const data = await functions.processAutoSwaps(0, maxUSD, SWAP_TYPE.LOKI_TO_BLOKI);
      assert.deepEqual(data.swaps, swaps.slice(0, 2));
    });

    it('should be allowed to process 1 swap above the daily limit', async () => {
      const amounts = [1e9, 2e9, 3e9];
      const swaps = ['a', 'b', 'c'].map((a, i) => ({ uuid: i, amount: amounts[i], address: a }));
      sandbox.stub(db, 'getPendingSwaps').resolves(swaps);

      // This should still allow amount[1] to be processed
      const max = amounts[0] + (0.1 * 1e9);
      const maxUSD = (max / 1e9) * usdPrice;

      const data = await functions.processAutoSwaps(0, maxUSD, SWAP_TYPE.LOKI_TO_BLOKI);
      assert.deepEqual(data.swaps, swaps.slice(0, 2));
    });

    it('should properly process swaps with the same addresses', async () => {
      const amounts = [1e9, 2e9, 3e9];
      const swaps = ['a', 'a', 'a'].map((a, i) => ({ uuid: i, amount: amounts[i], address: a }));
      sandbox.stub(db, 'getPendingSwaps').resolves(swaps);

      const data = await functions.processAutoSwaps(0, 99 * 1e9, SWAP_TYPE.LOKI_TO_BLOKI);
      assert.deepEqual(data.swaps, swaps);
    });

    it('should return the correct data', async () => {
      const amounts = [1.5e9, 2.32e9, 3.68e9];
      const swaps = ['a', 'b', 'c'].map((a, i) => ({ uuid: i, amount: amounts[i], address: a }));
      sandbox.stub(db, 'getPendingSwaps').resolves(swaps);
      sandbox.stub(functions, 'fees').value({
        [TYPE.LOKI]: 0,
        [TYPE.BNB]: 0,
      });

      const data = await functions.processAutoSwaps(0, 99 * 1e9, SWAP_TYPE.LOKI_TO_BLOKI);

      const sum = (a, b) => a + b;
      const total = amounts.reduce(sum, 0);

      // The sum of the usd is the sum of (amount (in decimal) * usd price)
      const usdSum = amounts.map(a => (a / 1e9) * usdPrice).reduce(sum, 0);

      assert.deepEqual(data, {
        swaps,
        totalAmount: total,
        totalFee: 0,
        totalUSD: usdSum,
      });
    });
  });

  describe('#processAllSwapsOfType', () => {
    beforeEach(async () => {
      // Clear out any data in the db
      await postgres.none('TRUNCATE client_accounts, accounts_loki, accounts_bnb, swaps CASCADE;');

      sandbox.stub(bnb, 'multiSend').resolves(['bnbTxHash1', 'bnbTxHash2']);
      sandbox.stub(loki, 'multiSend').resolves(['lokiTxHash1', 'lokiTxHash2']);
    });

    const processAllSwapsOfType = async swapType => {
      const addressType = swapType === SWAP_TYPE.LOKI_TO_BLOKI ? TYPE.BNB : TYPE.LOKI;
      const accountType = addressType === TYPE.BNB ? TYPE.LOKI : TYPE.BNB;
      const clientAccountUuid = 'cbfa4d0f-cecb-4c46-88b8-719bbca6395a';
      const swapUuid = 'a2a67748-ae5d-415c-81d6-803d28dc29fb';

      await postgres.tx(t => t.batch([
        dbHelper.insertClientAccount(clientAccountUuid, 'address', addressType, 'uuid', accountType),
        dbHelper.insertSwap(swapUuid, swapType, 10 * 1e9, clientAccountUuid, 'pending'),
      ]));

      await functions.processAllSwapsOfType(swapType);

      return postgres.oneOrNone('select transfer_transaction_hash from swaps where uuid = $1', [swapUuid]);
    };

    context('LOKI_TO_BLOKI', () => {
      it('should update the transfer transactions hash on success', async () => {
        const swap = await processAllSwapsOfType(SWAP_TYPE.LOKI_TO_BLOKI);
        assert.isNotNull(swap);
        assert.strictEqual(swap.transfer_transaction_hash, 'bnbTxHash1,bnbTxHash2');
      });
    });

    context('BLOKI_TO_LOKI', () => {
      it('should update the transfer transactions hash on success', async () => {
        const swap = await processAllSwapsOfType(SWAP_TYPE.BLOKI_TO_LOKI);
        assert.isNotNull(swap);
        assert.strictEqual(swap.transfer_transaction_hash, 'lokiTxHash1,lokiTxHash2');
      });
    });
  });
});
