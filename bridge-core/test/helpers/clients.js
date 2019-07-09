import { PostgresClient, LokiClient, BinanceClient } from '../../clients';

export const loki = new LokiClient({
  hostname: 'localhost',
  port: 18083,
  username: '',
  password: '',
},
{
  filename: 'lokibridge',
  password: '',
});

export const bnb = new BinanceClient({
  api: 'https://testnet-dex.binance.org',
  network: 'testnet',
  symbol: 'TEST',
});

export const postgres = PostgresClient({
  host: 'localhost',
  port: 5432,
  database: 'lokibridge-test',
  user: 'postgres',
  password: '',
});
