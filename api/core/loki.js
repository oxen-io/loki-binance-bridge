import config from 'config';
import { clients } from 'bridge-core';

const { filename, password: walletPassword, accountIndex } = config.get('loki.wallet');
const { host, port, username, password: rpcPassword } = config.get('loki.walletRPC');

export default new clients.LokiClient({
  rpc: {
    hostname: host,
    port,
    username,
    password: rpcPassword,
  },
  wallet: {
    filename,
    password: walletPassword,
    accountIndex,
  },
});
