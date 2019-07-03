import config from 'config';
import { assert } from 'chai';
import sinon from 'sinon';
import * as swapRoutes from '../../routes/swap';
import { bnb, loki, postgres } from '../../helpers';
import { db, TYPE, SWAP_TYPE, validation, transaction } from '../../utils';
import { dbHelper, wrapRouterFunction } from '../helpers';

const sandbox = sinon.createSandbox();

const swapToken = params => wrapRouterFunction(swapRoutes.swapToken, params);
const finalizeSwapToken = params => wrapRouterFunction(swapRoutes.finalizeSwap, params);
const getSwaps = params => wrapRouterFunction(swapRoutes.getSwaps, params);
const getWithdrawalFees = params => wrapRouterFunction(swapRoutes.getWithdrawalFees, params);

describe('Swap API', () => {
  beforeEach(async () => {
    // Clear out any data in the db
    await postgres.none('TRUNCATE client_accounts, accounts_loki, accounts_bnb, swaps CASCADE;');

    // Pretend all our addresses we pass are valid for these tests
    sandbox.stub(loki, 'validateAddress').returns(true);
    sandbox.stub(bnb, 'validateAddress').returns(true);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('#swapToken', () => {
    describe('failure', () => {
      it('should return 400 if validation failed', async () => {
        sandbox.restore();
        sandbox.stub(loki, 'validateAddress').returns(false);
        sandbox.stub(bnb, 'validateAddress').returns(false);

        const spy = sandbox.spy(validation, 'validateSwap');

        const failingData = [
          null,
          { type: SWAP_TYPE.LOKI_TO_BLOKI },
          { address: '123', type: 'invalid type' },

          // validateAddress for both loki and bnb have been stubbed to return false
          // Which should cause these to fail
          { address: '123', type: SWAP_TYPE.LOKI_TO_BLOKI },
          { address: '123', type: SWAP_TYPE.BLOKI_TO_LOKI },
        ];

        const results = await Promise.all(failingData.map(swapToken));
        results.forEach(({ status, success }) => {
          assert.equal(status, 400);
          assert.isFalse(success);
        });

        // Make sure we hit the validate
        assert.equal(spy.callCount, failingData.length);
      });

      it('should return 500 if we failed to create an account', async () => {
        const lokiCreateAccount = sandbox.stub(loki, 'createAccount').returns(null);
        const bnbCreateAccount = sandbox.stub(bnb, 'createAccountWithMnemonic').returns(null);

        const data = Object.values(SWAP_TYPE).map(type => ({ address: '123', type }));
        const results = await Promise.all(data.map(swapToken));
        results.forEach(({ status, success, result }) => {
          assert.equal(status, 500);
          assert.isFalse(success);
          assert.equal(result, 'Invalid swap');
        });

        assert(lokiCreateAccount.called, 'loki.createAccount was not called');
        assert(bnbCreateAccount.called, 'bnb.createAccountWithMnemonic was not called');
      });
    });

    describe('success', () => {
      it('should return the existing client account', async () => {
        const lokiAccountUuid = 'd27efda6-988b-11e9-a2a3-2a2ae2dbcce4';
        const bnbAccountUuid = 'd27efff4-988b-11e9-a2a3-2a2ae2dbcce4';
        const lokiClientAccount = 'd27f01b6-988b-11e9-a2a3-2a2ae2dbcce4';
        const bnbClientAccount = 'd27f031e-988b-11e9-a2a3-2a2ae2dbcce4';

        const bnbAddress = '456';
        const lokiAddress = '123';

        await postgres.tx(t => t.batch([
          dbHelper.insertLokiAccount(lokiAccountUuid, 'lokiAddress', 0),
          dbHelper.insertBNBAccount(bnbAccountUuid, 'bnbAddress'),
          // Mapping user loki address to generated bnb
          dbHelper.insertClientAccount(lokiClientAccount, lokiAddress, TYPE.LOKI, bnbAccountUuid, TYPE.BNB),
          // Mapping user bnb address to generated loki
          dbHelper.insertClientAccount(bnbClientAccount, bnbAddress, TYPE.BNB, lokiAccountUuid, TYPE.LOKI),
        ]));

        // LOKI_TO_BLOKI means we give the api our BNB address
        const lokiToBnb = await swapToken({ type: SWAP_TYPE.LOKI_TO_BLOKI, address: bnbAddress });
        assert.equal(lokiToBnb.status, 200);
        assert.isTrue(lokiToBnb.success);
        assert.deepEqual(lokiToBnb.result, {
          uuid: bnbClientAccount,
          userAddressType: TYPE.BNB,
          lokiAddress: 'lokiAddress',
          bnbAddress,
        });

        // BLOKI_TO_LOKI means we give the api our LOKI address
        const bnbToLoki = await swapToken({ type: SWAP_TYPE.BLOKI_TO_LOKI, address: lokiAddress });
        assert.equal(bnbToLoki.status, 200);
        assert.isTrue(bnbToLoki.success);
        assert.deepEqual(bnbToLoki.result, {
          uuid: lokiClientAccount,
          userAddressType: TYPE.LOKI,
          lokiAddress,
          bnbAddress: 'bnbAddress',
        });
      });

      it('should create a new account and return it if one does not exist', async () => {
        const bnbAddress = '456';
        const lokiAddress = '123';

        const generatedBNBAccount = {
          privateKey: '123',
          address: 'generatedBNB',
          mnemonic: 'mnemonic',
        };
        sandbox.stub(bnb, 'createAccountWithMnemonic').returns(generatedBNBAccount);

        const generateLokiAccount = {
          address: 'generatedLoki',
          address_index: 0,
        };
        sandbox.stub(loki, 'createAccount').returns(generateLokiAccount);

        const lokiToBnb = await swapToken({ type: SWAP_TYPE.LOKI_TO_BLOKI, address: bnbAddress });
        assert.equal(lokiToBnb.status, 200);
        assert.isTrue(lokiToBnb.success);

        const { result: lokiClientAccount } = lokiToBnb;
        assert.strictEqual(lokiClientAccount.userAddressType, TYPE.BNB);
        assert.strictEqual(lokiClientAccount.lokiAddress, 'generatedLoki');
        assert.strictEqual(lokiClientAccount.bnbAddress, bnbAddress);

        const bnbToLoki = await swapToken({ type: SWAP_TYPE.BLOKI_TO_LOKI, address: lokiAddress });
        assert.equal(bnbToLoki.status, 200);
        assert.isTrue(bnbToLoki.success);

        const { result: bnbClientAccount } = bnbToLoki;
        assert.strictEqual(bnbClientAccount.userAddressType, TYPE.LOKI);
        assert.strictEqual(bnbClientAccount.lokiAddress, lokiAddress);
        assert.strictEqual(bnbClientAccount.bnbAddress, 'generatedBNB');
      });
    });
  });

  describe('#finalizeSwap', () => {
    const clientAccount = {
      uuid: 'd27efff4-988b-11e9-a2a3-2a2ae2dbcce4',
      address: 'LOKI',
      addressType: TYPE.LOKI,
      accountAddress: 'BNB',
      accountType: TYPE.BNB,
    };

    describe('failure', () => {
      it('should return 400 if validation failed', async () => {
        const spy = sandbox.spy(validation, 'validateUuidPresent');

        const failingData = [null, {}];
        const results = await Promise.all(failingData.map(finalizeSwapToken));
        results.forEach(({ status, success }) => {
          assert.equal(status, 400);
          assert.isFalse(success);
        });

        // Make sure we hit the validate
        assert.equal(spy.callCount, failingData.length);
      });

      it('should return 400 if no client account for the given uuid exists', async () => {
        const spy = sandbox.spy(db, 'getClientAccountForUuid');

        const { count } = await postgres.one('select count(*) from client_accounts');
        assert.equal(count, 0);

        const { status, success, result } = await finalizeSwapToken({ uuid: 'fake' });
        assert(spy.called, 'db.getClientAccountForUuid was not called');
        assert.equal(status, 400);
        assert.isFalse(success);
        assert.strictEqual(result, 'Unable to find swap details');
      });

      it('should return 400 if no incoming transactions were found', async () => {
        sandbox.stub(db, 'getClientAccountForUuid').returns(clientAccount);
        sandbox.stub(transaction, 'getIncomingTransactions').returns([]);
        sandbox.stub(db, 'getSwapsForClientAccount').returns([]);

        const { status, success, result } = await finalizeSwapToken({ uuid: 'fake' });
        assert.equal(status, 400);
        assert.isFalse(success);
        assert.strictEqual(result, 'Unable to find a deposit');
      });

      it('should return 400 if no NEW incoming transactions were found', async () => {
        const txHash = '1234';

        sandbox.stub(db, 'getClientAccountForUuid').returns(clientAccount);
        sandbox.stub(transaction, 'getIncomingTransactions').returns([{ hash: txHash, amount: 100 }]);
        sandbox.stub(db, 'getSwapsForClientAccount').returns([{ deposit_transaction_hash: txHash }]);

        const { status, success, result } = await finalizeSwapToken({ uuid: 'fake' });
        assert.equal(status, 400);
        assert.isFalse(success);
        assert.strictEqual(result, 'Unable to find any new deposits');
      });
    });

    describe('success', () => {
      const transactions = [1, 2, 3].map(t => ({ hash: String(t), amount: t }));

      beforeEach(() => {
        sandbox.stub(db, 'getClientAccountForUuid').returns(clientAccount);
      });

      it('should return the newly inserted swaps', async () => {
        sandbox.stub(transaction, 'getIncomingTransactions').returns(transactions);
        sandbox.stub(db, 'getSwapsForClientAccount').returns([]);

        const { status, success, result } = await finalizeSwapToken({ uuid: 'fake' });
        assert.equal(status, 200);
        assert.isTrue(success);
        assert.lengthOf(result, transactions.length);
      });

      it('should filter out transactions which we have swaps for', async () => {
        const swaps = [1, 2].map(t => ({ deposit_transaction_hash: String(t) }));
        sandbox.stub(transaction, 'getIncomingTransactions').returns(transactions);
        sandbox.stub(db, 'getSwapsForClientAccount').returns(swaps);

        const { status, success, result } = await finalizeSwapToken({ uuid: 'fake' });
        assert.equal(status, 200);
        assert.isTrue(success);
        assert.lengthOf(result, 1);

        const swap = result[0];
        assert.strictEqual(swap.txHash, '3');
      });

      it('should return the correct data', async () => {
        const txHash = '123';
        sandbox.stub(transaction, 'getIncomingTransactions').returns([{ hash: txHash, amount: 100 }]);
        sandbox.stub(db, 'getSwapsForClientAccount').returns([]);

        const { status, success, result } = await finalizeSwapToken({ uuid: 'fake' });
        assert.equal(status, 200);
        assert.isTrue(success);
        assert.lengthOf(result, 1);

        const swap = result[0];
        assert.strictEqual(swap.type, SWAP_TYPE.BLOKI_TO_LOKI);
        assert.strictEqual(swap.lokiAddress, clientAccount.address);
        assert.strictEqual(swap.bnbAddress, clientAccount.accountAddress);
        assert.equal(swap.amount, 100);
        assert.strictEqual(swap.txHash, txHash);
      });

      it('should have inserted the swaps in the db', async () => {
        sandbox.stub(transaction, 'getIncomingTransactions').returns(transactions);
        sandbox.stub(db, 'getSwapsForClientAccount').returns([]);

        const { status, success } = await finalizeSwapToken({ uuid: 'fake' });
        assert.equal(status, 200);
        assert.isTrue(success);

        const { count } = await postgres.one('select count(*) from swaps');
        assert.equal(count, transactions.length);
      });
    });
  });

  describe('#getSwaps', () => {
    describe('failure', () => {
      it('should return 400 if validation failed', async () => {
        const spy = sandbox.spy(validation, 'validateUuidPresent');

        const failingData = [null, {}];
        const results = await Promise.all(failingData.map(finalizeSwapToken));
        results.forEach(({ status, success }) => {
          assert.equal(status, 400);
          assert.isFalse(success);
        });

        // Make sure we hit the validate
        assert.equal(spy.callCount, failingData.length);
      });

      it('should return 400 if no client account for the given uuid exists', async () => {
        const spy = sandbox.spy(db, 'getClientAccountForUuid');

        const { count } = await postgres.one('select count(*) from client_accounts');
        assert.equal(count, 0);

        const { status, success, result } = await getSwaps({ uuid: 'fake' });
        assert(spy.called, 'db.getClientAccountForUuid was not called');
        assert.equal(status, 400);
        assert.isFalse(success);
        assert.strictEqual(result, 'Unable to find swap details');
      });
    });

    describe('success', () => {
      const clientAccount = {
        uuid: 'd27efff4-988b-11e9-a2a3-2a2ae2dbcce4',
        address: 'LOKI',
        addressType: TYPE.LOKI,
        accountAddress: 'BNB',
        accountType: TYPE.BNB,
      };

      beforeEach(() => {
        sandbox.stub(db, 'getClientAccountForUuid').returns(clientAccount);
      });

      it('should return all the swaps for the given client account', async () => {
        const swaps = [1, 2, 3].map(id => ({
          uuid: id,
          type: SWAP_TYPE.BLOKI_TO_LOKI,
          amount: id * 100,
          txHash: id,
        }));
        sandbox.stub(db, 'getSwapsForClientAccount').returns(swaps);

        const { status, success, result } = await getSwaps({ uuid: 'fake' });
        assert.equal(status, 200);
        assert.isTrue(success);
        assert.lengthOf(result, swaps.length);
      });

      it('should return the correct data if swap has not been processed', async () => {
        const swap = {
          uuid: 'swapuuid',
          type: SWAP_TYPE.BLOKI_TO_LOKI,
          amount: 100,
          deposit_transaction_hash: 'deposit',
          created: 'now',
        };
        sandbox.stub(db, 'getSwapsForClientAccount').returns([swap]);

        const { status, result } = await getSwaps({ uuid: 'fake' });
        assert.equal(status, 200);
        assert.lengthOf(result, 1);

        const returnedSwap = result[0];
        assert.strictEqual(returnedSwap.uuid, swap.uuid);
        assert.strictEqual(returnedSwap.type, swap.type);
        assert.equal(returnedSwap.amount, swap.amount);
        assert.strictEqual(returnedSwap.lokiAddress, clientAccount.address);
        assert.strictEqual(returnedSwap.bnbAddress, clientAccount.accountAddress);
        assert.strictEqual(returnedSwap.txHash, swap.deposit_transaction_hash);
        assert.isEmpty(returnedSwap.transferTxHashes);
        assert.strictEqual(returnedSwap.created, 'now');
      });

      it('should return the array of transaction hashes if swap has been processed', async () => {
        const swap = {
          uuid: 'swapuuid',
          type: SWAP_TYPE.BLOKI_TO_LOKI,
          amount: 100,
          deposit_transaction_hash: 'deposit',
          transfer_transaction_hash: 'hash1,hash2',
          created: 'now',
        };
        sandbox.stub(db, 'getSwapsForClientAccount').returns([swap]);

        const { status, result } = await getSwaps({ uuid: 'fake' });
        assert.equal(status, 200);
        assert.lengthOf(result, 1);

        const returnedSwap = result[0];
        assert.deepEqual(returnedSwap.transferTxHashes, ['hash1', 'hash2']);
      });
    });
  });

  describe('#getWithdrawalFees', () => {
    it('should return the correct fees', async () => {
      const lokiFee = config.get('loki.withdrawalFee');
      const { status, success, result } = await getWithdrawalFees();
      assert.equal(status, 200);
      assert.isTrue(success);
      assert.isNotNull(result);
      assert.equal(result.loki, lokiFee * 1e9);
    });
  });
});
