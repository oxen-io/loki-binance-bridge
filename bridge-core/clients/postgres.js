import pgPromise from 'pg-promise';
const pgp = pgPromise();

/**
 * Create a Postgres client
 * @param {{ host, port, database, user, password }} config The client config
 */
export default function PostgresClient(config) {
  return pgp(config);
}
