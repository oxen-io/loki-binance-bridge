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

Install all the dependencies:
```
npm install
```

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

## Testnet Coins

If you would like to issue some tokens on the binance testnet, please follow this guide: [How to create binance token](https://lightrains.com/blogs/how-create-binance-token)

Once you have done so, edit `config/development.json` and set the following fields:
```json
"binance": {
  "symbol": "<Your issued token symbol>",
  "mnemonic": "<Wallet that was funded your issues coins>"
},
```
