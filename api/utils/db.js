import config from 'config';
import * as bip39 from 'bip39';
import { TYPE, SWAP_TYPE } from './constants';
import { hexEncrypt, hexDecrypt } from './crypto';
import { postgres } from '../helpers';

// We have all db functions in a const so that when testing we can stub out certain functions.
const db = {
  /**
   * Get the client account with the given uuid.
   * This function is different from `getClientAccount` in that it will return non sanitized values.
   * The return of this functions SHOULD NOT be sent to the client.
   *
   * @param {string} uuid The unique identifier of the client account
   * @returns The client account or `null` if something went wrong.
   */
  async getClientAccountForUuid(uuid) {
    const query = 'select * from client_accounts where uuid = $1;';
    const clientAccount = await postgres.oneOrNone(query, [uuid]);
    if (!clientAccount) return null;

    const {
      address_type: addressType,
      address,
      account_type: accountType,
      account_uuid: accountUuid,
    } = clientAccount;
    const accountTable = accountType === TYPE.LOKI ? 'accounts_loki' : 'accounts_bnb';
    const accountQuery = 'select address from $1:name where uuid = $2;';
    const account = await postgres.oneOrNone(accountQuery, [accountTable, accountUuid]);
    if (!account) return null;

    const { address: accountAddress } = account;
    return {
      uuid,
      address,
      addressType,
      accountAddress,
      accountType,
    };
  },

  /**
   * Get all client accounts with the given `accountType`
   *
   * @param {'loki'|'bnb'} accountType The account type.
   * @returns {Promise<[{ uuid, address, addressType, accountAddress, accountType }]>} An array of client accounts.
   */
  async getClientAccounts(accountType) {
    const accountTable = accountType === TYPE.LOKI ? 'accounts_loki' : 'accounts_bnb';
    const leftJoin = `${accountTable} a on a.uuid = ca.account_uuid`;

    // eslint-disable-next-line max-len
    const query = `select ca.uuid, ca.address, ca.address_type, ca.account_type, a.address as account_address from client_accounts ca left join ${leftJoin} where account_type = $1`;
    const accounts = await postgres.manyOrNone(query, [accountType]);
    if (!accounts) return [];

    return accounts.map(a => ({
      uuid: a.uuid,
      address: a.address,
      addressType: a.address_type,
      accountAddress: a.account_address,
      accountType: a.account_type,
    }));
  },

  /**
   * Get the client account associated with the given `address`.
   *
   * @param {string} address An address.
   * @param {'loki'|'bnb'} addressType Which platform the address belongs to.
   * @return The client account or `null` if we failed to get the client account.
   */
  async getClientAccount(address, addressType) {
    /*
    Account type is type of account linked to the address
    In our case:
      If we have a `loki` address then the account type is `bnb`
      If we have a `bnb` address then the account type is `loki`
    */
    const accountType = addressType === TYPE.LOKI ? TYPE.BNB : TYPE.LOKI;
    const accountTable = accountType === TYPE.LOKI ? 'accounts_loki' : 'accounts_bnb';

    const leftJoin = `${accountTable} a on a.uuid = ca.account_uuid`;

    // eslint-disable-next-line max-len
    const query = `select ca.uuid, a.address as account_address from client_accounts ca left join ${leftJoin} where ca.address = $1 and ca.address_type = $2;`;

    const data = await postgres.oneOrNone(query, [address, addressType]);
    if (!data) return null;

    // eslint-disable-next-line no-shadow
    const { uuid, account_address: accountAddress } = data;
    const lokiAddress = addressType === TYPE.LOKI ? address : accountAddress;
    const bnbAddress = addressType === TYPE.BNB ? address : accountAddress;
    return {
      uuid,
      userAddressType: addressType,
      lokiAddress,
      bnbAddress,
    };
  },

  /**
   * Insert a client account with the given address and account.
   *
   * @param {string} address The address.
   * @param {'loki'|'bnb'} addressType Which platform the address belongs to.
   * @param {*} account The account to insert.
   * @returns The inserted client account or `null` if we failed.
   */
  async insertClientAccount(address, addressType, account) {
    // We assume that if addressType is loki then accountType is bnb and viceversa
    const accountType = addressType === TYPE.LOKI ? TYPE.BNB : TYPE.LOKI;

    let dbAccount = null;
    if (accountType === TYPE.LOKI) {
      dbAccount = await db.insertLokiAccount(account);
    } else if (accountType === TYPE.BNB) {
      dbAccount = await db.insertBNBAccount(account);
    }

    if (!dbAccount) return null;

    // eslint-disable-next-line max-len
    const query = 'insert into client_accounts(uuid, address, address_type, account_uuid, account_type, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, now()) returning uuid;';
    const data = await postgres.oneOrNone(query, [address, addressType, dbAccount.uuid, accountType]);
    if (!data) return null;

    const { uuid } = data;
    const lokiAddress = addressType === TYPE.LOKI ? address : dbAccount.address;
    const bnbAddress = addressType === TYPE.BNB ? address : dbAccount.address;
    return {
      uuid,
      userAddressType: addressType,
      lokiAddress,
      bnbAddress,
    };
  },

  /**
   * Insert a loki account.
   *
   * @param {{ address: string, address_index: int }} account A loki account.
   * @returns {Promise<{ uuid, address, address_index }>} The inserted loki account or `null` if we failed.
   */
  async insertLokiAccount(account) {
    if (!account) return null;

    // eslint-disable-next-line max-len
    const query = 'insert into accounts_loki(uuid, address, address_index, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, now()) returning uuid, address, address_index;';
    return postgres.oneOrNone(query, [account.address, account.address_index]);
  },

  /**
   * Insert a bnb account.
   *
   * @param {{ address: string, privateKey: string }} account A bnb account.
   * @returns {Promise<{ uuid, address }>} The inserted bnb account or `null` if we failed.
   */
  async insertBNBAccount(account) {
    if (!account) return null;

    const key = config.get('encryptionKey');
    const salt = bip39.generateMnemonic();
    const encryptedPrivateKey = hexEncrypt(account.privateKey, key + salt);

    // eslint-disable-next-line max-len
    const query = 'insert into accounts_bnb(uuid, address, encrypted_private_key, salt, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, now()) returning uuid, address;';
    return postgres.oneOrNone(query, [account.address, encryptedPrivateKey, salt]);
  },

  /**
   * Get the loki account associated with the given loki `address`
   *
   * @param {string} address The loki address.
   * @returns {Promise<{ uuid, address, address_index }>} The loki account or `null` if there wasn't one.
   */
  async getLokiAccount(address) {
    const query = 'select * from accounts_loki where address = $1;';
    return postgres.oneOrNone(query, [address]);
  },

  /**
   * Get the bnb account associated with the given bnb `address`
   *
   * @param {string} address The bnb address.
   * @returns {Promise<{ uuid, privateKey, address }>} The bnb account or `null` if there wasn't one.
   */
  async getBNBAccount(address) {
    const query = 'select * from accounts_bnb where address = $1;';
    const account = await postgres.oneOrNone(query, [address]);
    if (!account) return null;

    const { uuid, encrypted_private_key: encrypted, salt } = account;
    const key = config.get('encryptionKey');
    const privateKey = hexDecrypt(encrypted, key + salt);
    return {
      uuid,
      privateKey,
      address,
    };
  },

  /**
   * Get the account indicies associated with the given `addresses`.
   *
   * @param {[string]} addresses An array of loki sub-addresses.
   * @returns {Promise<[number]>} An array of address indicies.
   */
  async getLokiAddressIndicies(addresses) {
    const query = 'select address_index from accounts_loki where address in ($1:csv);';
    return postgres.manyOrNone(query, [addresses]);
  },

  /**
   * Get all `swaps` for the given `clientAccount`.
   *
   * @param {string} clientAccountUuid The uuid of the client account.
   * @returns {Promise<[object]>} An array of swaps or `null` if something went wrong.
   */
  async getSwapsForClientAccount(clientAccountUuid) {
    const query = 'select * from swaps where client_account_uuid = $1;';
    return postgres.manyOrNone(query, [clientAccountUuid]);
  },

  /**
   * Get all pending `swaps` of the given `swapType`.
   * A pending swap is when the `deposit tx hash` is set but `transfer tx hash` is not set and `processed` is not true.
   *
   * @param {string} swapType The swap type.
   * @returns {Promise<[object]>} An array of swaps or `null` if something went wrong.
   */
  async getPendingSwaps(swapType) {
    // eslint-disable-next-line max-len
    const query = 'select s.*, ca.address_type, ca.address, ca.account_type, ca.account_uuid from swaps s left join client_accounts ca on ca.uuid = s.client_account_uuid where type = $1 and deposit_transaction_hash is not null and transfer_transaction_hash is null and processed is null;';
    return postgres.manyOrNone(query, [swapType]);
  },

  /**
   * Insert swaps with the given `transactions`.
   *
   * @export
   * @param {[{ hash: string, amount: number }]} transactions An array of transactions.
   * @param {{ uuid: string, addressType: string, address: string, accountAddress: string }} clientAccount The client account to associate with the swap.
   * @returns {Promise<[{ uuid, type, lokiAddress, bnbAddress, amount, txHash }]>} An array of inserted swaps.
   */
  async insertSwaps(transactions, clientAccount) {
    if (!clientAccount || !transactions || transactions.length === 0) return [];

    const { addressType, address, accountAddress } = clientAccount;
    const lokiAddress = addressType === TYPE.LOKI ? address : accountAddress;
    const bnbAddress = addressType === TYPE.BNB ? address : accountAddress;

    const swaps = await postgres.tx(t => t.batch(transactions.map(tx => db.insertSwap(tx, clientAccount))));
    if (!swaps) return [];

    // Filter out any null swaps and map it to sanitized values
    return swaps.filter(s => !!s).map(swap => ({
      uuid: swap.uuid,
      type: swap.type,
      lokiAddress,
      bnbAddress,
      amount: swap.amount,
      txHash: swap.deposit_transaction_hash,
    }));
  },

  /**
   * Insert a swap from the given `transaction`.
   *
   * @param {{ hash: string, amount: number }} transaction The transaction.
   * @param {{ uuid: string, addressType: string }} clientAccount The client account to associate with the swap
   * @returns {Promise<{ uuid, type, amount, deposit_transaction_hash }>} The inserted swap or `null` if we failed.
   */
  async insertSwap(transaction, clientAccount) {
    if (!transaction || !clientAccount) return null;

    const { uuid: clientAccountUuid, addressType } = clientAccount;

    // Since we only have 2 currencies to swap between, we can simple check the address type.
    // If you want to extend to more than 2 currencies then you need to do this differently.

    // eslint-disable-next-line max-len
    // If the client address is LOKI then it must mean that we generated a BNB address for them to deposit into and thus they want to swap BNB for LOKI.
    // Same logic applies the other way
    const type = addressType === TYPE.LOKI ? SWAP_TYPE.BNB_TO_LOKI : SWAP_TYPE.LOKI_TO_BNB;

    // eslint-disable-next-line max-len
    const query = 'insert into swaps(uuid, type, amount, client_account_uuid, deposit_transaction_hash, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, now()) returning uuid, type, amount, deposit_transaction_hash;';
    return postgres.oneOrNone(query, [type, transaction.amount, clientAccountUuid, transaction.hash]);
  },

  /**
   * Update the given swaps with the given `transactionHash`
   *
   * @param {[string]} swapUuids An array of swap uuids to update.
   * @param {string} transactionHash The transaction hash to set on the swaps.
   */
  async updateSwapsTransferTransactionHash(swapUuids, transactionHash) {
    const query = 'update swaps set transfer_transaction_hash = $1, processed = true where uuid in ($2:csv)';
    return postgres.none(query, [transactionHash, swapUuids]);
  },
};

export default db;
