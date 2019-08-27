import { TYPE, SWAP_TYPE } from './constants';

export default class Database {
  /**
   * Create a Database instance
   * @param {*} postgres The postgres client
   */
  constructor(postgres) {
    this.postgres = postgres;
  }

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
    const clientAccount = await this.postgres.oneOrNone(query, [uuid]);
    if (!clientAccount) return null;

    const {
      address_type: addressType,
      address,
      account_type: accountType,
      account_uuid: accountUuid,
    } = clientAccount;

    const base = {
      uuid,
      address,
      addressType,
      accountType,
    };

    if (accountType === TYPE.LOKI) {
      const accountQuery = 'select address, address_index from accounts_loki where uuid = $1;';
      const account = await this.postgres.oneOrNone(accountQuery, [accountUuid]);
      if (!account) return null;

      return {
        ...base,
        account: {
          address: account.address,
          addressIndex: account.address_index,
        },
      };
    }

    // BNB Accounts
    const accountQuery = 'select memo from accounts_bnb where uuid = $1;';
    const account = await this.postgres.oneOrNone(accountQuery, [accountUuid]);
    if (!account) return null;

    return {
      ...base,
      account,
    };
  }

  /**
  * Get all client accounts with the given `accountType`
  *
  * @param {'loki'|'bnb'} accountType The account type.
  * @returns {Promise<[{ uuid, address, addressType, accountType, account }]>} An array of client accounts.
  */
  async getClientAccounts(accountType) {
    // eslint-disable-next-line max-len
    const uuids = await this.postgres.manyOrNone('select uuid from client_accounts where account_type = $1', [accountType]);
    if (!uuids) return [];

    // Get all client accounts and filter out null
    const accounts = await this.postgres.task(t => t.batch(uuids.map(({ uuid }) => this.getClientAccountForUuid(uuid))));
    return accounts.filter(a => !!a);
  }

  /**
  * Get the client account associated with the given `address`.
  *
  * @param {string} address An address.
  * @param {'loki'|'bnb'} addressType Which platform the address belongs to.
  * @return The client account or `null` if we failed to get the client account.
  */
  async getClientAccount(address, addressType) {
    const clientQuery = 'select uuid from client_accounts where address = $1 and address_type = $2;';
    const clientAccount = await this.postgres.oneOrNone(clientQuery, [address, addressType]);
    if (!clientAccount) return null;

    return this.getClientAccountForUuid(clientAccount.uuid);
  }

  /**
   * Get all client accounts which have the given memos
   * @param {[string]} memos An array of memos
   * @returns {Promise<{ uuid, address, addressType, accountType, account: { memo }}>} An array of client accounts.
   */
  async getClientAccountsWithMemos(memos) {
    const query = 'select ca.* , a.memo from client_accounts ca left join accounts_bnb a on ca.account_uuid = a.uuid where a.memo in ($1:csv);';
    const clientAccounts = await this.postgres.manyOrNone(query, [memos]);

    return clientAccounts.map(({ uuid, address, address_type: addressType, account_type: accountType, memo }) => ({
      uuid,
      address,
      addressType,
      accountType,
      account: { memo },
    }));
  }

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
      dbAccount = await this.insertLokiAccount(account);
    } else if (accountType === TYPE.BNB) {
      dbAccount = await this.insertBNBAccount(account);
    }

    if (!dbAccount) return null;

    // eslint-disable-next-line max-len
    const query = 'insert into client_accounts(uuid, address, address_type, account_uuid, account_type, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, now()) returning uuid;';
    const clientAccount = await this.postgres.oneOrNone(query, [address, addressType, dbAccount.uuid, accountType]);
    if (!clientAccount) return null;

    return this.getClientAccountForUuid(clientAccount.uuid);
  }

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
    return this.postgres.oneOrNone(query, [account.address, account.address_index]);
  }

  /**
  * Insert a bnb account.
  *
  * @param {{ memo: string }} account A bnb account.
  * @returns {Promise<{ uuid, memo }>} The inserted bnb account or `null` if we failed.
  */
  async insertBNBAccount(account) {
    if (!account || !account.memo) return null;

    // eslint-disable-next-line max-len
    const query = 'insert into accounts_bnb(uuid, memo, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, now()) returning uuid, memo;';
    return this.postgres.oneOrNone(query, [account.memo]);
  }

  /**
  * Get the loki account associated with the given loki `address`
  *
  * @param {string} address The loki address.
  * @returns {Promise<{ uuid, address, address_index }>} The loki account or `null` if there wasn't one.
  */
  async getLokiAccount(address) {
    const query = 'select * from accounts_loki where address = $1;';
    return this.postgres.oneOrNone(query, [address]);
  }

  /**
  * Get the account indicies associated with the given `addresses`.
  *
  * @param {[string]} addresses An array of loki sub-addresses.
  * @returns {Promise<[number]>} An array of address indicies.
  */
  async getLokiAddressIndicies(addresses) {
    const query = 'select address_index from accounts_loki where address in ($1:csv);';
    return this.postgres.manyOrNone(query, [addresses]);
  }

  /**
  * Get all `swaps` for the given `clientAccount`.
  *
  * @param {string} clientAccountUuid The uuid of the client account.
  * @returns {Promise<[object]>} An array of swaps or `null` if something went wrong.
  */
  async getSwapsForClientAccount(clientAccountUuid) {
    const query = 'select * from swaps where client_account_uuid = $1 order by created desc;';
    return this.postgres.manyOrNone(query, [clientAccountUuid]);
  }

  /**
  * Get all pending `swaps` of the given `swapType`.
  * A pending swap is when the `deposit tx hash` is set but `transfer tx hash` is not set and `processed` is not set.
  *
  * @param {string} swapType The swap type.
  * @returns {Promise<[object]>} An array of swaps or `null` if something went wrong.
  */
  async getPendingSwaps(swapType) {
    // eslint-disable-next-line max-len
    const query = 'select s.*, ca.address_type, ca.address, ca.account_type, ca.account_uuid from swaps s left join client_accounts ca on ca.uuid = s.client_account_uuid where type = $1 and deposit_transaction_hash is not null and transfer_transaction_hash is null and processed is null;';
    return this.postgres.manyOrNone(query, [swapType]);
  }

  /**
   * Get all the `deposit_transaction_hash` of the swaps in the database of the given type
   * @param {string} swapType The swap type.
   * @returns {Promise<string>} An array of deposit hashes.
   */
  async getAllSwapDepositHashes(swapType) {
    const swaps = await this.postgres.manyOrNone('select deposit_transaction_hash from swaps where type = $1', [swapType]);
    return swaps.map(s => s.deposit_transaction_hash);
  }

  /**
   * Get all swaps of the given type.
   * @param {string} swapType The swap type
   */
  async getAllSwaps(swapType) {
    const query = 'select * from swaps where type = $1';
    return this.postgres.manyOrNone(query, [swapType]);
  }

  /**
  * Insert swaps with the given `transactions`.
  *
  * @export
  * @param {[{ hash: string, amount: number }]} transactions An array of transactions.
  * @param {{ uuid: string, addressType: string }} clientAccount The client account to associate with the swap.
  * @returns {Promise<[{ uuid, type, amount, txHash }]>} An array of inserted swaps.
  */
  async insertSwaps(transactions, clientAccount) {
    if (!clientAccount || !transactions || transactions.length === 0) return [];

    const swaps = await this.postgres.tx(t => t.batch(transactions.map(tx => this.insertSwap(tx, clientAccount))));
    if (!swaps) return [];

    // Filter out any null swaps
    return swaps.filter(s => !!s);
  }

  /**
  * Insert a swap from the given `transaction`.
  *
  * @param {{ hash: string, amount: number, timestamp: number }} transaction The transaction.
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
    const type = addressType === TYPE.LOKI ? SWAP_TYPE.BLOKI_TO_LOKI : SWAP_TYPE.LOKI_TO_BLOKI;

    // eslint-disable-next-line max-len
    const query = 'insert into swaps(uuid, type, amount, client_account_uuid, deposit_transaction_hash, deposit_transaction_created, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, to_timestamp($5), now()) returning uuid, type, amount, deposit_transaction_hash;';
    // Postgres stores timestamps in seconds, so we have to make sure the transaction timestamps are also in seconds
    return this.postgres.oneOrNone(query, [type, transaction.amount, clientAccountUuid, transaction.hash, transaction.timestamp]);
  }

  /**
  * Update the given swaps with the given `transactionHash`
  *
  * @param {[string]} swapUuids An array of swap uuids to update.
  * @param {string} transactionHash The transaction hash to set on the swaps.
  */
  async updateSwapsTransferTransactionHash(swapUuids, transactionHash) {
    const query = 'update swaps set transfer_transaction_hash = $1, processed = now() where uuid in ($2:csv)';
    return this.postgres.none(query, [transactionHash, swapUuids]);
  }
}
