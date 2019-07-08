import http from 'http';
import config from 'config';
import request from 'request-promise';
import nodeCleanup from 'node-cleanup';

const walletConfig = config.get('loki.wallet');
const { accountIndex } = walletConfig;
const rpcConfig = config.get('loki.walletRPC');
let id = 0;

// Do the rpc!
async function rpc(method, params = {}, callCount = 0) {
  id += 1;
  const options = {
    uri: `http://${rpcConfig.host}:${rpcConfig.port}/json_rpc`,
    method: 'POST',
    json: {
      jsonrpc: '2.0',
      id,
      method,
      params,
    },
    auth: {
      user: rpcConfig.username,
      pass: rpcConfig.password,
      sendImmediately: false,
    },
    agent: new http.Agent({
      keepAlive: true,
      maxSockets: 1,
    }),
  };


  try {
    const response = await request(options);
    if (response.error) {
      // If wallet is not opened, then open it and call the rpc
      if (method !== 'close_wallet' && response.error.message === 'No wallet file') {
        await openWallet(walletConfig.filename, walletConfig.password);

        // Make sure we're not forever opening the wallet
        if (callCount <= 3) return rpc(method, params, callCount + 1);
      }

      return {
        method,
        params,
        error: response.error,
      };
    }

    return {
      method,
      params,
      result: response.result,
    };
  } catch (error) {
    return {
      method,
      params,
      error: {
        code: error.statusCode || -1,
        message: error.message,
        cause: error.cause,
      },
    };
  }
}

/**
 * Open a wallet.
 * This will close any opened wallets.
 *
 * @param {string} filename The wallet filename.
 * @param {string} password The wallet password if it is set.
 * @throws Will throw an error if opening a wallet failed.
 */
export async function openWallet(filename, password = '') {
  // close any open wallet
  await rpc('close_wallet');

  const data = await rpc('open_wallet', {
    filename,
    password,
  });
  if (data.error) throw new Error(data.error.message);
}

/**
 * Create a new sub-address from the current open wallet.
 *
 * @returns {Promise<{ address: string, address_index: number }>} A new loki account or `null` if we failed to make one.
 */
export async function createAccount() {
  const data = await rpc('create_address', { account_index: accountIndex });
  if (data.error) {
    console.log('[Loki Wallet] Failed to create account: ', data.error);
    return null;
  }

  // eslint-disable-next-line camelcase
  const { address, address_index } = data.result;
  return { address, address_index };
}

/**
 * Get all incoming transactions sent to the given `addressIndex`.
 *
 * @param {number} addressIndex The index of the sub-address.
 * @returns {Promise<[object]>} An array of LOKI transactions.
 */
export async function getIncomingTransactions(addressIndex, options = {}) {
  const data = await rpc('get_transfers', {
    in: true,
    out: false,
    pending: false,
    failed: false,
    pool: options.pool || false,
    account_index: accountIndex,
    subaddr_indices: [addressIndex],
  });

  if (data.error) {
    console.log('[Loki Wallet] Failed to get transactions: ', data.error);
    return [];
  }

  return data.result.in || [];
}

/**
 * Validate an address.
 * @param {string} address The LOKI address to validate.
 * @returns {Promise<boolean>} Wether the given `address` is valid or not.
 */
export async function validateAddress(address) {
  const data = await rpc('validate_address', {
    address,
    any_net_type: false,
  });

  if (data.error) {
    console.log('[Loki Wallet] Failed to validate address: ', data.error);
    return false;
  }

  return data.result.valid;
}

/**
 * Get balances for the given `addressIndicies`.
 *
 * @param {[number]} addressIndicies An array of subaddress indicies.
 * @returns {Promise<[{ addressIndex, address, balance, unlocked }]>} An array of balances
 */
export async function getBalances(addressIndicies) {
  const data = await rpc('getbalance', {
    account_index: accountIndex,
    address_indices: addressIndicies,
  });

  if (data.error) {
    console.log('[Loki Wallet] Failed to get balances: ', data.error);
    return [];
  }

  // eslint-disable-next-line camelcase
  return data.result.per_subaddress.map(({ address_index, address, balance, unlocked_balance }) => ({
    addressIndex: address_index,
    address,
    balance,
    unlocked: unlocked_balance,
  }));
}

/**
 * Send multiple transactions from the current open wallet.
 *
 * @param {[{ address: string, amount: number }]}]} destinations The destinations.
 * @returns {Promise<[string]>} The transaction hashes
 */
export async function multiSend(destinations) {
  const data = await rpc('transfer_split', {
    destinations,
    account_index: accountIndex,
  });

  if (data.error || !data.result) {
    const error = (data.error && data.error.message) || 'No result found';
    throw new Error(`[Loki Wallet] Failed to send transactions - ${error}`);
  }

  return data.result.tx_hash_list;
}
