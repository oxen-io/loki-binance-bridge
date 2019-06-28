import config from 'config';
import axios from 'axios';
import FileSaver from 'file-saver';
import { EventEmitter } from 'events';
import * as Actions from './actions';
import dispatcher from './dispatcher';

const apiUrl = config.get('apiUrl');
const httpClient = axios.create({ baseURL: apiUrl });
const endpoints = {
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
        case Actions.SWAP_TOKEN:
          this.swapToken(payload);
          break;
        case Actions.FINALIZE_SWAP_TOKEN:
          this.finalizeSwap(payload);
          break;
        case Actions.CREATE_BNB_ACCOUNT:
          this.createBNBAccount(payload);
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

  async swapToken(payload) {
    try {
      const data = await this.fetch(endpoints.swap, 'POST', payload.content);
      this.emit(Actions.TOKEN_SWAPPED, data.result);
    } catch (e) {
      this.emit(Actions.ERROR, e);
    }
  }

  async finalizeSwap(payload) {
    try {
      const data = await this.fetch(endpoints.finalizeSwap, 'POST', payload.content);
      this.emit(Actions.TOKEN_SWAP_FINALIZED, data.result);
    } catch (e) {
      this.emit(Actions.ERROR, e);
    }
  }

  async createBNBAccount(payload) {
    try {
      const data = await this.fetch(endpoints.createBNBAccount, 'POST', payload.content);
      this.emit(Actions.BNB_ACCOUNT_CREATED, data.result);
    } catch (e) {
      this.emit(Actions.ERROR, e);
    }
  }

  async downloadBNBKeystore(payload) {
    try {
      const blob = await this.fetch(endpoints.downloadBNBKeystore, 'POST', payload.content, 'blob');

      // Save the blob to file
      const keystore = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onerror = function () {
          fr.abort();
          reject(new Error('Failed to read keystore data from server'));
        };

        fr.onload = function () {
          const response = JSON.parse(this.result);
          FileSaver.saveAs(blob, `${response.id}_keystore.json`);
          resolve(response);
        };

        fr.readAsText(blob);
      });

      this.emit(Actions.BNB_KEYSTORE_DOWNLOADED, keystore);
    } catch (e) {
      this.emit(Actions.ERROR, e);
    }
  }

  async fetch(url, method, params = null, responseType = 'json') {
    // TODO: Encrypt params on POST
    try {
      const { data } = await httpClient({
        method,
        url,
        data: params,
        responseType
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
