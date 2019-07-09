/* eslint-disable no-underscore-dangle */
import http from 'http';
import request from 'request-promise';

/**
 * A client to communicate with Loki Wallet.
 */
export default class LokiClient {
  /**
   * Create a Loki client
   * @param {{ hostname, port, username, password }} rpcConfig The rpc config.
   * @param {{ filename, password, accountIndex }} [walletConfig] The wallet config.
   */
  constructor(rpcConfig, walletConfig = null) {
    this.rpc = rpcConfig;
    this.accountIndex = (walletConfig && walletConfig.accountIndex) || 0;
    this.wallet = walletConfig;
  }

  async _request(method, params = {}, callCount = 0) {
    const options = {
      uri: `http://${this.rpc.hostname}:${this.rpc.port}/json_rpc`,
      method: 'POST',
      json: {
        jsonrpc: '2.0',
        id: '0',
        method,
        params,
      },
      auth: {
        user: this.rpc.username,
        pass: this.rpc.password,
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
        if (this.wallet && method !== 'close_wallet' && response.error.message === 'No wallet file') {
          await this.openWallet();

          // Make sure we're not forever opening the wallet
          if (callCount <= 3) return this._request(method, params, callCount + 1);
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
   * @throws Will throw an error if opening a wallet failed.
   */
  async openWallet() {
    if (!this.wallet) return;

    // close any open wallet
    await this._request('close_wallet');

    const { filename, password } = this.wallet;

    const data = await this._request('open_wallet', {
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
  async createAccount() {
    const data = await this._request('create_address', { account_index: this.accountIndex });
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
  async getIncomingTransactions(addressIndex, options = {}) {
    const data = await this._request('get_transfers', {
      in: true,
      out: false,
      pending: false,
      failed: false,
      pool: options.pool || false,
      account_index: this.accountIndex,
      subaddr_indices: [addressIndex],
    });

    if (data.error) {
      console.log('[Loki Wallet] Failed to get transactions: ', data.error);
      return [];
    }

    const incoming = (data.result.in || []);
    // Set all the confirmations of the pool transactions to 0
    const pool = (data.result.pool || []).map(t => ({ ...t, confirmations: 0 }));

    return [incoming, pool].flat();
  }

  /**
   * Validate an address.
   * @param {string} address The LOKI address to validate.
   * @returns {Promise<boolean>} Wether the given `address` is valid or not.
   */
  async validateAddress(address) {
    const data = await this._request('validate_address', {
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
  async getBalances(addressIndicies) {
    const data = await this._request('getbalance', {
      account_index: this.accountIndex,
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
  async multiSend(destinations) {
    const data = await this._request('transfer_split', {
      destinations,
      account_index: this.wallet.this.accountIndex,
    });

    if (data.error || !data.result) {
      const error = (data.error && data.error.message) || 'No result found';
      throw new Error(`[Loki Wallet] Failed to send transactions - ${error}`);
    }

    return data.result.tx_hash_list;
  }
}
