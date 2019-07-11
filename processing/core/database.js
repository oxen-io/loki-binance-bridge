import config from 'config';
import { Database, clients } from 'bridge-core';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';

const { host, port, database, user, password, ssl } = config.get('database');

export const postgres = new clients.PostgresClient({ host, port, database, user, password, ssl });
export const db = new Database(postgres);

const adapter = new FileSync(`localdb-${process.env.NODE_ENV}.json`);
export const localDB = low(adapter);
