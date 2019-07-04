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
        const memo = 'meme-mos';
        const mockAPIResult = [{
          txHash: 'hash',
          value: '100',
          memo,
          timestamp: 100,
        }];

        const stub = sandbox.stub(bnb, 'getIncomingTransactions').returns(mockAPIResult);

        const transactions = await transaction.getIncomingTransactions({ memo }, TYPE.BNB);
        assert(stub.calledOnce, 'bnb.getIncomingTransactions was not called');
        assert.lengthOf(transactions, 1);

        assert.deepEqual(transactions[0], {
          hash: 'hash',
          amount: '100',
        });
      });

      it('should should only return the tx with the same account memo', async () => {
        const mockAPIResult = ['memo1', 'memo2', 'memo3'].map((memo, i) => ({
          txHash: String(i),
          value: String(i),
          memo,
          timestamp: 100,
        }));

        sandbox.stub(bnb, 'getIncomingTransactions').returns(mockAPIResult);

        const transactions = await transaction.getIncomingTransactions({ memo: 'memo1' }, TYPE.BNB);
        assert.lengthOf(transactions, 1);
        assert.deepEqual(transactions[0], {
          hash: '0',
          amount: '0',
        });
      });
    });

    context('Loki', () => {
      it('should correctly return the incoming transactions', async () => {
        const mockAPIResult = [{
          txid: 'hash',
          amount: '100',
          confirmations: 6,
          timestamp: 100,
        }];

        const stub = sandbox.stub(loki, 'getIncomingTransactions').returns(mockAPIResult);

        const transactions = await transaction.getIncomingTransactions({ addressIndex: 0 }, TYPE.LOKI);
        assert(stub.calledOnce, 'loki.getIncomingTransactions was not called');
        assert.lengthOf(transactions, 1);
        assert.deepEqual(transactions[0], {
          hash: 'hash',
          amount: '100',
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
