# Setup and operation guide

**MedTrace Guard: Pharmaceutical Provenance with Accepted Custody and Safety Gates**

MedTrace Guard uses Solidity contracts, a React dashboard and ethers. Run a persistent Ganache chain for local demonstrations, or connect to the recorded Polygon Amoy deployment. The [README](../README.md) provides the quick start and dependency versions.

## Install

Install Git and Node.js **22.13 or newer** with npm. Check them with `git --version`, `node --version` and `npm --version`.

```bash
git clone https://github.com/hemanth-2104/MedTrace-Guard.git
cd MedTrace-Guard
npm ci
```

Run all subsequent commands from this project directory. Installation needs internet and uses the exact versions in `package-lock.json`. CI also verifies installation with dependency lifecycle scripts disabled using `npm ci --ignore-scripts --no-audit --no-fund`.

## Start or restart locally

```bash
npm start
```

Open **http://127.0.0.1:5173** after the ready message. Keep the terminal running; press **Control+C** to stop. On later runs, return to the same project directory and run `npm start` again.

Startup creates the local chain, deploys and seeds the contract when needed, and starts the dashboard. The local demo uses disposable unlocked development accounts; no wallet extension or faucet funds are needed. Installed local sample certificates work without an external storage service.

The saved chain is `.local-chain/`; its deployment manifest is `public/deployment.json`. A normal restart reuses both. Preserve them together to retain local records, and run only one copy at a time.

## Using the dashboard

Use the **Local demo account** selector to demonstrate each role. These are disposable unlocked accounts on localhost; the Solidity contract checks permissions on every transaction.

| Role | Actions |
|---|---|
| Public viewer | Look up batches, inspect history/safety, verify certificate bytes, view QR |
| Administrator | Assign/revoke stakeholder roles and nominate a successor |
| Manufacturer | Register batches and propose shipments to distributor |
| Distributor | Accept manufacturer shipments; propose shipments to pharmacy |
| Pharmacy | Accept distributor shipments and dispense units |
| Regulator | Review/release temperature holds; recall batches permanently |

A **fresh deployment** has three synthetic batches of 100 units, with a 2–8 °C range. Batch 1 is at the distributor under a temperature hold. Batches 2 and 3 are with the manufacturer.

### Full demonstration

1. Select **Manufacturer** and choose an untouched batch, such as batch 2 or 3 on a fresh deployment.
2. **Propose shipment:** enter the batch ID, distributor address, and a future deadline within seven days and before expiry. Custody stays with the manufacturer until acceptance.
3. Select **Distributor**. **Accept receipt:** enter the batch ID and nonce shown in the pending-shipment timeline. Submit.
4. As distributor, propose the same batch to pharmacy. Select **Pharmacy** and accept with the new nonce. Do not reuse the first nonce.
5. Dispense 10 units as pharmacy. The remaining quantity decreases by 10.
6. Report a simulated temperature of 11.5 °C with an evidence note. A hold appears; dispensing is rejected. A later 5 °C reading cannot erase the hold.
7. Use **Hash an evidence note** to hash a review note; retain the original text yourself. Copy the whole `0x` digest. Select **Regulator** and release the hold with that review digest. Pharmacy dispensing works again.
8. Recall the batch as regulator with a nonzero reason digest. Recall is permanent; further dispensing is rejected.
9. Click **Check certificate bytes** for MATCH. Upload another batch's certificate for MISMATCH. The QR points to the current batch and deployment.

Default local addresses:

| Role | Address |
|---|---|
| Administrator | `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1` |
| Manufacturer | `0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0` |
| Distributor | `0x22d491Bde2303f2f43325b2108D26f1eAbA1e32b` |
| Pharmacy | `0xE11BA2b4D45Eaed5996Cd0823791E0C93114882d` |
| Regulator | `0xd03ea8624C8C5987235048901fB614fDcA89b117` |

These are publicly known development accounts. Use them only for synthetic local demonstrations.

### Register a new synthetic batch

Select Manufacturer. Enter a unique manufacturer batch code, medicine name, production date in the past, expiry in the future, positive whole-unit quantity, and temperature limits. Put a certificate file in `public/certificates/`, use `/certificates/your-file.json` as its locator, and choose that exact file in the form. Submit after its SHA-256 appears.

Selecting a file hashes its bytes; it does not upload it. Reformatting a JSON certificate afterward changes its digest.

## Reset or redeploy the local demonstration

To create a new contract on the same saved chain, stop `npm start`, then follow the manual startup below. Deploy followed by seed creates fresh samples and changes the dashboard's contract; earlier contracts remain in chain history.

To replace the entire local chain, stop project processes and move `.local-chain/` and `public/deployment.json` together into a backup directory outside the checkout. Then run `npm start` to create a new chain and samples. Restore both backup items together while the app is stopped to recover the earlier local state.

## Verify and benchmark

```bash
npm run verify
npm run check:interface
npm run build:amoy
npm run benchmark
```

The current suite has **74 tests**: 64 non-model tests and 10 model tests, including 200 deterministic quantity-conservation traces. `verify` compiles both contracts, runs both suites and builds the default frontend. Tests use isolated in-memory chains and do not change saved dashboard records.

The October 29 [verification log](../evidence/sonar-review-2026-10-29/clean-verify.txt) records 74 passing tests with no failures or skips. Earlier logs contain 68 tests, before six file-boundary regressions were added. The [75-check acceptance record](ACCEPTANCE_RESULTS.md) separately includes actual MetaMask, Amoy and user-confirmed phone checks.

`benchmark` writes receipt gas and 10/50/100-batch local read measurements to `evidence/benchmark.json` and `evidence/gas.csv`. Timings are local observations, not public-network performance. See [evaluation methods and results](EVALUATION.md) and [verification status](VERIFICATION.md).

## Manual local startup

Do not combine this with an already running `npm start`.

Terminal 1, in the project directory:

```bash
npm run chain
```

Leave it running. In terminal 2, in the same project directory:

```bash
npm run compile
npm run deploy
npm run seed
npm run dev
```

Open **http://127.0.0.1:5173**. `deploy` creates a new contract and overwrites the deployment manifest. `seed` requires an empty contract. Manual deployment scripts read `.env` if present; `npm start` explicitly selects the local network.

| Command | Purpose |
|---|---|
| `npm run smoke` | Read-only website/RPC/certificate checks while the local app is running |
| `npm test` | Current 64-test non-model suite |
| `npm run test:model` | Independent 10-test specification suite |
| `npm run build` | Default frontend production output in `dist/` |
| `npm run simulate:temperature -- 3 11.5` | Synthetic temperature report as current custodian |
| `npm run preview:offline` | Model preview at port 4173; does not execute Solidity |

## Certificates, IPFS and wallet signing

Local certificates can be served from `public/certificates/`. Selecting a file during registration hashes it; uploading or pinning is a separate step. An `ipfs://CID` locator is retrieved through the configured gateway and checked against the registered SHA-256.

The [IPFS guide](IPFS.md) documents Kubo setup, the recorded pin and repeatable proof commands. With a Kubo daemon configured on the example API/gateway ports 15001/18080, a POSIX shell can run:

```bash
IPFS_API=http://127.0.0.1:15001 npm run ipfs:upload -- public/certificates/demo-3.json
IPFS_API=http://127.0.0.1:15001 IPFS_GATEWAY=http://127.0.0.1:18080 npm run ipfs:proof
```

On other shells, set these environment variables using that shell's syntax. Keep the administrative Kubo API on loopback. Upload/proof CLI certificate files must be direct files in this checkout's `public/certificates/` or `evidence/ipfs/`, use a supported extension, and contain 1 byte to 8 MiB. Traversal and resolved symlink escapes are rejected. `IPFS_EVIDENCE_DIR` must remain below this checkout's `evidence/` directory.

Set `VITE_IPFS_GATEWAY` in an ignored `.env.local` before starting/building if a different gateway is needed. Only HTTPS origins or loopback HTTP origins are accepted. Never put pinning credentials in a `VITE_` setting. Public retrieval proves availability at the recorded time; durable remote retention is not established.

MetaMask signing is separate from local unlocked-account signing. Connecting MetaMask cannot silently fall back to the local signer. Account/network changes clear the signing session; reconnect before another write. See [wallet setup and verification](METAMASK.md).

## Open the deployed Amoy dashboard

The recorded contract is [0x95DDa069490E8D6B0650A707052598b306C495e2](https://amoy.polygonscan.com/address/0x95DDa069490E8D6B0650A707052598b306C495e2), Polygon Amoy, chain **80002**. The checked-in `public/deployment.amoy.json` reuses it without starting a local chain, deploying or seeding again.

After installation, copy `.env.amoy.example` to `.env.amoy.local` if that private configuration does not already exist. Leave signing-key fields empty for browser use. In a POSIX shell:

```bash
cp .env.amoy.example .env.amoy.local
npm run dev:amoy -- --port 5176
```

Preserve existing configuration instead of overwriting it. On other shells, use the equivalent copy command. Open **http://127.0.0.1:5176/?batch=1**. Later runs need only the `dev:amoy` command. Internet is required; public lookup needs no wallet. Authorized writes require MetaMask on Amoy and enough test POL for fees.

```bash
npm run testnet:read -- 1
npm run build:amoy
```

The reader checks public code/state without signing. The build creates `dist/` for a web server. Use localhost or HTTPS for certificate hashing and wallet access. Phone lookup requires a reachable frontend/read RPC; LAN HTTP is suitable for read-only lookup but may lack browser cryptography for certificate hashing. See [Amoy setup, receipts and repeat workflow](AMOY_LIVE.md), [testnet scripts](TESTNET.md), and the [demo walkthrough](DEMO.md).

The October 26 demonstration completed manufacturer → distributor → pharmacy using four accepted-custody transactions. Batch 1 then received an 11.5 °C report and intentionally remains held at Pharmacy with 100 units in that recorded state. Public gateway retrieval and dashboard MATCH passed. Public service availability and current chain state should be checked when repeating the demonstration.

## Troubleshooting

| Symptom | Resolution |
|---|---|
| Missing npm or unsupported Node option | Install Node 22.13 or newer with npm; reopen the terminal |
| Missing dependencies | Run `npm ci` from the project directory |
| Registry/download failure | Check internet and registry/proxy settings |
| Port 8545 or 5173 in use | Stop the other project instance before starting another |
| Connection refused | Keep the chain/frontend terminal running; wait for its ready message |
| Contract/network mismatch | Check the selected network, deployment manifest and ignored environment configuration |
| Seed requires an empty contract | Reuse existing samples or intentionally deploy a new contract first |
| Transaction blocked | Check role, custodian, stage, nonce, deadline, expiry, hold, recall and quantity |
| Certificate mismatch | Use the exact registered bytes; reformatting JSON changes its hash |
| Native µWS warning | Ganache uses its Node.js fallback; this path passed recorded verification |

Ganache's bundled development tooling has documented dependency advisories; see [the recorded audit](../evidence/npm-audit.json). Passing tests and the [Sonar review](SONAR_REVIEW.md) do not constitute a production security audit.

## Disposable acceptance run

`npm run acceptance:local -- /absolute/path/to/FRESH/public/deployment.json` is **destructive and local-only**. Use a separate fresh clone under the current project's parent directory or an OS temporary directory, with a fresh seeded contract containing exactly three batches. The script creates records, advances chain time and transfers administration. The manifest must be named `public/deployment.json`; arbitrary files, parent traversal and resolved symlink escapes are rejected. Never point it at a saved demonstration chain.

## Local backups

Back up `.local-chain/` together with `public/deployment.json` while the app is stopped to preserve local state. Preserve private environment files separately and securely. A Git checkout restores source and public evidence, not dependencies, private configuration, saved chain state or Kubo pins. Reinstall dependencies and recreate storage services when restoring on another machine.
