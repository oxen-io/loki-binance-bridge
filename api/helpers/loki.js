import http from 'http';
import config from 'config';
import request from 'request-promise';
import nodeCleanup from 'node-cleanup';

const walletConfig = config.get('loki.wallet');
const rpcConfig = config.get('loki.walletRPC');
let id = 0;

// Create a http agent.
// Without this we fail to connect to the wallet RPC
const agent = new http.Agent({ keepAlive: true, maxSockets: 1 });
nodeCleanup(() => {
  agent.destroy();
});

async function rpc(method, params = {}) {
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
    agent,
  };


  try {
    const response = await request(options);
    if (response.error) {
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

async function openWallet(filename, password = '') {
  // close any open wallet
  await rpc('close_wallet');

  const data = await rpc('open_wallet', {
    filename,
    password,
  });
  if (data.error) throw new Error(data.error.message);
}

/**
 * Create a sub-address.
 */
async function createAccount() {
  const data = await rpc('create_address', { account_index: walletConfig.accountIndex });
  if (data.error) {
    console.log('[Loki Wallet] Failed to create account: ', data.error);
    return null;
  }

  const { address, address_index: addressIndex } = data.result;
  return { address, addressIndex };
}

async function getIncomingTransactions(addressIndex) {
  const data = await rpc('get_transfers', {
    in: true,
    out: false,
    pending: false,
    failed: false,
    pool: false,
    account_index: walletConfig.accountIndex,
    subaddr_indices: [addressIndex],
  });

  if (data.error) {
    console.log('[Loki Wallet] Failed to get transactions: ', data.error);
    return [];
  }

  return data.result.in || [];
}

async function validateAddress(address) {
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

export default {
  openWallet,
  createAccount,
  getIncomingTransactions,
  validateAddress,
};
