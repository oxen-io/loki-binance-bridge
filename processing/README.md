# Loki Bridge Processing

This is where the processing logic lies for the bridge

## Pre-requisites
  - Node 11.15.0
    - This can be installed using [nvm](https://github.com/nvm-sh/nvm)

## Installation

If you're using `nvm` then run:
```
nvm use
```

Install dependencies from bridge core:
```
cd ../bridge-core/ && npm install && cd ../processing
```

Install all the dependencies:
```
npm install
```
If installation fails then run:
```
npm ci
```

Edit the config `config/production.json` to match the values of the api server. **THIS IS VERY IMPORTANT!**

### Processing

| Command | Description |
| --- | --- |
| npm run autoSwap | Perform auto swapping |
| npm run swap | Perform any pending swaps in the database |
| npm run sweep | Go through transactions and add new swaps if needed |
| npm run checkBalance | Check if the amount received matches the amount we have swapped |
| npm run printInvalid | Print any transactions sent to the binance address which we don't have a client for. |

The flow for processing would be the following:
- Sweep transactions
  - This ensures that we don't miss any swaps from incoming transactions
- Check balance
  - We need to verify manually that the amount we received is the amount we'll send out
  - If these don't match then something went wrong, sweeping might fix it.
- Swap
  - Send out all amounts to the users

## Auto Swap

To get auto swap to work correctly, you will have to modify the following in the config file:
```
  "dailyLimit": 100,
  "autoRunInterval": 10,
```

| Field | Description |
| --- | --- |
| dailyLimit | The maximum amount of USD worth of swaps that can be processed on a given day.<br>Once a given `SWAP_TYPE` hits this limit then no more swaps of those type will be processed. |
| autoRunInterval | The interval in minutes to run the auto processing |

Once you have done that then simply run:
```
npm run autoSwap
```

If any error occurs then the process will be terminated to ensure that funds stay safe.

## Testing

The tests will fail to run if you don't have `binance.mnemonic` set in the config.
We want to avoid setting it in `config/default.json`.

What you want to do is generate a binance wallet and note down it's mnemonic.
After you have done that create a new config file `config/local-test.json` and paste the following:

```json
{
  "binance": {
    "mnemonic": "<paste your new wallet mnemonic>"
  }
}
```

This `local-test.json` will not be added to your git.

## Testnet Coins

If you would like to issue some tokens on the binance testnet, please follow this guide: [How to create binance token](https://lightrains.com/blogs/how-create-binance-token)

Once you have done so, edit `config/development.json` and set the following fields:
```json
"binance": {
  "symbol": "<Your issued token symbol>",
  "mnemonic": "<Wallet that was funded your issues coins>"
},
```
