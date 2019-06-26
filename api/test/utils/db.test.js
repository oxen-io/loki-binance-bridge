/* eslint-disable max-len, arrow-body-style, no-restricted-syntax */
import { assert } from 'chai';
import sinon from 'sinon';
import postgres from '../../helpers/postgres';
import { db, TYPE, SWAP_TYPE } from '../../utils';

const sandbox = sinon.createSandbox();

const insertLokiAccount = async (uuid, address, addressIndex) => {
  return postgres.none('insert into accounts_loki(uuid, address, address_index, created) values($1, $2, $3, now())', [uuid, address, addressIndex]);
};

const insertClientAccount = async (uuid, address, addressType, accountUuid, accountType) => {
  return postgres.none('insert into client_accounts(uuid, address, address_type, account_uuid, account_type, created) values ($1, $2, $3, $4, $5, now())', [uuid, address, addressType, accountUuid, accountType]);
};

const insertSwap = async (uuid, type, amount, clientAccountUuid, depositTransactionHash = null, transferTransactionHash = null, processed = null) => {
  return postgres.none('insert into swaps(uuid, type, amount, client_account_uuid, deposit_transaction_hash, transfer_transaction_hash, processed, created) values ($1, $2, $3, $4, $5, $6, $7, now())', [uuid, type, amount, clientAccountUuid, depositTransactionHash, transferTransactionHash, processed]);
};

describe('Database', () => {
  beforeEach(async () => {
    // Clear out any data in the db
    await postgres.none('TRUNCATE client_accounts, accounts_loki, accounts_bnb, swaps CASCADE;');
  });

  afterEach(() => {
    // Clear any fakes
    sandbox.restore();
  });

  describe('Client Account', () => {
    describe('#getClientAccountForUuid', () => {
      it('should return null if no client account exists', async () => {
        const { count } = await postgres.one('select count(*) from client_accounts');
        assert.equal(count, 0);

        const account = await db.getClientAccountForUuid('123');
        assert.isNull(account);
      });

      it('should return null if the account associated with the client account does not exist', async () => {
        const uuid = '17b42f9e-97b1-11e9-bc42-526af7764f64';
        await insertClientAccount(uuid, 'address', TYPE.BNB, 'aeb29bf6-97b1-11e9-bc42-526af7764f64', TYPE.LOKI);

        const dbClient = await postgres.oneOrNone('select * from client_accounts where uuid = $1;', [uuid]);
        assert.isNotNull(dbClient);

        const client = await db.getClientAccountForUuid(uuid);
        assert.isNull(client);
      });

      it('should return the correct client account if it exists', async () => {
        const uuid = '17b42f9e-97b1-11e9-bc42-526af7764f64';
        const address = 'an address';
        const addressType = TYPE.BNB;
        const accountAddress = 'account address';
        const accountType = TYPE.LOKI;
        const accountUuid = 'aeb29bf6-97b1-11e9-bc42-526af7764f64';

        await insertLokiAccount(accountUuid, accountAddress);
        await insertClientAccount(uuid, address, addressType, accountUuid, accountType);

        const client = await db.getClientAccountForUuid(uuid);
        assert.isNotNull(client);

        assert.deepEqual(client, {
          uuid,
          address,
          addressType,
          accountAddress,
          accountType,
        });
      });
    });

    describe('#getClientAccounts', () => {
      it('should return nothing if no accounts of the given type exist', async () => {
        // Insert a client account with a `LOKI` account type.
        await insertClientAccount('client account uuid', '1', TYPE.BNB, 'abcd', TYPE.LOKI);
        const results = await db.getClientAccounts(TYPE.BNB);
        assert.isEmpty(results);
      });

      it('should return all the accounts of the given type', async () => {
        await postgres.tx(t => t.batch([
          insertClientAccount('1', '1', TYPE.BNB, 'a', TYPE.LOKI),
          insertClientAccount('2', '1', TYPE.BNB, 'ab', TYPE.LOKI),
          insertClientAccount('3', '1', TYPE.BNB, 'abc', TYPE.LOKI),
          insertClientAccount('4', '1', TYPE.LOKI, 'abcd', TYPE.BNB),
          insertClientAccount('5', '1', TYPE.LOKI, 'abcde', TYPE.BNB),
        ]));

        const { count } = await postgres.one('select count(*) from client_accounts');
        assert.equal(count, 5);

        const lokiAccounts = await db.getClientAccounts(TYPE.LOKI);
        assert.lengthOf(lokiAccounts, 3);

        const bnbAccounts = await db.getClientAccounts(TYPE.BNB);
        assert.lengthOf(bnbAccounts, 2);
      });

      it('should return a null accountAddress if an account does not exist', async () => {
        await postgres.tx(t => t.batch([
          insertClientAccount('1', '1', TYPE.BNB, 'a', TYPE.LOKI),
          insertClientAccount('2', '1', TYPE.BNB, 'ab', TYPE.LOKI),
        ]));

        const accounts = await db.getClientAccounts(TYPE.LOKI);
        accounts.forEach(account => {
          assert.isNull(account.accountAddress);
        });
      });
    });

    describe('#getClientAccount', () => {
      it('should return null if no client account with the address and addressType exists', async () => {
        const { count } = await postgres.one('select count(*) from client_accounts');
        assert.equal(count, 0);

        const account = await db.getClientAccount('123', TYPE.LOKI);
        assert.isNull(account);
      });

      it('should return sanitized values', async () => {
        const uuid = '17b42f9e-97b1-11e9-bc42-526af7764f64';
        const lokiAddress = '123';
        const bnbAddress = '345';

        await insertLokiAccount('loki', lokiAddress, 0);
        await insertClientAccount(uuid, bnbAddress, TYPE.BNB, 'loki', TYPE.LOKI);

        const account = await db.getClientAccount(bnbAddress, TYPE.BNB);
        assert.isNotNull(account);
        assert.deepEqual(account, {
          uuid,
          userAddressType: TYPE.BNB,
          lokiAddress,
          bnbAddress,
        });
      });

      it('should return with a null address if an account does not exist', async () => {
        await insertClientAccount('uuid', '123', TYPE.LOKI, '456', TYPE.BNB);

        const account = await db.getClientAccount('123', TYPE.LOKI);
        assert.isNotNull(account);
        assert.isNull(account.bnbAddress);
      });
    });

    describe('#insertClientAccount', () => {
      it('should return null if an invalid account was passed', async () => {
        const insertLokiSpy = sandbox.spy(db, 'insertLokiAccount');
        const insertBNBSpy = sandbox.spy(db, 'insertBNBAccount');

        const result = await db.insertClientAccount('123', TYPE.LOKI, null);
        assert.isNull(result);
        assert(insertBNBSpy.called, 'insertBNBAccount was not called');

        const another = await db.insertClientAccount('123', TYPE.BNB, null);
        assert.isNull(another);
        assert(insertLokiSpy.called, 'insertLokiAccount was not called');
      });

      it('should insert a Loki account if address type is BNB', async () => {
        const lokiAddress = 'loki-address';
        await db.insertClientAccount('1234', TYPE.BNB, { address: lokiAddress, address_index: 0 });

        const accounts = await postgres.manyOrNone('select * from accounts_loki');
        assert.isNotNull(accounts);
        assert.lengthOf(accounts, 1);
        assert.strictEqual(accounts[0].address, lokiAddress);
      });

      it('should insert a BNB account if address type is LOKI', async () => {
        const bnbAddress = 'bnb-address';
        await db.insertClientAccount('1234', TYPE.LOKI, { address: bnbAddress, privateKey: 'abc' });

        const accounts = await postgres.manyOrNone('select * from accounts_bnb');
        assert.isNotNull(accounts);
        assert.lengthOf(accounts, 1);
        assert.strictEqual(accounts[0].address, bnbAddress);
      });

      it('should return sanitized values', async () => {
        const lokiAddress = '123';
        const bnbAddress = '456';

        const clientAccount = await db.insertClientAccount(lokiAddress, TYPE.LOKI, { address: bnbAddress, privateKey: 'abc' });
        assert.isNotNull(clientAccount);
        assert.strictEqual(clientAccount.lokiAddress, lokiAddress);
        assert.strictEqual(clientAccount.bnbAddress, bnbAddress);
        assert.strictEqual(clientAccount.userAddressType, TYPE.LOKI);
      });
    });
  });

  describe('Loki', () => {
    describe('#insertLokiAccount', () => {
      it('should return null if account is not set', async () => {
        const account = await db.insertLokiAccount(null);
        assert.isNull(account);
      });

      it('should insert the loki account we specified and return it', async () => {
        const address = 'abcd';
        const addressIndex = 0;

        const account = await db.insertLokiAccount({ address, address_index: addressIndex });
        assert.isNotNull(account);
        assert.strictEqual(account.address, address);
        assert.strictEqual(account.address_index, addressIndex);

        const { count } = await postgres.one('select count(*) from accounts_loki');
        assert.equal(count, 1);
      });
    });

    describe('#getLokiAccount', () => {
      it('should return null if it could not find and account', async () => {
        const { count } = await postgres.one('select count(*) from accounts_loki');
        assert.equal(count, 0);

        const account = await db.getLokiAccount('fake address');
        assert.isNull(account);
      });

      it('should return the account successfully if it exists', async () => {
        const uuid = '17b42f9e-97b1-11e9-bc42-526af7764f64';
        const address = 'abcdef';
        const index = 0;
        await insertLokiAccount(uuid, address, index);

        const account = await db.getLokiAccount(address);
        assert.isNotNull(account);
        assert.strictEqual(account.uuid, uuid);
        assert.strictEqual(account.address, address);
        assert.strictEqual(account.address_index, index);
      });
    });
  });

  describe('BNB', () => {
    describe('#insertBNBAccount', () => {
      it('should return null if account is not set', async () => {
        const account = await db.insertBNBAccount(null);
        assert.isNull(account);
      });

      it('should return the uuid and address if it exists', async () => {
        const address = 'abcdef';
        const account = await db.insertBNBAccount({ address, privateKey: 'abc' });
        assert.isNotNull(account);
        assert.strictEqual(account.address, address);
        assert.deepEqual(Object.keys(account), ['uuid', 'address']);
      });

      it('should store the encrypted private key', async () => {
        const privateKey = 'abcdef';
        const account = await db.insertBNBAccount({ address: '123', privateKey });
        assert.isNotNull(account);

        const { key } = await postgres.one('select encrypted_private_key as key from accounts_bnb where uuid = $1', [account.uuid]);
        assert.notStrictEqual(privateKey, key);
      });
    });

    describe('#getBNBAccount', () => {
      it('should return null if the account does not exist', async () => {
        const { count } = await postgres.one('select count(*) from accounts_bnb');
        assert.equal(count, 0);

        const account = await db.getBNBAccount('fake address');
        assert.isNull(account);
      });

      it('should return the account with the private key decrypted', async () => {
        const address = '123';
        const privateKey = 'private';
        const inserted = await db.insertBNBAccount({ address, privateKey });
        assert.isNotNull(inserted);

        const account = await db.getBNBAccount(address);
        assert.isNotNull(account);
        assert.deepEqual(account, {
          uuid: inserted.uuid,
          address,
          privateKey,
        });
      });
    });
  });

  describe('Swap', () => {
    describe('#getSwapsForClientAccount', () => {
      it('should return an empty array if no swaps were found', async () => {
        const { count } = await postgres.one('select count(*) from swaps');
        assert.equal(count, 0);

        const swaps = await db.getSwapsForClientAccount('abcd');
        assert.isEmpty(swaps);
      });

      it('should return all the swaps for the given client account', async () => {
        const clientUuid = 'clientUuid';
        await postgres.tx(t => t.batch([
          insertSwap('1', SWAP_TYPE.LOKI_TO_BNB, 1, clientUuid),
          insertSwap('2', SWAP_TYPE.BNB_TO_LOKI, 2, clientUuid),
          insertSwap('3', SWAP_TYPE.LOKI_TO_BNB, 4, 'another uuid'),
        ]));

        const swaps = await db.getSwapsForClientAccount(clientUuid);
        assert.lengthOf(swaps, 2);
      });
    });

    describe('#getPendingSwaps', () => {
      it('should return an empty array if no swaps were found', async () => {
        const { count } = await postgres.one('select count(*) from swaps');
        assert.equal(count, 0);

        const swaps = await db.getPendingSwaps(SWAP_TYPE.LOKI_TO_BNB);
        assert.isEmpty(swaps);
      });

      it('should return all the swaps that are pending', async () => {
        const clientUuid = '17b42f9e-97b1-11e9-bc42-526af7764f64';
        await postgres.tx(t => t.batch([
          insertSwap('1', SWAP_TYPE.LOKI_TO_BNB, 1, clientUuid, 'pending swap'),
          insertSwap('2', SWAP_TYPE.LOKI_TO_BNB, 1, clientUuid, 'completed swap', 'transaction', true),
          insertSwap('3', SWAP_TYPE.BNB_TO_LOKI, 1, clientUuid, 'pending swap'),
        ]));

        const swaps = await db.getPendingSwaps(SWAP_TYPE.LOKI_TO_BNB);
        assert.lengthOf(swaps, 1);
      });

      it('should return the correct data', async () => {
        const clientUuid = '17b42f9e-97b1-11e9-bc42-526af7764f64';
        const address = 'abc';
        const accountUuid = 'aeb29bf6-97b1-11e9-bc42-526af7764f64';
        const depositHash = '1234';

        await postgres.tx(t => t.batch([
          insertClientAccount(clientUuid, address, TYPE.LOKI, accountUuid, TYPE.BNB),
          insertSwap('1', SWAP_TYPE.LOKI_TO_BNB, 2, clientUuid, 'pending swap'),
          insertSwap('2', SWAP_TYPE.LOKI_TO_BNB, 9, clientUuid, 'completed swap', 'transaction', true),
          insertSwap('3', SWAP_TYPE.BNB_TO_LOKI, 10, clientUuid, depositHash),
        ]));

        const swaps = await db.getPendingSwaps(SWAP_TYPE.BNB_TO_LOKI);
        assert.lengthOf(swaps, 1);

        const swap = swaps[0];
        assert.strictEqual(swap.type, SWAP_TYPE.BNB_TO_LOKI);
        assert.equal(swap.amount, 10);
        assert.strictEqual(swap.deposit_transaction_hash, depositHash);
        assert.strictEqual(swap.address_type, TYPE.LOKI);
        assert.strictEqual(swap.address, address);
        assert.strictEqual(swap.account_type, TYPE.BNB);
        assert.strictEqual(swap.account_uuid, accountUuid);
      });
    });

    describe('#insertSwap', () => {
      it('should return null if a null transaction was passed', async () => {
        const swap = await db.insertSwap(null, { uuid: '1', addressType: TYPE.LOKI });
        assert.isNull(swap);
      });

      it('should return null if a null clientAccount was passed', async () => {
        const swap = await db.insertSwap({ hash: '1', amount: 2 }, null);
        assert.isNull(swap);
      });

      it('should insert the swap correctly', async () => {
        const clientUuid = '17b42f9e-97b1-11e9-bc42-526af7764f64';
        const swap = await db.insertSwap({ hash: '123', amount: 10 }, { uuid: clientUuid, addressType: TYPE.LOKI });
        assert.isNotNull(swap);

        const dbSwap = await postgres.oneOrNone('select * from swaps where uuid = $1', [swap.uuid]);
        assert.isNotNull(dbSwap);

        assert.strictEqual(dbSwap.uuid, swap.uuid);
        assert.strictEqual(dbSwap.type, SWAP_TYPE.LOKI_TO_BNB);
        assert.equal(dbSwap.amount, 10);
        assert.strictEqual(dbSwap.deposit_transaction_hash, '123');
        assert.strictEqual(dbSwap.client_account_uuid, clientUuid);
      });
    });

    describe('#insertSwaps', () => {
      const clientAccount = { uuid: '1', addressType: TYPE.LOKI, address: '123', accountAddress: '234' };
      const transactions = [1, 2, 3].map(t => ({ hash: String(t), amount: t }));

      it('should return an empty array if a null client account was passed', async () => {
        const swaps = await db.insertSwaps([{ hash: '123', amount: 1 }], null);
        assert.isEmpty(swaps);
      });

      it('should return an empty array if null or empty transactions were passed', async () => {
        const swaps = await db.insertSwaps(null, clientAccount);
        assert.isEmpty(swaps);

        const otherSwaps = await db.insertSwaps([], clientAccount);
        assert.isEmpty(otherSwaps);
      });

      it('should insert all the passed transactions', async () => {
        const swaps = await db.insertSwaps(transactions, clientAccount);
        assert.lengthOf(swaps, 3);

        const { count } = await postgres.one('select count(*) from swaps');
        assert.equal(count, 3);
      });

      it('should only insert valid transactions', async () => {
        const swaps = await db.insertSwaps([...transactions, null, null], clientAccount);
        assert.lengthOf(swaps, 3);

        const { count } = await postgres.one('select count(*) from swaps');
        assert.equal(count, 3);
      });

      it('should return the correct data', async () => {
        const transaction = { hash: '123', amount: 10 };
        const swaps = await db.insertSwaps([transaction], clientAccount);
        assert.lengthOf(swaps, 1);

        const swap = swaps[0];
        assert.strictEqual(swap.type, SWAP_TYPE.LOKI_TO_BNB);
        assert.strictEqual(swap.lokiAddress, clientAccount.address);
        assert.strictEqual(swap.bnbAddress, clientAccount.accountAddress);
        assert.equal(swap.amount, transaction.amount);
        assert.strictEqual(swap.txHash, transaction.hash);
      });
    });

    describe('#updateSwapsTransferTransactionHash', () => {
      it('should update transaction hash and set swap to processed', async () => {
        const uuid = '17b42f9e-97b1-11e9-bc42-526af7764f64';
        const transferTxHash = 'transfer';
        await insertSwap(uuid, SWAP_TYPE.LOKI_TO_BNB, 10, 'uuid', 'deposit');

        const { count: processedCount } = await postgres.one('select count(*) from swaps where processed = true');
        assert.equal(processedCount, 0);

        await db.updateSwapsTransferTransactionHash([uuid], transferTxHash);
        const { count: newProcessedCount } = await postgres.one('select count(*) from swaps where processed = true');
        assert.equal(newProcessedCount, 1);

        // eslint-disable-next-line camelcase
        const { transfer_transaction_hash } = await postgres.one('select transfer_transaction_hash from swaps where uuid = $1', [uuid]);
        assert.strictEqual(transfer_transaction_hash, transferTxHash);
      });
    });
  });
});
