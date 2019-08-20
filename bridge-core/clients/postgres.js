import pgPromise from 'pg-promise';

const pgp = pgPromise();

/**
 * Create a Postgres client
 * @param {{ host, port, database, user, password }} config The client config
 */
export default function PostgresClient(config) {
  return pgp(config);
}

// Hack to make the returned timestamps always UTC
pgp.pg.types.setTypeParser(1114, s => new Date(`${s}+0000`));
