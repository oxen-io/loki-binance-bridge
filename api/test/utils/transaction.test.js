import { assert } from 'chai';
import sinon from 'sinon';
import { transaction, TYPE, db } from '../../utils';
import { bnb, loki } from '../../helpers';

const sandbox = sinon.createSandbox();

describe('Transaction', () => {
  afterEach(() => {
    sandbox.restore();
  });

  describe('#getIncomingTransactions', async () => {
    context('BNB', () => {
      it('should correctly return the incoming transactions', async () => {
        const txHash = 'tx_hash';
        const value = '100';

        const mockAPIResult = [{
          txHash,
          value,
        }];

        const stub = sandbox.stub(bnb, 'getIncomingTransactions').returns(Promise.resolve(mockAPIResult));

        const transactions = await transaction.getIncomingTransactions('123', TYPE.BNB);
        assert(stub.calledOnce, 'bnb.getIncomingTransactions was not called');
        assert.lengthOf(transactions, 1);

        assert.strictEqual(transactions[0].hash, txHash);
        assert.strictEqual(transactions[0].amount, value);
      });
    });

    context('Loki', () => {
      it('should return empty transactions if we failed to find a loki account in the database', async () => {
        const stub = sandbox.stub(db, 'getLokiAccount').returns(Promise.resolve(null));
        const transactions = await transaction.getIncomingTransactions('123', TYPE.LOKI);
        assert(stub.calledOnce, 'db.getLokiAccount was not called');
        assert.isEmpty(transactions);
      });

      it('should correctly return the incoming transactions', async () => {
        const txid = 'tx_hash';
        const amount = '100';

        const mockAPIResult = [{
          txid,
          amount,
          confirmations: 6,
        }];

        sandbox.stub(db, 'getLokiAccount').returns(Promise.resolve({ address_index: 0 }));
        const stub = sandbox.stub(loki, 'getIncomingTransactions').returns(Promise.resolve(mockAPIResult));

        const transactions = await transaction.getIncomingTransactions('123', TYPE.LOKI);
        assert(stub.calledOnce, 'loki.getIncomingTransactions was not called');
        assert.lengthOf(transactions, 1);

        assert.strictEqual(transactions[0].hash, txid);
        assert.strictEqual(transactions[0].amount, amount);
      });

      it('should only return incoming transactions with more than 5 confirmations', async () => {
        const mockAPIResult = [5, 6, 7].map(confirmations => ({
          txid: confirmations,
          amount: 100,
          confirmations,
        }));

        sandbox.stub(db, 'getLokiAccount').returns(Promise.resolve({ address_index: 0 }));
        const stub = sandbox.stub(loki, 'getIncomingTransactions').returns(Promise.resolve(mockAPIResult));

        const transactions = await transaction.getIncomingTransactions('123', TYPE.LOKI);
        assert(stub.calledOnce, 'loki.getIncomingTransactions was not called');
        assert.lengthOf(transactions, 2);
        assert.includeMembers(transactions.map(t => t.hash), [6, 7]);
      });
    });
  });
});
