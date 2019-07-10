# Loki Binance Bridge

### Features:
- [x] Swap Loki to B-Loki.
- [x] Swap B-Loki to Loki.
- [x] See balance of Loki and B-Loki accounts.
- [x] Process all Loki and B-Loki swaps.
- [x] Print invalid transactions

| Folder | Description |
| --- | --- |
| api | The api server for the bridge. This is also where the swap processing happens |
| bridge-core | Shared code between the `api` and `processing` |
| loki-bridge | The front end for the bridge |
| processing | The processing logic for the bridge |

#### Build instructions 