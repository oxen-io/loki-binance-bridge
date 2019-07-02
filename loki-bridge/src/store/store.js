import axios from 'axios';
import FileSaver from 'file-saver';
import { EventEmitter } from 'events';
import { encrypt } from '@utils/crypto';
import config from '@config';
import * as Actions from './actions';
import * as Events from './events';
import dispatcher from './dispatcher';

const { apiUrl, useAPIEncryption } = config;

const httpClient = axios.create({ baseURL: apiUrl });
const endpoints = {
  getWithdrawalFees: '/api/v1/getWithdrawalFees',
  getSwaps: '/api/v1/getSwaps',
  swap: '/api/v1/swap',
  finalizeSwap: '/api/v1/finalizeSwap',
  createBNBAccount: '/api/v1/createBNBAccount',
  downloadBNBKeystore: '/api/v1/downloadBNBKeystore',
};

class Store extends EventEmitter {
  constructor() {
    super();
    this.store = {};

    dispatcher.register(async payload => {
      switch(payload.type) {
        case Actions.GET_WITHDRAWAL_FEES:
          this.getWithdrawalFees();
          break;
        case Actions.GET_SWAPS:
          this.getSwaps(payload);
          break;
        case Actions.SWAP_TOKEN:
          this.swapToken(payload);
          break;
        case Actions.FINALIZE_SWAP_TOKEN:
          this.finalizeSwap(payload);
          break;
        case Actions.CREATE_BNB_ACCOUNT:
          this.createBNBAccount();
          break;
        case Actions.DOWNLOAD_BNB_KEYSTORE:
          this.downloadBNBKeystore(payload);
          break;
        default: break;
      }
    });
  }

  getStore(key) {
    return this.store[key];
  };

  async getWithdrawalFees() {
    try {
      const data = await this.fetch(endpoints.getWithdrawalFees, 'GET');
      this.store.fees = data.result;
      this.emit(Events.FETCHED_WITHDRAWAL_FEES, data.result);
    } catch (e) {
      this.emit(Events.ERROR, e);
    }
  }

  async getSwaps(payload) {
    try {
      const data = await this.fetch(endpoints.getSwaps, 'GET', payload.content);
      this.emit(Events.FETCHED_SWAPS, data.result);
    } catch (e) {
      this.emit(Events.ERROR, e);
    }
  }

  async swapToken(payload) {
    try {
      const data = await this.fetch(endpoints.swap, 'POST', payload.content);
      this.emit(Events.TOKEN_SWAPPED, data.result);
    } catch (e) {
      this.emit(Events.ERROR, e);
    }
  }

  async finalizeSwap(payload) {
    try {
      const data = await this.fetch(endpoints.finalizeSwap, 'POST', payload.content);
      this.emit(Events.TOKEN_SWAP_FINALIZED, data.result);
    } catch (e) {
      this.emit(Events.ERROR, e);
    }
  }

  async createBNBAccount() {
    try {
      const data = await this.fetch(endpoints.createBNBAccount, 'POST', {});
      this.emit(Events.BNB_ACCOUNT_CREATED, data.result);
    } catch (e) {
      this.emit(Events.ERROR, e);
    }
  }

  async downloadBNBKeystore(payload) {
    try {
      const data = await this.fetch(endpoints.downloadBNBKeystore, 'POST', payload.content);
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json;charset=utf-8' });
      FileSaver.saveAs(blob, `${data.id}_keystore.json`);
      this.emit(Events.BNB_KEYSTORE_DOWNLOADED, data);
    } catch (e) {
      this.emit(Events.ERROR, e);
    }
  }

  async fetch(url, method, params = null) {
    // Encrypt the params if necessary
    let encrypted = params;
    if (useAPIEncryption && method.toLowerCase() === 'post') {
      encrypted = encrypt(params, url);
    }

    const field = method.toLowerCase() === 'post' ? 'data' : 'params';
    try {
      const { data } = await httpClient({
        method,
        url,
        [field]: encrypted
      });
      return data;
    } catch (e) {
      console.log(`Failed fetch ${url}: `, e);

      // If we got an error from the api then throw it
      if (e.response && e.response.data) {
        throw new Error(e.response.data.result);
      }

      // Some other error occurred
      throw e;
    }
  }
}

export default new Store();
