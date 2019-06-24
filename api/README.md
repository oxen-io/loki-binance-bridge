# Loki Bridge API

This is the api server used for the loki bridge application.

## Pre-requisites
  - Node 11.15.0
    - This can be installed using [nvm](https://github.com/nvm-sh/nvm)
  - [Loki wallet rpc](https://github.com/loki-project/loki/releases)

## Installation

If you're using `nvm` then run:
```
nvm use
```

Install all the dependencies:
```
npm install --production
```

If you haven't setup a postgres database then do so and edit `config/production.json` with the database info.
You will also need to run the sql script found in `sql/setup.sql` on this database.

The easiest method would be to run:
```
psql -h <host> -U <username> <password> "<database name>" < sql/setup.sql
```

After everything is setup, all you have to do is run:
```
npm run start
```

### Loki Wallet RPC

Make sure a loki wallet RPC is running. You can do this simply by running the following:
```
loki-wallet-rpc --rpc-login <username>:<password> --rpc-bind-port <port> --daemon-address <address> --wallet-dir <dir> [--testnet]
```

Once it has started, make sure you have created a wallet and after you have done that go into `config/production.json` and edit the values under `loki`.

For development, you can use `lokitestnet.com:38157` as the `daemon-address`

### Development

If you want to run in development mode then you need to run:
```
npm install
npm run dev
```

You can add development config in `config/development.json`

## Configuration

Any properties found in `config/default.json` can be modified to your needs.
If you need different values for either `development` or `production` then add those values to the corresponsing config files.

`config/development.json` for `development` or `config/production.json` for `production`.

Any values that you don't set in those files will be fetched from `config/default.json`.
