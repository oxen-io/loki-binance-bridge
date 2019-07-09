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
npm install
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
npm run dev
```

## Production

Make sure you have [PM2](http://pm2.keymetrics.io/docs/usage/quick-start/) installed.

Then simply run:
```
npm install
npm start
```

To stop run:
```
npm stop
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

We use [node-config](https://github.com/lorenwest/node-config) for configurations.

Any properties found in `config/default.json` can be modified to your needs.

For production, we reccommend you copy `config/production.example.json` to `config/production.json` and edit any values in there.


Any values that you don't set in those files will be fetched from `config/default.json`.

<details>
<summary>Properties</summary>

### Descriptions

| Property | Description |
| --- | --- |
| serverPort | The port to run the server on |
| useAPIEncryption | Whether to encrypt `POST` requests |

#### Binance

| Property | Description |
| --- | --- |
| api | The binance api url |
| network | The binance network (testnet/production) |
| symbol | The symbol of the token you are swapping |
| depositAddress | The address to where users will deposit the binance currency to |

#### Database
| Property | Description |
| --- | --- |
| host | The ip or address of the database |
| port | The database port |
| database | The name of the database to use |
| user | The database user |
| password | The database password |

#### Loki

| Property | Description |
| --- | --- |
| minConfirmations | The minimum number of confirmations required before we add the incoming transaction to our swaps |
| withdrawalFee | The amount of loki to deduct upon withdrawing |
| walletRPC.host | The ip or address where the RPC can be accessed |
| walletRPC.port | The RPC port |
| walletRPC.username | The RPC username |
| walletRPC.password | The RPC password |
| wallet.filename | The name of the wallet to use for swaps.<br>This is where you will receive and send loki |
| wallet.password | The password of the wallet |
| wallet.accountIndex | The account index to use for the wallet |

</details>

## Commands

| Command | Description |
| --- | --- |
| npm run start | Run the API server in **Production** mode |
| npm run dev | Run the API server in **Development** mode |
| npm run test | Run the test suite |
