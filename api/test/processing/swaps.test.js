import { assert } from 'chai';
import sinon from 'sinon';
import config from 'config';
import { bnb, loki, postgres } from '../../helpers';
import * as functions from '../../processing/swaps';
import { SWAP_TYPE, TYPE } from '../../utils';
import { dbHelper } from '../helpers';

const sandbox = sinon.createSandbox();

describe('Processing Swaps', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#getTransactions', () => {
    it('should combine swap amounts', async () => {
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

    it('should be able to parse string amounts', async () => {
      const transactions = functions.getTransactions([{ address: '1', amount: '12.3456789' }]);
      assert.deepEqual(transactions, [{ address: '1', amount: 12.3456789 }]);
    });

    it('should return a 0 amount if swap amount was not a number', async () => {
      const transactions = functions.getTransactions([{ address: '1', amount: 'invalid amount' }]);
      assert.deepEqual(transactions, [{ address: '1', amount: 0 }]);
    });
  });

  describe('#send', () => {
    const transactions = [{ address: '1', amount: 10 }];

    let bnbStub;
    let lokiStub;

    beforeEach(() => {
      bnbStub = sandbox.stub(bnb, 'multiSend');
      lokiStub = sandbox.stub(loki, 'multiSend');
    });

    it('should send to BNB if swap type is LOKI_TO_BNB', async () => {
      await functions.send(SWAP_TYPE.LOKI_TO_BNB, transactions);
      assert(bnbStub.called, 'bnb.multiSend was not called');
    });

    it('should send to LOKI if swap type is BNB_TO_LOKI', async () => {
      await functions.send(SWAP_TYPE.BNB_TO_LOKI, transactions);
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
      await functions.send(SWAP_TYPE.LOKI_TO_BNB, transactions);

      const { args } = bnbStub.getCalls()[0];
      assert.lengthOf(args, 3);

      const outputs = args[1];
      assert.isNotNull(outputs);
      assert.deepEqual(outputs, [{
        to: '1',
        coins: [{
          denom: 'TEST', // Defines in test.json
          amount: 10,
        }],
      }]);
    });
  });

  describe('#processSwaps', () => {
    let bnbStub;
    let lokiStub;

    beforeEach(async () => {
      // Clear out any data in the db
      await postgres.none('TRUNCATE client_accounts, accounts_loki, accounts_bnb, swaps CASCADE;');

      bnbStub = sandbox.stub(bnb, 'multiSend').returns(['bnbTxHash1', 'bnbTxHash2']);
      lokiStub = sandbox.stub(loki, 'multiSend').returns(['lokiTxHash1', 'lokiTxHash2']);
    });

    const processSwap = async swapType => {
      const addressType = swapType === SWAP_TYPE.LOKI_TO_BNB ? TYPE.BNB : TYPE.LOKI;
      const accountType = addressType === TYPE.BNB ? TYPE.LOKI : TYPE.BNB;
      const clientAccountUuid = 'cbfa4d0f-cecb-4c46-88b8-719bbca6395a';
      const swapUuid = 'a2a67748-ae5d-415c-81d6-803d28dc29fb';

      await postgres.tx(t => t.batch([
        dbHelper.insertClientAccount(clientAccountUuid, 'address', addressType, 'uuid', accountType),
        dbHelper.insertSwap(swapUuid, swapType, 10, clientAccountUuid, 'pending'),
      ]));

      await functions.processSwaps(swapType);

      return postgres.oneOrNone('select transfer_transaction_hash from swaps where uuid = $1', [swapUuid]);
    };

    context('LOKI_TO_BNB', () => {
      it('should update the transfer transactions hash on success', async () => {
        const swap = await processSwap(SWAP_TYPE.LOKI_TO_BNB);
        assert.isNotNull(swap);
        assert.strictEqual(swap.transfer_transaction_hash, 'bnbTxHash1,bnbTxHash2');
      });
    });

    context('BNB_TO_LOKI', () => {
      it('should update the transfer transactions hash on success', async () => {
        const swap = await processSwap(SWAP_TYPE.BNB_TO_LOKI);
        assert.isNotNull(swap);
        assert.strictEqual(swap.transfer_transaction_hash, 'lokiTxHash1,lokiTxHash2');
      });
    });
  });
});
