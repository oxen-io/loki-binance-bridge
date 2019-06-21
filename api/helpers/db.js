import pgp from 'pg-promise';
import config from 'config';

const dbConfig = config.get('database');
export default pgp(dbConfig);
