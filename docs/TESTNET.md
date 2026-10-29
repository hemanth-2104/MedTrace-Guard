# Polygon Amoy workflow

This lane uses Polygon Amoy, chain ID **80002**, gas token **POL**, RPC `https://polygon-amoy.drpc.org`, and [Amoy Polygonscan](https://amoy.polygonscan.com). These parameters were checked against the [official Polygon RPC documentation](https://docs.polygon.technology/pos/reference/rpc-endpoints) on 2026-10-25.

## Current public evidence

**An actual contract is deployed on Amoy.** See [AMOY_LIVE.md](AMOY_LIVE.md) for the address, transaction hashes, successful deployment, role, registration and accepted-handoff receipts, key-free website startup, and the public safety demonstration. `evidence/amoy-completion-2026-10-26/` completes the earlier deployment evidence in `evidence/amoy-live/`. The live dashboard's primary read RPC is now PublicNode after intermittent dRPC failures. Actual MetaMask signing remains in the wallet; no keys were exported.

The old preflight and isolated chain-ID-80002 tests remain historical evidence, clearly separate from public transactions. The following CLI path is an optional alternative for a separately secured configuration; it is **not needed to reuse the deployed website**. Do not deploy a second contract merely to reopen the dashboard.

## Secure local setup

From the project directory:

```sh
cp .env.amoy.example .env.amoy.local
chmod 600 .env.amoy.local
```

Open `.env.amoy.local` in a local editor. Set the admin, manufacturer, distributor, pharmacy, and regulator private-key entries to **five different dedicated testnet accounts**. Each should hold at least `AMOY_MIN_BALANCE_POL` (default `0.1`) in faucet test POL; the admin also needs the estimated deployment fee in addition to that reserve. [Polygon's faucet](https://faucet.polygon.technology/) is linked by the official network documentation. The threshold is a configurable preflight reserve, not a fee quote.

Never enter keys into chat, screenshots, source files, `VITE_*` variables, or terminal command arguments. `.env.amoy.local` is ignored by Git via `.env.*.local`. Keep a credential-bearing RPC URL in this file too; exported public manifests contain only the public default endpoint.

The example certificate URI and file correspond to the real Kubo pin documented in `evidence/ipfs/proof.json`. The stored SHA-256 is computed from `evidence/ipfs/certificate-original.json`. That proof establishes local gateway retrieval, filename-independent CID, and modified-byte mismatch. The initial public gateway attempt failed; a later live recheck retrieved exact bytes through Pinata and Filebase, and React returned MATCH through Pinata (`evidence/live-checks-2026-10-25/`). Keep the Kubo node running or arrange remote pin retention and verify the intended public gateway before treating the URI as publicly available. For a different upload, update **both** `AMOY_CERTIFICATE_FILE` and `AMOY_CERTIFICATE_URI` to its exact bytes and returned URI.

## Commands

Read-only preflight requires no wallet or certificate:

```sh
node --env-file-if-exists=.env.amoy.local scripts/testnet-preflight.mjs --read-only
```

Funded-wallet preflight fails on missing/invalid/duplicate keys, incorrect chain, unavailable RPC, or insufficient balance. No transaction is submitted:

```sh
node --env-file-if-exists=.env.amoy.local scripts/testnet-preflight.mjs
```

Deploy separately from the original local manifest:

```sh
node --env-file-if-exists=.env.amoy.local scripts/deploy-testnet.mjs
```

This checks all wallet balances, estimates deployment cost, compiles and deploys `MedTraceGuard`, saves a deployment receipt, and writes `public/deployment.amoy.json`. It refuses to overwrite an existing Amoy manifest. Archive the manifest deliberately before requesting a new contract. The original `npm run deploy` now accepts only the local chain, so it cannot overwrite `public/deployment.json` with a public deployment.

Execute the public demonstration:

```sh
node --env-file-if-exists=.env.amoy.local scripts/testnet-workflow.mjs
```

This workflow:

1. Rechecks Amoy identity, balances, saved runtime bytecode hash, and admin ownership.
2. Assigns manufacturer, distributor, pharmacy, and regulator roles where needed.
3. Registers one synthetic certificate-bearing batch using the exact file's SHA-256.
4. Proposes manufacturer → distributor custody, then accepts with the distributor wallet.
5. Proposes distributor → pharmacy custody, then accepts with the pharmacy wallet. It checks that a proposal alone did not change custody.
6. Reports a simulated 11.5 °C excursion against the 2–8 °C range.
7. Confirms `Blocked` through `eth_call`, deliberately submits a dispense transaction with an explicit gas limit, and preserves its mined **status 0** receipt. This consumes test POL even though the contract rejects the dispense. It checks that quantities and history remain unchanged.
8. Creates a separate provider-only contract reader and records batch metadata, eligibility, and ordered custody history.

Each run registers a new batch. Roles already assigned correctly are reused. A partially completed run is not automatically replayed: inspect its saved transaction hashes first. By default, receipts wait for two confirmations; a missing receipt is recorded as unresolved, never reported as success.

Read a known public batch without any wallet keys:

```sh
node --env-file-if-exists=.env.amoy.local scripts/testnet-read.mjs 1
```

The reader accepts a positive batch ID, checks chain and runtime bytecode, then saves `evidence/testnet/read-batch-1.json`. Browser consumers can select `/deployment.amoy.json` through their separate frontend configuration. Public manifests include chain metadata for MetaMask network switching, ABI, address, accounts, runtime bytecode hash, and deployment transaction hash. They never contain signing keys.

## Receipt audit

Deployment and workflow runs use separate timestamped `evidence/testnet/` directories. Every send saves a `broadcast` record immediately, then replaces it with a full mined receipt including block hash, status, gas usage, logs, and transaction hash. Each record includes an explorer link and expected status. A receipt timeout preserves the hash as `receipt-unavailable` so it can be reconciled manually without blindly sending again.

The expected final result is pharmacy custody, 100 units remaining, `hold=true`, eligibility reason `3`, two recipient-accepted transfers, and one rejected dispense receipt. `workflow.json` and the individual receipts supply the audit trail. Only receipts actually obtained from the public RPC belong in a public-chain acceptance report.

Run isolated tests:

```sh
node --test tests/testnet.test.mjs
```
