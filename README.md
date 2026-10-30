# MedTrace Guard

**Pharmaceutical Provenance with Accepted Custody and Safety Gates**

MedTrace Guard is a Solidity and React application for tracking medicine batches from manufacturer to distributor to pharmacy.

Custody changes only when the intended recipient accepts a shipment. Smart contracts block transfers and dispensing when a batch is recalled, expired, under an unresolved temperature hold, or fully dispensed. Certificate files remain off-chain, and the dashboard compares their SHA-256 fingerprints with the values registered on-chain.

## Features

- **Recipient-confirmed custody:** transfers require a proposal from the current custodian and acceptance by the named recipient.
- **Transfer safeguards:** recipient roles, deadlines, and proposal nonces prevent invalid or stale handoffs.
- **Safety restrictions:** recalled, expired, held, or exhausted batches cannot continue through the distribution workflow.
- **Persistent temperature holds:** an out-of-range report creates a hold that requires regulator review to release.
- **Quantity tracking:** pharmacies can dispense partial quantities without exceeding the remaining inventory.
- **Certificate verification:** exact file bytes are checked against the registered SHA-256 fingerprint.
- **Public lookup:** batch details, safety status, and history can be viewed without connecting a wallet.
- **QR links:** each batch has a link to its verification page.
- **Role-based permissions:** manufacturer, distributor, pharmacy, regulator, and administrator capabilities are enforced by the contract.
- **Local and testnet operation:** run a local demonstration or connect to the existing Polygon Amoy deployment.

## Architecture

The application has three main components:

| Component | Responsibility |
|---|---|
| React dashboard | Batch lookup, role-based actions, wallet connection, certificate verification, and custody timelines |
| Solidity smart contracts | Role permissions, custody transfers, quantity accounting, safety restrictions, and history |
| Off-chain certificate storage | Certificate files stored on IPFS or served locally during development |

The dashboard uses ethers.js for contract interactions. Public reads use an RPC connection, while browser transactions on Amoy require MetaMask approval.

See the [technical design](docs/SMART_CONTRACT_DESIGN.md), [documented interface](contracts/interfaces/IMedTraceGuard.sol), [main contract](contracts/MedTraceGuard.sol), and [comparison baseline](contracts/MedTraceBaseline.sol).

## Requirements and dependencies

- Node.js **22.13 or newer**, with npm.
- Git for cloning the repository.
- Solidity compiler **0.8.30**, with optimizer 200 runs, via IR, and Shanghai EVM target.
- ethers **6.17.0**.
- React and React DOM **18.3.1**.
- QRCode **1.5.4**.
- Ganache **7.9.2**.
- Vite **6.4.5** and React Vite plugin **4.3.4**.

Dependencies are installed through npm. Exact dependency versions are recorded in `package-lock.json`.

MetaMask is optional for the local demo and required for browser transactions on Amoy. IPFS/Kubo is optional for uploading additional certificates; local sample certificates are included.

## Quick start

```bash
git clone https://github.com/hemanth-2104/MedTrace-Guard.git
cd MedTrace-Guard
npm ci
npm start
```

Open **http://127.0.0.1:5173** and keep the terminal running.

`npm start` starts the local blockchain, compiles and deploys the contract when needed, seeds three synthetic batches on a fresh deployment, and starts the dashboard.

Press **Control+C** to stop.

A normal restart reuses `.local-chain/` and `public/deployment.json`. These files are generated locally and excluded from Git.

The local demo uses disposable development accounts selected in the dashboard. You do not need MetaMask, faucet tokens, or an external storage account for this mode.

## Using the application

### Inspect a batch

Select a batch from the registry or enter its numeric ID in the lookup field.

The verification panel displays:

- Manufacturer and current custodian.
- Production and expiry dates.
- Registered and remaining quantities.
- Allowed temperature range.
- Current safety eligibility.
- Certificate locator and SHA-256 fingerprint.
- Custody and safety history.

Safety eligibility does not grant permission to act. The contract also checks the caller’s role, custody, lifecycle stage, and pending transfer.

### Transfer custody

1. Select the **Manufacturer** account.
2. Propose shipment of an eligible batch to the **Distributor** address.
3. Switch to the named Distributor account.
4. Accept the pending shipment using its nonce.
5. Confirm that custody changes to Distributor.
6. Repeat the proposal and acceptance process from Distributor to **Pharmacy**.

A proposal alone does not change custody.

Use an untouched batch, such as batch 2 or 3 on a fresh deployment. Seeded batch 1 is intentionally held.

### Dispense units

After the Pharmacy accepts custody, dispense a positive whole-number quantity up to the remaining inventory.

Partial dispensing reduces the remaining quantity. Dispensing the final units marks the batch as fully dispensed.

### Apply and review safety restrictions

An authorized temperature report outside the batch’s permitted range creates a hold. A later in-range reading does not clear it.

A **Regulator** can release the hold with review evidence or permanently recall the batch. Releasing a hold does not override expiry, recall, or exhausted inventory.

See the [project guide](docs/PROJECT_GUIDE.md) and [demo walkthrough](docs/DEMO.md) for detailed instructions.

## Certificate verification

The contract stores a certificate locator and SHA-256 fingerprint. Certificate contents remain off-chain.

The dashboard supports two verification methods:

1. Retrieve the certificate from its registered location and compare its bytes.
2. Select a downloaded file and compare its bytes locally.

Results distinguish between:

- **MATCH:** the bytes match the registered fingerprint.
- **MISMATCH:** the bytes differ from the registered fingerprint.
- **Unavailable/unverified:** the certificate could not be retrieved or checked.

Renaming a file without changing its contents preserves its fingerprint. Editing its contents produces a different fingerprint.

The registration form calculates the file’s fingerprint; it does not automatically upload or pin the file. Upload it separately and register the resulting `ipfs://CID`, or use a local sample under `public/certificates/`.

## Testing and evaluation

```bash
npm run verify
npm run check:interface
npm run build:amoy
npm run benchmark
```

| Command | Purpose |
|---|---|
| `npm run verify` | Compile contracts, run automated suites, and build the frontend |
| `npm run check:interface` | Check that the documented interface matches the implementation ABI |
| `npm run build:amoy` | Build the frontend using Amoy configuration |
| `npm run benchmark` | Record baseline and Guard gas measurements and local read timings |

Contract tests use isolated in-memory chains rather than the saved local demonstration.

Recorded verification includes **68 passing automated tests** and **75 completed software acceptance checks**. See the [publication checks](docs/PUBLICATION_CHECKS.md) and [acceptance evidence](docs/COMPLETION_CHECKLIST.md) for dates, procedures, and limitations.

GitHub Actions runs compilation, interface checks, automated tests, frontend builds, and benchmarking on pushes and pull requests.

The baseline provides a simpler comparison with fewer controls and less stored data. Gas differences represent the cost of the complete designs, rather than the isolated cost of one feature. Local read timings do not measure public-network throughput.

## Polygon Amoy deployment

- **Network:** Polygon Amoy
- **Chain ID:** `80002`
- **Gas token:** test POL
- **Contract:** [0x95DDa069490E8D6B0650A707052598b306C495e2](https://amoy.polygonscan.com/address/0x95DDa069490E8D6B0650A707052598b306C495e2)
- **Public configuration:** `public/deployment.amoy.json`

On first setup, copy the example configuration:

```bash
cp .env.amoy.example .env.amoy.local
```

Preserve an existing `.env.amoy.local` instead of overwriting it. Leave signing-key fields empty when using MetaMask for browser transactions.

Start the Amoy dashboard:

```bash
npm run dev:amoy -- --port 5176
```

Open **http://127.0.0.1:5176/?batch=1**.

This connects to the existing deployed contract. Reads require no wallet. Writes require an authorized MetaMask account on Amoy with enough test POL for transaction fees.

See the [Amoy setup and deployment guide](docs/AMOY_LIVE.md) for details.

GitHub hosts the source code. The commands above run the dashboard on your computer. QR access from another device requires a reachable frontend and read RPC.

## Repository structure

```text
contracts/          Main contract, comparison baseline, and documented interface
src/                React dashboard and styles
shared/             Certificate, wallet-session, and model helpers
scripts/            Startup, compilation, deployment, IPFS, and evaluation
tests/              Contract, certificate, wallet, model, and workflow tests
public/             Sample certificates and public Amoy configuration
docs/               Technical design, setup guides, and verification notes
evidence/           Recorded transactions, test outputs, and measurements
.github/workflows/  Automated verification
```

## Limitations

MedTrace Guard is an educational prototype using synthetic medicine records and simulated temperature reports.

- Recorded provenance does not establish the physical authenticity or quality of medicine.
- Certificate fingerprints establish byte consistency, not the credibility of the issuer.
- Temperature reports are authorized submissions, not independently verified sensor readings.
- Stakeholder onboarding, account security, and regulator decisions remain trusted parts of the system.
- Public-chain metadata is visible to network participants.
- IPFS availability depends on continued storage and pinning; durable remote retention is not established.
- The workflow supports one manufacturer-to-distributor-to-pharmacy route per batch, with partial dispensing.
- The prototype does not include batch splitting, returns, payments, patient records, or regulatory certification.
- Passing tests does not constitute a production security audit.

Ganache development-tool dependency advisories are documented in `evidence/npm-audit.json` and the [project guide](docs/PROJECT_GUIDE.md).

## Configuration and secrets

Private environment files, wallet keys, local chain state, dependencies, and generated build files are excluded from Git.

Configuration examples contain no signing keys. Keep private keys and recovery phrases out of the repository and frontend configuration.

## Static analysis and security review

The October 29 hardening update adds six file-boundary regression tests, bringing the current automated suite to **74 passing tests**. The dated 75-check acceptance record is a separate functional demonstration, not a security certification or a Sonar gate result. See [the security findings and corrections](docs/SONAR_REVIEW.md), [GitHub verification](https://github.com/hemanth-2104/MedTrace-Guard/actions), and the [actual Sonar quality gate](https://sonarcloud.io/dashboard?id=hemanth-2104_MedTrace-Guard).

Sonar verified commit `404d9d2` with a **Passed quality gate**, **0 security issues**, **0 reliability issues**, and **A/A/A ratings**. There are 82 remaining low-priority sequential-await maintainability findings. Coverage is not configured. The review includes the analysis revision, API results and dashboard screenshot.
