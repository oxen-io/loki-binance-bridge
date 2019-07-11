import config from 'config';
import { Database, clients } from 'bridge-core';

const { host, port, database, user, password, ssl } = config.get('database');

export const postgres = new clients.PostgresClient({ host, port, database, user, password, ssl });
export const db = new Database(postgres);
