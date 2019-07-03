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

If it doesn't exist then you can copy and rename `config/production.example.json`

You will also need to run the sql script found in `sql/setup.sql` on this database.

The easiest method would be to run:
```
psql -h <host> -U <username> <password> "<database name>" < sql/setup.sql
```

After everything is setup, all you have to do is run:
```
npm run start
```

## Loki Wallet RPC

To ensure the server starts, you need to make sure a loki wallet RPC instance is running.

You can do this simply by running the following:
```
loki-wallet-rpc --rpc-login <username>:<password> --rpc-bind-port <port> --daemon-address <address> --wallet-dir <dir> [--testnet]
```

You will also need to ensure that you have a wallet created to be used with the bridge. Any deposits and swaps will be made using this wallet.

Go into `config/production.json` and edit the values under `loki`.

For development, you can use `lokitestnet.com:38157` as the `daemon-address`

## Configuration

Any properties found in `config/default.json` can be modified to your needs.
If you need different values for either `test`, `development` or `production` then add those values to the corresponsing config files.

`config/test.json` for `testing`
`config/development.json` for `development`
`config/production.json` for `production`.

Any values that you don't set in those files will be fetched from `config/default.json`.

## Commands

| Command | Description |
| --- | --- |
| npm run start | Run the API server in **Production** mode |
| npm run dev | Run the API server in **Development** mode |
| npm run test | Run the test suite |


## Testnet Coins

If you would like to issue some tokens on the binance testnet, please follow this guide: [How to create binance token](https://lightrains.com/blogs/how-create-binance-token)

Once you have done so, edit `config/development.json` and set the following fields:
```json
"binance": {
  "symbol": "<Your issued token symbol>",
  "wallet": {
    "mnemonic": "<Wallet that was funded your issues coins>"
  }
},
```
