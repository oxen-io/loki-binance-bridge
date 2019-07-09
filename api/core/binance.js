import config from 'config';
import { clients } from 'bridge-core';

const { api, network, symbol } = config.get('binance');

export default new clients.BinanceClient({
  api,
  network,
  symbol,
});
