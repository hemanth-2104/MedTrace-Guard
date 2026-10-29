# MedTrace Guard

**Pharmaceutical Provenance with Accepted Custody and Safety Gates**  
Group 20 | CSE 540 Engineering Blockchain Applications | Fall B 2026

MedTrace Guard is an educational Solidity and React application for tracking medicine batches from manufacturer to distributor to pharmacy. Custody changes only when the intended recipient accepts a shipment. Recorded recalls, expiry, unresolved temperature holds, and exhausted quantities block distribution. Certificate files stay off-chain; the dashboard compares their SHA-256 digest with the value registered on-chain.

## Completed software: 75/75 acceptance checks

**75 passed, 0 failed, 0 untested.** The complete implementation and its final evidence are included in this repository. [Review all 75 checks and their evidence](docs/ACCEPTANCE_RESULTS.md).

| Check group | Result |
|---|---:|
| A — Setup/build | 6/6 PASS |
| B — Registration | 6/6 PASS |
| C — Custody | 10/10 PASS |
| D — Temperature holds | 9/9 PASS |
| E — Recall/expiry | 8/8 PASS |
| F — Dispensing | 6/6 PASS |
| G — Certificates/IPFS | 6/6 PASS |
| H — Accounts/admin | 7/7 PASS |
| I — Browser/history | 10/10 PASS |
| J — Amoy/phone QR | 7/7 PASS |

**68/68 automated tests** also pass. This is a separate count from the 75 acceptance checks: actual wallet signing, public-network transactions and phone confirmation have retained live evidence. Both public accepted handoffs, the held-batch rejection and public certificate MATCH are indexed in [AMOY_LIVE.md](docs/AMOY_LIVE.md).

## Smart Contract Design Draft

Start with the [design document](docs/SMART_CONTRACT_DESIGN.md) and [commented contract interface](contracts/interfaces/IMedTraceGuard.sol). The [main implementation](contracts/MedTraceGuard.sol) and [comparison baseline](contracts/MedTraceBaseline.sol) are included. The implementation exceeds the minimum draft milestone. Its original contract source is preserved for consistency with the recorded public deployment.

| Rubric criterion | Where to review |
|---|---|
| Public, organized repository | Root structure below; source, tests, scripts, documentation, evidence |
| README description, dependencies, usage | This page |
| Contract structure and interfaces | `contracts/`, especially `contracts/interfaces/IMedTraceGuard.sol` |
| High-level code comments | NatSpec on all interface functions, data types, events, and errors; design document |

## Dependencies

- Node.js **22.13 or newer**, with npm; Git for cloning.
- Solidity compiler **0.8.30**; optimizer 200 runs, via IR, Shanghai EVM target.
- ethers **6.17.0**, React / React DOM **18.3.1**, QRCode **1.5.4**.
- Ganache **7.9.2**, Vite **6.4.5**, React Vite plugin **4.3.4**.
- Exact transitive versions are recorded in `package-lock.json`.
- MetaMask is optional locally and used for public testnet writes. IPFS/Kubo is optional for uploading additional certificates; local sample certificates are included.

## Install and run locally

```bash
git clone https://github.com/hemanth-2104/MedTrace-Guard.git
cd MedTrace-Guard
npm ci
npm start
```

Open **http://127.0.0.1:5173** and keep the terminal running. `npm start` starts a local chain, compiles/deploys the contract when needed, seeds three synthetic batches, and starts the dashboard. Press Control+C to stop. A normal restart reuses `.local-chain/` and `public/deployment.json`; both are generated locally and excluded from Git.

The local demo uses disposable development accounts selected in the dashboard. No wallet, faucet, private key, or external storage account is required for that mode. Sample certificates are in `public/certificates/`.

### Basic workflow

1. Look up a batch and inspect its certificate, custodian, safety status, and history.
2. As Manufacturer, propose shipment of an eligible batch to Distributor.
3. As the named Distributor, accept the pending nonce; custody now changes.
4. Repeat the proposal/acceptance workflow from Distributor to Pharmacy.
5. As Pharmacy, dispense a positive quantity up to the remaining units.
6. Report a simulated out-of-range temperature to create a hold. A Regulator can release a hold with review evidence or permanently recall a batch.

Use an untouched batch such as batch 2 or 3 for the whole workflow. Fresh seeded batch 1 is intentionally held. See the [full project guide](docs/PROJECT_GUIDE.md) and [demo guide](docs/DEMO.md).

## Compile, test, and build

```bash
npm run verify
npm run build:amoy
npm run benchmark
npm run check:interface
```

`verify` compiles contracts, runs the existing automated suites, and builds the frontend. Tests use isolated in-memory chains. `check:interface` checks the documented ABI against the implementation. Benchmark records comparison gas receipts and local read timings. GitHub Actions runs verification on pushes and pull requests.

October 26 evidence records **68 automated tests** and **75 software acceptance checks**, including both real MetaMask custody handoffs on Polygon Amoy. Those acceptance checks are historical demonstrations; fresh publication checks are in [PUBLICATION_CHECKS.md](docs/PUBLICATION_CHECKS.md). Neither count establishes production security or completion of every course deliverable.

## Existing Polygon Amoy demonstration

- Network: **Polygon Amoy**, chain ID **80002**.
- Contract: [0x95DDa069490E8D6B0650A707052598b306C495e2](https://amoy.polygonscan.com/address/0x95DDa069490E8D6B0650A707052598b306C495e2).
- Public configuration: `public/deployment.amoy.json`.

```bash
cp .env.amoy.example .env.amoy.local
npm run dev:amoy -- --port 5176
```

For a fresh clone only, copy the example configuration; preserve existing local configuration. Leave signing-key fields empty for browser use. Open **http://127.0.0.1:5176/?batch=1**. Reads need no wallet; writes require an authorized MetaMask account and test POL. This reuses the existing contract. See [AMOY_LIVE.md](docs/AMOY_LIVE.md). Source hosting on GitHub does not by itself host a running dashboard.

## Repository structure

```text
contracts/          Main implementation, baseline, documented interface
src/                React dashboard and styles
shared/             Certificate, wallet-session, and model helpers
scripts/            Compile, deploy, seed, startup, IPFS, testnet, evaluation
tests/              Contract, certificate, wallet, model, and workflow tests
public/             Synthetic certificates and public Amoy configuration
docs/               Design, setup, proposal, draft reports, verification
evidence/           Historical demonstrations and check outputs
submissions/        Course submission link file and design PDF
.github/workflows/  Automated verification
```

## Scope and remaining course work

This classroom prototype uses synthetic medicine data and simulated temperatures. It does not prove physical authenticity, connect real sensors, certify compliance, or hold patient data. Certificate hashes establish byte consistency, not issuer credibility. Durable remote IPFS pin retention is not established. Ganache development-tool advisories are documented in `evidence/npm-audit.json` and the project guide.

Software acceptance is complete as recorded. Final report layout/review, required videos, actual team agreement, and course uploads remain separate tasks in [COMPLETION_CHECKLIST.md](docs/COMPLETION_CHECKLIST.md). Draft and historical documents retain their status labels.

Private environment files, wallet secrets, dependencies, saved local chain state, duplicate archives, and generated build output are excluded. Configuration examples contain no signing keys.
