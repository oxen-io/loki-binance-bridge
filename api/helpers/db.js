import pgPromise from 'pg-promise';
import config from 'config';

const { host, port, database, user, password } = config.get('database');
const pgp = pgPromise();

export default pgp({ host, port, database, user, password });
