/* eslint-disable max-len, arrow-body-style */
import { postgres } from '../../helpers';

export const insertLokiAccount = async (uuid, address, addressIndex) => {
  return postgres.none('insert into accounts_loki(uuid, address, address_index, created) values($1, $2, $3, now())', [uuid, address, addressIndex]);
};

export const insertBNBAccount = async (uuid, address, encryptedPrivateKey = null, salt = null) => {
  return postgres.none('insert into accounts_bnb(uuid, address, encrypted_private_key, salt, created) values($1, $2, $3, $4, now())', [uuid, address, encryptedPrivateKey, salt]);
};

export const insertClientAccount = async (uuid, address, addressType, accountUuid, accountType) => {
  return postgres.none('insert into client_accounts(uuid, address, address_type, account_uuid, account_type, created) values ($1, $2, $3, $4, $5, now())', [uuid, address, addressType, accountUuid, accountType]);
};

export const insertSwap = async (uuid, type, amount, clientAccountUuid, depositTransactionHash = null, transferTransactionHash = null, processed = null) => {
  let query = 'insert into swaps(uuid, type, amount, client_account_uuid, deposit_transaction_hash, transfer_transaction_hash, created) values ($1, $2, $3, $4, $5, $6, now())';
  if (processed) {
    query = 'insert into swaps(uuid, type, amount, client_account_uuid, deposit_transaction_hash, transfer_transaction_hash, processed, created) values ($1, $2, $3, $4, $5, $6, now(), now())';
  }
  return postgres.none(query, [uuid, type, amount, clientAccountUuid, depositTransactionHash, transferTransactionHash]);
};
