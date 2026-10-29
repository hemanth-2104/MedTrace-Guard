# Historical completion progress

These dated intermediate observations are superseded by [the final 75/75 results](../ACCEPTANCE_RESULTS.md). They are retained as history, not current status.

## Historical three-agent integration checkpoint (superseded below)

MetaMask, IPFS, and public-testnet agents worked in parallel; root combined their code and tested the shared application. The latest suite passed 68 tests with zero failures/skips and a successful production build. G5/G6 now pass with real Kubo, a local-chain CID registration, and React browser retrieval. Checklist status is 66/75 passed; I6/I7 and J1–J7 remain unverified. See `evidence/integration/`, `docs/METAMASK.md`, `docs/IPFS.md`, and `docs/TESTNET.md`. No public deployment success is claimed.

## Historical Brave / MetaMask and public IPFS recheck (superseded below)

I6/I7 passed using the actual extension: approved registration receipt status 1, cancelled registration with no additional transaction or state/history change, account change clearing identity, and connected-site network change clearing identity. Evidence is in `evidence/metamask-live/`. Public gateway retrieval and browser MATCH passed (`evidence/live-checks-2026-10-25/`). The updated checklist is **68/75 passed, 0 failures, 7 not tested (J1–J7)**. J7 remains outside the local demonstrated scope. Amoy deployment and public workflow remain pending faucet test POL; no public receipts are claimed.

## Historical Amoy deployment follow-up (superseded below)

J1/J2/J3/J5/J6 now pass with actual public evidence. J5 used a real read-only call rejecting an unsafe direct Manufacturer → Pharmacy route (`InvalidTransfer`), with unchanged state/history; no failed mined receipt is claimed. Coverage is **73/75 passed**, zero outstanding implementation-test failures, with **J4 pending Manufacturer faucet funding** and **J7 outside the localhost hosting demonstration**. The public certificate returned MATCH. `npm run verify` passed 68 tests and production build after the public-RPC batching fix; `npm run build:amoy` also passed. Exact receipts and current limitations are in `evidence/amoy-live/` and `AMOY_LIVE.md`.

