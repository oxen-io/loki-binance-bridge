/* eslint-disable no-extend-native */
import sha256 from 'sha256';
import crypto from 'crypto';
import * as bip39 from 'bip39';
import config from 'config';
import { bnb, db, loki } from '../helpers';
import * as validator from './validators';
import { SWAP_TYPE, TYPE } from './constants';

// - Public

/**
 * Swap tokens
 * Request Data:
 *  - type: The type of swap (SWAP_TYPE).
 *  - address: An address. The type of address is determined from the `type` passed.
 *  E.g If `type = LOKI_TO_BNB` then the `address` is expected to be a loki address.
 */
export function swapToken(req, res, next) {
  decryptPayload(req, res, next, async data => {
    const result = await validator.validateSwap(data);
    if (result != null) {
      res.status(400);
      res.body = { status: 400, success: false, result };
      return next(null, req, res, next);
    }

    const { type, address } = data;

    // We assume the address type is that of the currency we are swapping to.
    // So if the swap is LOKI_TO_BNB then we want the user to give the BNB address
    // We then generate a LOKI address that they will deposit to.
    // After the deposit we pay them out to the BNB address they passed.
    const addressType = type === SWAP_TYPE.LOKI_TO_BNB ? TYPE.BNB : TYPE.LOKI;

    try {
      const account = await getClientAccount(address, addressType);
      if (account) {
        res.status(205);
        res.body = { status: 200, success: true, result: account };
        return next(null, req, res, next);
      }

      let newAccount = null;
      if (addressType === TYPE.LOKI) {
        // Create a BNB account
        newAccount = bnb.createAccountWithMnemonic();
      } else if (addressType === TYPE.BNB) {
        newAccount = await loki.createAccount();
      }

      if (!newAccount) {
        console.error('Failed to make new account for: ', addressType);
        throw new Error('Invalid swap');
      }

      const clientAccount = await insertClientAccount(address, addressType, newAccount);
      res.status(205);
      res.body = { status: 200, success: true, result: clientAccount };
    } catch (error) {
      console.log(error);
      res.status(500);
      res.body = { status: 500, success: false, result: error };
    }

    return next(null, req, res, next);
  });
}
/**
 * Check to see if transfer was done.
 * Validate that against the swaps that have recorded previously.
 * Insert all new deposits into swaps.
 * Return all new deposits.
 *
 * Request Data:
 *  - uuid: The uuid that was returned in `swapToken` (client account uuid)
 */
export function finalizeSwap(req, res, next) {
  decryptPayload(req, res, next, async data => {
    const result = validator.validateFinalizeSwap(data);
    if (result != null) {
      res.status(400);
      res.body = { status: 400, success: false, result };
      return next(null, req, res, next);
    }

    const { uuid } = data;
    try {
      const clientAccount = await getClientAccountForUuid(uuid);
      if (!clientAccount) {
        res.status(400);
        res.body = { status: 400, success: false, result: 'Unable to find swap details' };
        return next(null, req, res, next);
      }

      const { accountAddress, accountType } = clientAccount;

      const [transactions, swaps] = await Promise.all([
        getIncomingTransactions(accountAddress, accountType),
        getSwaps(uuid),
      ]);

      if (!transactions || transactions.length === 0) {
        res.status(400);
        res.body = { status: 400, success: false, result: 'Unable to find a deposit' };
        return next(null, req, res, next);
      }

      // Filter out any transactions we haven't added to our swaps db
      const newTransactions = transactions.filter(tx => !swaps.find(s => s.deposit_transaction_hash === tx.hash));
      if (newTransactions.length === 0) {
        res.status(400);
        res.body = { status: 400, success: false, result: 'Unable to find any new deposits' };
        return next(null, req, res, next);
      }

      // Give back the new swaps to the user
      const newSwaps = await insertSwaps(newTransactions, clientAccount);
      res.status(205);
      res.body = { status: 200, success: true, result: newSwaps };
    } catch (error) {
      console.log(error);
      res.status(500);
      res.body = { status: 500, success: false, result: error };
    }

    return next(null, req, res, next);
  });
}

/**
 * Create a BNB wallet.
 * This method is for creating a wallet from the frontend.
 */
export function createBNBAccount(req, res, next) {
  const account = bnb.createAccountWithMnemonic();

  res.status(205);
  res.body = { status: 205, success: true, result: account };
  return next(null, req, res, next);
}

/**
 * Download the keystore for the given BNB account
 * Request Data:
 *  - password: A password
 *  - privateKey: The BNB account private key
 */
export function downloadBNBKeystore(req, res, next) {
  decryptPayload(req, res, next, data => {
    const result = validator.validateBNBDownloadKeyStore(data);
    if (result != null) {
      res.status(400);
      res.body = { status: 400, success: false, result };
      return next(null, req, res, next);
    }

    const { password, privateKey } = data;
    const account = bnb.generateKeyStore(privateKey, password);

    const resData = JSON.stringify(account);
    res.setHeader('Content-disposition', `attachment; filename=${account.id}_keystore.json`);
    res.setHeader('Content-type', 'application/json');
    res.send(resData);
    return null;
  });
}

// - Private
function hexEncrypt(text, password) {
  const cipher = crypto.createCipher('aes-256-ctr', password);
  let crypted = cipher.update(text, 'utf8', 'hex');
  crypted += cipher.final('hex');
  return crypted;
}

function hexDecrypt(text, password) {
  const decipher = crypto.createDecipher('aes-256-ctr', password);
  let dec = decipher.update(text, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

/* Decrypt using aes-256-cbc */
function decrypt(text, seed) {
  const decipher = crypto.createDecipher('aes-256-cbc', seed);
  let dec = decipher.update(text, 'base64', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

/* Decrypt a request payload */
function decryptPayload(req, res, next, callback) {
  // Only decrypt if we use encryption
  if (!config.get('useAPIEncryption')) {
    callback(req.body);
    return null;
  }

  const { m, e, t, s, u, p } = req.body;

  if (!m || !e || !t || !s || !u || !p) {
    res.status(501);
    res.body = { status: 501, success: false, message: 'Invalid payload' };
    return next(null, req, res, next);
  }

  const mnemonic = m.hexDecode();
  const encrypted = e.hexDecode();
  const signature = s;

  const sig = { e, m, u, p, t };
  const seed = JSON.stringify(sig);
  const hashedSignature = sha256(seed);

  if (hashedSignature !== signature) {
    res.status(501);
    res.body = { status: 501, success: false, message: 'Signature mismatch' };
    return next(null, req, res, next);
  }

  const payload = decrypt(encrypted, mnemonic);

  try {
    const data = JSON.parse(payload);
    callback(data);
  } catch (error) {
    res.status(501);
    res.body = { status: 501, success: false, message: error };
    return next(null, req, res, next);
  }

  return null;
}

/**
 * Get the client account with the given uuid.
 * The return of this functions SHOULD NOT be sent to the client.
 *
 * @param {*} uuid The unique identifier of the client account
 */
async function getClientAccountForUuid(uuid) {
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
async function getClientAccount(address, addressType) {
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
async function insertClientAccount(address, addressType, account) {
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

function insertLokiAccount(account) {
  // eslint-disable-next-line max-len
  const query = 'insert into accounts_loki(uuid, address, address_index) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2) returning *;';
  return db.one(query, [account.address, account.addressIndex]);
}

async function insertBNBAccount(account) {
  const key = config.get('encryptionKey');
  const salt = bip39.generateMnemonic();
  const encryptedPrivateKey = hexEncrypt(account.privateKey, key + salt);

  // eslint-disable-next-line max-len
  const query = 'insert into accounts_bnb(uuid, address, encrypted_private_key, salt, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, now()) returning uuid, address;';
  return db.one(query, [account.address, encryptedPrivateKey, salt]);
}

async function getLokiAccount(address) {
  const query = 'select * from accounts_loki where address = $1;';
  return db.oneOrNone(query, [address]);
}

/**
 * Get incoming transactions to the given address.
 * @param {string} accountAddress The account address.
 * @param {'loki'|'bnb'} accountType The account type
 */
async function getIncomingTransactions(accountAddress, accountType) {
  switch (accountType) {
    case TYPE.BNB: {
      const transactions = await bnb.getIncomingTransactions(accountAddress);
      return transactions.map(tx => ({
        hash: tx.txHash,
        amount: tx.value,
      }));
    }
    case TYPE.LOKI: {
      const lokiAccount = await getLokiAccount(accountAddress);
      if (!lokiAccount) return [];

      const transactions = await loki.getIncomingTransactions(lokiAccount.address_index);

      // We only want transactions with a certain number of confirmations
      return transactions.filter(tx => tx.confirmations >= 6).map(tx => ({
        hash: tx.txid,
        amount: tx.amount,
      }));
    }
    default:
      return [];
  }
}

async function getSwaps(clientAccountUuid) {
  const query = 'select * from swaps where client_account_uuid = $1;';
  return db.manyOrNone(query, [clientAccountUuid]);
}

async function insertSwaps(transactions, clientAccount) {
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

async function insertSwap(transaction, clientAccount) {
  const { uuid: clientAccountUuid, addressType } = clientAccount;

  // Since we only have 2 currencies to swap between, we can simple check the address type.
  // If you want to extend to more than 2 currencies then you need to do this differently.
  const type = addressType === TYPE.LOKI ? SWAP_TYPE.LOKI_TO_BNB : SWAP_TYPE.BNB_TO_LOKI;

  // eslint-disable-next-line max-len
  const query = 'insert into swaps(uuid, type, amount, client_account_uuid, deposit_transaction_hash, created) values (md5(random()::text || clock_timestamp()::text)::uuid, $1, $2, $3, $4, now()) returning uuid, type, amount, deposit_transaction_hash;';
  return db.oneOrNone(query, [type, transaction.amount, clientAccountUuid, transaction.hash]);
}

String.prototype.hexEncode = () => {
  let hex;
  let result = '';
  for (let i = 0; i < this.length; i += 1) {
    hex = this.charCodeAt(i).toString(16);
    result += (`000${hex}`).slice(-4);
  }
  return result;
};

String.prototype.hexDecode = () => {
  const hexes = this.match(/.{1,4}/g) || [];
  let back = '';
  for (let j = 0; j < hexes.length; j += 1) {
    back += String.fromCharCode(parseInt(hexes[j], 16));
  }
  return back;
};
