import config from 'config';
import { clients } from 'bridge-core';

const { filename, password: walletPassword, accountIndex } = config.get('loki.wallet');
const { host, port, username, password: rpcPassword } = config.get('loki.walletRPC');

const rpc = {
  hostname: host,
  port,
  username,
  password: rpcPassword,
};

const wallet = {
  filename,
  password: walletPassword,
  accountIndex,
};

export default new clients.LokiClient(rpc, wallet);
