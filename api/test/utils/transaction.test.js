import { assert } from 'chai';
import sinon from 'sinon';
import { transaction, TYPE, db } from '../../utils';
import { bnb, loki } from '../../helpers';

const ourBnbAddress = 'ourAddress';

const sandbox = sinon.createSandbox();

describe('Transaction', () => {
  beforeEach(() => {
    sandbox.stub(bnb, 'getOurAddress').returns(ourBnbAddress);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#getIncomingTransactions', async () => {
    context('BNB', () => {
      it('should correctly return the incoming transactions', async () => {
        const txHash = 'tx_hash';
        const value = '100';
        const memo = 'memo';

        const mockAPIResult = [{
          txHash,
          value,
          memo,
        }];

        const stub = sandbox.stub(bnb, 'getIncomingTransactions').returns(mockAPIResult);

        const transactions = await transaction.getIncomingTransactions({ memo }, TYPE.BNB);
        assert(stub.calledOnce, 'bnb.getIncomingTransactions was not called');
        assert.lengthOf(transactions, 1);

        assert.deepEqual(transactions[0], {
          hash: txHash,
          amount: value,
          memo,
        });
      });

      it('should should only return the tx with the same account memo', async () => {
        const mockAPIResult = ['memo1', 'memo2', 'memo3'].map((memo, i) => ({
          txHash: i,
          value: i,
          memo,
        }));

        sandbox.stub(bnb, 'getIncomingTransactions').returns(mockAPIResult);

        const transactions = await transaction.getIncomingTransactions({ memo: 'memo1' }, TYPE.BNB);
        assert.lengthOf(transactions, 1);
      });
    });

    context('Loki', () => {
      it('should correctly return the incoming transactions', async () => {
        const txid = 'tx_hash';
        const amount = '100';

        const mockAPIResult = [{
          txid,
          amount,
          confirmations: 6,
        }];

        const stub = sandbox.stub(loki, 'getIncomingTransactions').returns(mockAPIResult);

        const transactions = await transaction.getIncomingTransactions({ addressIndex: 0 }, TYPE.LOKI);
        assert(stub.calledOnce, 'loki.getIncomingTransactions was not called');
        assert.lengthOf(transactions, 1);
        assert.deepEqual(transactions[0], {
          hash: txid,
          amount,
          confirmations: 6,
        });
      });

      it('should only return incoming transactions with more than 5 confirmations', async () => {
        const mockAPIResult = [5, 6, 7].map(confirmations => ({
          txid: confirmations,
          amount: 100,
          confirmations,
        }));

        sandbox.stub(db, 'getLokiAccount').returns({ address_index: 0 });
        const stub = sandbox.stub(loki, 'getIncomingTransactions').returns(mockAPIResult);

        const transactions = await transaction.getIncomingTransactions({ addressIndex: 0 }, TYPE.LOKI);
        assert(stub.calledOnce, 'loki.getIncomingTransactions was not called');
        assert.lengthOf(transactions, 2);
        assert.includeMembers(transactions.map(t => t.hash), [6, 7]);
      });
    });
  });
});
