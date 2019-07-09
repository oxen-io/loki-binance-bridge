import config from 'config';
import { clients } from 'bridge-core';

const { host, port, username, password } = config.get('loki.walletRPC');

export default new clients.LokiClient({
  hostname: host,
  port,
  username,
  password,
});
