import pgPromise from 'pg-promise';
import config from 'config';
import * as bip39 from 'bip39';
import { TYPE, SWAP_TYPE } from './constants';
import { hexEncrypt } from './crypto';

const { host, port, database, user, password } = config.get('database');
const pgp = pgPromise();
const db = pgp({ host, port, database, user, password });

/**
 * Get the client account with the given uuid.
 * The return of this functions SHOULD NOT be sent to the client.
 *
 * @param {*} uuid The unique identifier of the client account
 */
export async function getClientAccountForUuid(uuid) {
  const query = 'select * from client_accounts where uuid = $1;';
  const clientAccount = await db.oneOrNone(query, [uuid]);
  if (!clientAccount) return null;

  const {
    address_type: addressType,
    address,
    account_type: accountType,
    account_uuid: accountUuid,
  } = clientAccount;
  const accountTable = accountType === TYPE.LOKI ? 'accounts_loki' : 'accounts_bnb';
  const accountQuery = 'select address from $1:name where uuid = $2;';
  const account = await db.oneOrNone(accountQuery, [accountTable, accountUuid]);
  if (!account) return null;

  const { address: accountAddress } = account;
  return {
    uuid,
    address,
    addressType,
    accountAddress,
    accountType,
  };
}

/**
 * Get the client account associated with the given address.
 * @param {string} address An address.
 * @param {'loki'|'bnb'} addressType Which platform the address belongs to.
 */
export async function getClientAccount(address, addressType) {
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

  const data = await db.oneOrNone(query, [address, addressType]);
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
}

/**
 * Insert a client account with the given address and account.
 * @param {string} address The address.
 * @param {'loki'|'bnb'} addressType Which platform the address belongs to.
 * @param {*} account The generated account.
 */
export async function insertClientAccount(address, addressType, account) {
  // We assume that if addressType is loki then accountType is bnb and viceversa
  const accountType = addressType === TYPE.LOKI ? TYPE.BNB : TYPE.LOKI;

  let dbAccount = null;
  if (accountType === TYPE.LOKI) {
    dbAccount = await insertLokiAccount(account);
  } else if (accountType === TYPE.BNB) {
    dbAccount = await insertBNBAccount(account);
  }

  // eslint-disable-next-line max-len
  const query = 'insert into client_accounts(uuid, address, address_type, account_uuid, account_type, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, now()) returning uuid;';
  const data = await db.oneOrNone(query, [address, addressType, dbAccount.uuid, accountType]);
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
}

export function insertLokiAccount(account) {
  // eslint-disable-next-line max-len
  const query = 'insert into accounts_loki(uuid, address, address_index) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2) returning *;';
  return db.one(query, [account.address, account.addressIndex]);
}

export async function insertBNBAccount(account) {
  const key = config.get('encryptionKey');
  const salt = bip39.generateMnemonic();
  const encryptedPrivateKey = hexEncrypt(account.privateKey, key + salt);

  // eslint-disable-next-line max-len
  const query = 'insert into accounts_bnb(uuid, address, encrypted_private_key, salt, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, now()) returning uuid, address;';
  return db.one(query, [account.address, encryptedPrivateKey, salt]);
}

export async function getLokiAccount(address) {
  const query = 'select * from accounts_loki where address = $1;';
  return db.oneOrNone(query, [address]);
}

export async function getSwaps(clientAccountUuid) {
  const query = 'select * from swaps where client_account_uuid = $1;';
  return db.manyOrNone(query, [clientAccountUuid]);
}

export async function insertSwaps(transactions, clientAccount) {
  const { addressType, address, accountAddress } = clientAccount;
  const lokiAddress = addressType === TYPE.LOKI ? address : accountAddress;
  const bnbAddress = addressType === TYPE.BNB ? address : accountAddress;

  const swaps = await db.tx(t => t.batch(transactions.map(tx => insertSwap(tx, clientAccount))));
  if (!swaps) return null;

  // Filter out any null swaps and map it to sanitized values
  return swaps.filter(s => !!s).map(swap => ({
    uuid: swap.uuid,
    type: swap.type,
    lokiAddress,
    bnbAddress,
    amount: swap.amount,
    txHash: swap.deposit_transaction_hash,
  }));
}

export async function insertSwap(transaction, clientAccount) {
  const { uuid: clientAccountUuid, addressType } = clientAccount;

  // Since we only have 2 currencies to swap between, we can simple check the address type.
  // If you want to extend to more than 2 currencies then you need to do this differently.
  const type = addressType === TYPE.LOKI ? SWAP_TYPE.LOKI_TO_BNB : SWAP_TYPE.BNB_TO_LOKI;

  // eslint-disable-next-line max-len
  const query = 'insert into swaps(uuid, type, amount, client_account_uuid, deposit_transaction_hash, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, now()) returning uuid, type, amount, deposit_transaction_hash;';
  return db.oneOrNone(query, [type, transaction.amount, clientAccountUuid, transaction.hash]);
}
