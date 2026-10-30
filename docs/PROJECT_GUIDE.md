# MedTrace Guard

> Detailed working-folder guide retained from the completed project. The root README contains the portable GitHub clone instructions and current design-draft links. References below to earlier dates, ZIP extraction, local paths, or unfinished course tasks describe their recorded context.

**Pharmaceutical Provenance with Accepted Custody and Safety Gates**  
CSE 540 Engineering Blockchain Applications · Fall B 2026

This project implements the supplied proposal with Solidity contracts and a React website. It records medicine batches, requires recipient acceptance of custody, enforces safety and quantity gates, verifies certificate bytes, and displays history and QR links. It runs on a real local Ethereum-compatible blockchain using Ganache. Streamlit is not required.

## Run it next time on this Mac

Open Terminal and run:

```bash
cd "/Users/hemanth/Desktop/Project/540/medtrace-guard"
npm start
```

Wait for the website ready message, then open **http://127.0.0.1:5173**. Keep Terminal open. Press **Control+C** once to stop. Run the same commands next time.

Dependencies are already installed in this working folder. `npm start` starts the blockchain, deploys and seeds it when necessary, and starts the website. No MetaMask, faucet funds, Python, Docker, database service, `.env`, or IPFS account is needed for this local demo.

The chain is saved in `.local-chain/`; the dashboard configuration is `public/deployment.json`. A normal restart reuses both, including your changes to batches. Keep both to retain your work. Run only one copy at a time.

## First installation after extracting the updated ZIP

Install Node.js with npm. The project requires **Node 22.13 or newer**. This verification used Node **26.9.0** and npm **11.19.1** on macOS Apple Silicon. Check your installation with `node --version` and `npm --version`.

Extract `MedTrace_Guard_Runnable_Project.zip`, open Terminal, and substitute your extracted folder location:

```bash
cd "/path/to/medtrace-guard"
npm ci
npm start
```

`npm ci` needs internet and installs the exact versions in `package-lock.json`. A clean installation was verified in a separate temporary directory. After installation, the local app and sample certificates work without external services. The interface uses system fonts.

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

**Current working-folder state after browser testing:** batch 2 completed both handoffs, had 20 units dispensed, underwent a hold/release, and was recalled with 80 units remaining. Batch 3 remains untouched for your own demo. Batch 4 (`BROWSER-4`) was registered through the website. The updated ZIP excludes this saved chain and starts with fresh samples.

### Full demonstration

1. Select **Manufacturer** and choose an untouched batch, such as batch 3 in this working folder.
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

## Stop, restart, or start fresh

Press Control+C in the running terminal. Restart with `npm start`; your records remain.

For a fresh set of sample batches on the same saved chain, stop the app and use the manual startup below. Running **deploy**, then **seed**, creates a new contract and switches the dashboard to it. The previous contract remains in local chain history.

To erase the chain entirely, stop all project processes, back up `.local-chain/` together with `public/deployment.json` if needed, then remove `.local-chain/` and run `npm start`. It redeploys and seeds automatically. Removing that directory permanently removes local records unless backed up.

## Verify everything locally

```bash
npm run verify
npm run benchmark
```

`verify` compiles both contracts, runs 58 contract, certificate, IPFS, wallet-session, and testnet-workflow tests plus 10 model tests, and builds React. The model checks include 200 deterministic quantity-conservation traces. These tests use isolated in-memory chains and do not change your dashboard's saved records.

`benchmark` saves actual gas receipts and 10/50/100-batch measurements to `evidence/benchmark.json` and `evidence/gas.csv`. These are local classroom measurements, not public-network performance.

Verified October 25, 2026, America/Phoenix: **68/68 tests passed**, both contracts compiled within the EIP-170 size limit, production build passed, benchmark passed, browser lifecycle/certificate checks passed, and saved data survived restart. See [docs/VERIFICATION.md](docs/VERIFICATION.md) for details and limits.

## Manual startup and individual commands

Do not combine this with an already running `npm start`.

Terminal 1, leave running:

```bash
npm run chain
```

Terminal 2, in order:

```bash
npm run compile
npm run deploy
npm run seed
npm run dev
```

Open http://127.0.0.1:5173. `deploy` always creates a new contract and overwrites the dashboard configuration. `seed` requires an empty contract. Manual deploy/seed commands read `.env` if present. The easy `npm start` command forces the local network.

| Command | Purpose |
|---|---|
| `npm run smoke` | Read-only website/RPC/certificate checks; run while `npm start` is active |
| `npm test` | EVM contract and certificate tests |
| `npm run test:model` | Independent JavaScript specification tests |
| `npm run build` | Production website in `dist/`; rebuild after a new deployment |
| `npm run simulate:temperature -- 3 11.5` | Submit a synthetic reading as current custodian; preserve evidence under `evidence/telemetry/` |
| `npm run preview:offline` | Specification-only preview at http://127.0.0.1:4173; does not execute Solidity |

## Real IPFS storage and MetaMask

Three parallel implementation lanes were combined and verified. The local application still uses your saved four-batch chain by default. Wallet signing and local unlocked-account signing now have explicit, separate modes. Connecting MetaMask cannot silently fall back to local RPC signing. See [MetaMask setup and verification](docs/METAMASK.md).

The actual Kubo certificate pin is:

```text
ipfs://bafkreibu5ifryw6stuqi7uoddntloolf3rf7zb5aalzctnac5qou47rsei
```

A real daemon added and recursively pinned the 165-byte synthetic certificate. Exact gateway retrieval and a renamed copy returned MATCH; a modified copy returned MISMATCH. The real CID was registered on an isolated local contract, and the integrated React dashboard retrieved it through the Kubo gateway and returned MATCH. A later live recheck retrieved the exact 165 bytes through both Pinata and Filebase public gateways; the React app returned MATCH using `VITE_IPFS_GATEWAY=https://gateway.pinata.cloud`. See `evidence/live-checks-2026-10-25/`. The certificate is pinned on the local Kubo node; permanent remote pin retention has not been established. See [IPFS runtime and repeatable commands](docs/IPFS.md) and `evidence/integration/ipfs-contract.json`.

The current isolated Kubo API is port 15001; its gateway is port 18080. With that daemon running:

```bash
IPFS_API=http://127.0.0.1:15001 npm run ipfs:upload -- public/certificates/demo-3.json
IPFS_API=http://127.0.0.1:15001 IPFS_GATEWAY=http://127.0.0.1:18080 npm run ipfs:proof
```

Select the same exact file and returned CID when registering. For the current local gateway, set `VITE_IPFS_GATEWAY=http://127.0.0.1:18080` in ignored `.env.local` before starting/rebuilding the app. A public-only `.env.local.example` is included. The administrative IPFS API stays loopback-only, and it is never exposed to the browser. The temporary Kubo binary/repository are not included in the ZIP; follow `docs/IPFS.md` to install/recreate them on another machine.

For the disposable browser proof, `npm run integration:ipfs` starts an isolated in-memory RPC at port 18545 after a live IPFS proof has been recorded. In another terminal:

```bash
VITE_READ_RPC=http://127.0.0.1:18545 VITE_IPFS_GATEWAY=http://127.0.0.1:18080 VITE_DEPLOYMENT_PATH=/deployment.ipfs-proof.json npm run dev -- --port 5174
```

That demonstration uses a separate manifest and never writes your saved four-batch chain. Stop both proof terminals when finished. Its temporary manifest is removed when the proof RPC stops.

## Run the deployed Amoy website

The actual public contract is [0x95DDa069490E8D6B0650A707052598b306C495e2](https://amoy.polygonscan.com/address/0x95DDa069490E8D6B0650A707052598b306C495e2), Polygon Amoy, chain **80002**. [Deployment transaction](https://amoy.polygonscan.com/tx/0x5c59371be153977350264ee4daa8c8fb660c96e4b415d9d92b59e0559dd59e6b) succeeded; deployed and creation bytecode exactly match solc 0.8.30, optimizer 200, via IR, Shanghai. All four stakeholder roles and batch #1 (`AMOY-LIVE-20261025`, 100/100 units) are confirmed on-chain. Public lookup and certificate MATCH work without a connected wallet.

On a fresh extraction, from the project directory:

```bash
npm ci
cp .env.amoy.example .env.amoy.local
chmod 600 .env.amoy.local
npm run dev:amoy -- --port 5176
```

Open **http://127.0.0.1:5176/?batch=1**. On later runs, start with just the last command. Keep an existing `.env.amoy.local` instead of copying over it. All private-key fields can stay empty for browser use: MetaMask holds the signing keys, and public lookup needs no wallet. `public/deployment.amoy.json` is included to reuse the deployed contract; do not deploy again just to open it.

Select **Connect MetaMask**, and use **Switch wallet network** if prompted. The dashboard checks Amoy chain identity and the selected account's on-chain role. Public stakeholder addresses and wallet account numbers are in [the live Amoy guide](docs/AMOY_LIVE.md). A transaction requires that participant's faucet test POL and wallet approval. The original local demo remains `npm start` at port 5173.

```bash
npm run testnet:read -- 1
npm run build:amoy
```

The public reader works with empty signing-key fields. Production output is in `dist/`. Serve it through a web server; opening `dist/index.html` directly is insufficient. For the optional phone lookup on the same Wi-Fi, run `npm run build:amoy`, then `./node_modules/.bin/vite preview --host <YOUR_LAN_IP> --port 5177`. Open that LAN address on the Mac to generate its QR, then scan from the phone. The Mac and server must stay on; the LAN IP may change. Use localhost or HTTPS for certificate hashing and wallet signing: browser cryptography is unavailable on an ordinary LAN HTTP origin.

The read RPC is `https://polygon-amoy-bor-rpc.publicnode.com`, independently checked against chain 80002 and the actual contract. dRPC remains an alternate endpoint; it intermittently returned errors during live checks. Reads now disable JSON-RPC batching and use a 1.5-second public-network polling interval. Public IPFS retrieval uses `https://gateway.pinata.cloud`.

**Verified October 26, 2026:** both public accepted handoffs succeeded through actual MetaMask. Batch #1 reached Pharmacy custody with 100/100 units and five ordered history entries. A subsequent synthetic 11.5 °C report set a temperature hold (sixth entry). Dispensing one unit returned `Blocked`; quantity and history stayed unchanged. This held state is intentional demonstration data. The public gateway and dashboard both returned certificate MATCH. Exact receipts, actual gas use, and repeat steps are in [AMOY_LIVE.md](docs/AMOY_LIVE.md); evidence is in `evidence/amoy-completion-2026-10-26/`. The optional CLI workflow is documented separately in [TESTNET.md](docs/TESTNET.md).

## Troubleshooting

| Symptom | Resolution |
|---|---|
| `npm: command not found` | Install Node.js with npm and reopen Terminal |
| Unsupported `--env-file-if-exists` | Upgrade Node to the required version |
| Missing module / missing Vite | Run `npm ci` inside this project folder |
| Registry or download failure | Check internet and npm registry/proxy settings, then retry |
| Port 8545 or 5173 is in use | Stop the other project terminal; run only one copy |
| Connection refused | Leave `npm start` running; wait for the ready message |
| Missing contract / network mismatch | Use `npm start`; after manual changes check deployment configuration and `.env.local` |
| Seed requires empty deployment | Samples already exist; skip seed or deliberately redeploy |
| Action blocked | Check role, custodian, nonce/deadline, expiry, hold, recall, and quantity |
| Certificate mismatch | Use the exact registered bytes; do not reformat JSON |
| µWS native binary warning | Ganache falls back to Node.js; full local checks passed with that fallback |

The dependency audit still reports **33 findings in Ganache's bundled tooling** (1 low, 5 moderate, 22 high, 5 critical). Compatible fixes were applied for ethers, Vite, and the Solidity compiler's temporary-file helper. Ganache's bundled findings cannot be removed with a routine `npm audit fix`; the suggested forced downgrade changes the chain implementation. This is validated as a localhost classroom prototype, not a production deployment. See `evidence/npm-audit.json`.

See [the completion checklist](docs/COMPLETION_CHECKLIST.md) for verification coverage, remote pin retention, report, and video work.

## Files and deliverable boundaries

| Path | Purpose |
|---|---|
| `contracts/MedTraceGuard.sol` | Custody, safety, quantity, administration, and history |
| `contracts/MedTraceBaseline.sol` | Deliberately simpler comparison baseline |
| `src/main.jsx`, `src/style.css` | React/ethers website |
| `scripts/start.mjs`, `scripts/chain.mjs` | Single-command startup and persistent blockchain |
| `scripts/deploy.mjs`, `scripts/seed.mjs` | Deployment and synthetic fixtures |
| `tests/` | Contract, model, certificate checks |
| `docs/ARCHITECTURE.md`, `docs/DEMO.md` | Design and demonstration guide |
| `docs/proposal.tex`, `docs/technical_report*.tex` | Renamed editable sources; report remains a draft |
| `docs/archive/` | Original PDF snapshots and original manifest, which may retain old branding |
| `docs/TEAM_CONTRACT.md` | Team agreement template to complete |

The supplied Word proposal, also copied unchanged to `docs/MedTrace_Guard_Project_Proposal.docx`, is the title/scope reference. The original ZIP and Word document remain unchanged in the parent folder. Archived PDFs were not recompiled or visually reverified during this run; their old branding/layouts are historical snapshots. The IEEE source compiled on October 25; export and inspect the final PDF before submission.

The prototype uses synthetic batches and simulated temperatures on one manufacturer → distributor → pharmacy route. It does not integrate real sensors, prove physical medicine authenticity, handle patient records, split batches, or certify regulatory compliance. Repository upload, team agreement, recordings, and final report formatting remain team tasks.

## Detailed A–J acceptance checks

**Current coverage: 75/75 passed, zero unresolved failures or untested IDs.** All A–J checks have recorded evidence, including user-confirmed phone lookup on the same Wi-Fi. The earlier local-only run passed 64, real IPFS raised this to 66, actual MetaMask to 68, deployment to 73, the two accepted Amoy handoffs to 74, and the confirmed phone scan to 75. These checklist counts are separate from the **68 automated tests** (zero failures/skips). Per-ID results are in `evidence/amoy-completion-2026-10-26/checklist-status.json`; earlier evidence remains under `evidence/acceptance-2026-10-25/`. J7 is supported by the user’s explicit phone confirmation in `phone-check.json`; it is not an agent-observed phone screenshot or a permanent public hosting claim.

G4 exposed a missing-file SPA fallback being shown as MISMATCH. Retrieval now reports unavailable/unverified for HTML fallback, HTTP errors, or failed downloads. Certificates for this workflow should be JSON, PDF, or another non-HTML file. RPC outages now show an actionable connection error. The expanded 68-test suite includes certificate retrieval, explicit signing sessions, safe network switching, and receipt-workflow regression tests. The wallet tests use simulated EIP-1193 providers; testnet execution tests use an isolated local EVM.

The optional `npm run acceptance:local -- /absolute/path/to/FRESH/public/deployment.json` command is **destructive and local-only**. It requires a fresh seeded contract with exactly three batches; it creates synthetic fixtures, advances chain time, transfers administration, and tests reverts. Use an isolated fresh extracted copy under the current project’s parent directory or the OS temporary directory for that command. The manifest must be named `public/deployment.json`; arbitrary local files and parent traversal are rejected. The normal `npm run verify` suite remains isolated in memory and does not alter your saved dashboard data.

## Code checkpoints

The workspace keeps the immutable pre-integration checkpoint at `../checkpoints/2026-10-25-before-external-integrations/` with source ZIP, previous deliverable ZIP, SHA-256 manifests, and restore instructions. A second checkpoint records the combined integration state. These checkpoints preserve code and evidence; installed dependencies, wallet secrets, generated deployment manifests, blockchain data, and the Kubo repository are excluded. Your original four-record local chain remains in the working folder and was checked after integration.

## Latest public workflow checkpoint

The October 26 completion evidence records all four public custody transactions, the temperature report, unchanged state after blocked dispensing, exact public-gateway MATCH, and passing compile/test/build logs. The latest code/evidence archive is `../checkpoints/2026-10-26-final-verified/source.zip`; restore instructions and SHA-256 are alongside it. `../MedTrace_Guard_Runnable_Project.zip` is the runnable deliverable. Wallet secrets, installed dependencies, local chain data, and the Kubo repository are excluded; the public Amoy deployment manifest is included. Older checkpoints are preserved.
