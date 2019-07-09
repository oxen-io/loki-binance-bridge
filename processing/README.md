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
If installation fails then remove `package-lock.json` and try again. Ref: https://npm.community/t/npm-install-for-package-with-local-dependency-fails/754/27

Edit the config `config/production.json` to match the values of the api server. **THIS IS VERY IMPORTANT!**

### Processing

| Command | Description |
| --- | --- |
| npm run swap | Perform any pending swaps in the database |
| npm run sweep | Go through transactions and add new swaps if needed |
| npm run checkBalance | Check if the amount received matches the amount we have swapped |

The flow for processing would be the following:
- Sweep transactions
  - This ensures that we don't miss any swaps from incoming transactions
- Check balance
  - We need to verify manually that the amount we received is the amount we'll send out
  - If these don't match then something went wrong, sweeping might fix it.
- Swap
  - Send out all amounts to the users

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
