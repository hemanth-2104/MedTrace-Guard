# MedTrace Guard verification record

**Current result — October 26, 2026:** 75/75 acceptance checks passed; 68/68 automated tests passed with no failures/skips; default and Amoy builds passed. Real MetaMask completed both public Amoy handoffs and a safety hold; blocked dispensing preserved state; public IPFS MATCH and user-confirmed phone lookup passed. See [the current Amoy guide](AMOY_LIVE.md) and `evidence/amoy-completion-2026-10-26/`.

The dated sections below retain earlier verification stages for audit history. Their earlier pending/unverified statements are superseded by the October 26 section at the end. Report source compiled successfully on October 26; final exported PDF layout, recordings and team submission remain separate.

Verified October 25, 2026 (America/Phoenix), on macOS Apple Silicon, Node.js v26.9.0, npm 11.19.1. This supersedes the original ZIP's limited authoring verification. The supplied Word proposal defines the title: **MedTrace Guard: Pharmaceutical Provenance with Accepted Custody and Safety Gates**.

## Results

| Check | Result | Evidence |
|---|---|---|
| Clean dependency installation from lockfile | Passed | `npm ci` in a separate temporary directory, 447 packages installed |
| Solidity compilation | Passed | solc 0.8.30, optimizer 200, viaIR, Shanghai; `evidence/local-verification.txt` |
| EIP-170 deployed bytecode limit | Passed | Guard 10,610 bytes; baseline 1,742 bytes; limit 24,576 |
| EVM contract integration/negative tests | 14 passed | Registration, permissions, custody, nonce, deadline, revocation, quantity, temperature, recall, expiry, history |
| Exact-byte certificate tests | 5 passed | SHA-256 vector, changed/reformatted bytes, locator restrictions |
| Independent model tests | 10 passed | Includes 200 deterministic partial-dispensing traces |
| Total automated tests | 29 passed, 0 failed | `evidence/local-verification.txt` |
| JavaScript syntax | 19 modules passed | `evidence/node-syntax.txt`; JSX checked by Vite build |
| React production build | Passed | Vite 6.4.5; build output recorded in verification log |
| Local deployment and seed | Passed | Real Ganache RPC, chain 31337; seeded three batches |
| Browser registration | Passed | Certificate selected/hashed in browser; `BROWSER-4` created, 100 units |
| Browser accepted custody | Passed | Batch 2 manufacturer → distributor → pharmacy; proposal alone preserved custody; acceptance used nonces 1 and 2 |
| Browser partial dispensing | Passed | 100 → 90 units; after regulator release, 90 → 80 units |
| Browser temperature hold | Passed | 11.5 °C held batch; 5 °C did not clear hold; dispensing rejected |
| Browser regulator release | Passed | Review digest accepted; dispensing resumed |
| Browser permanent recall | Passed | Batch 2 recalled; further dispensing rejected; quantity remained 80 |
| Browser certificate verification | Passed | Downloaded fixture MATCH; different uploaded fixture MISMATCH |
| Simulated-temperature CLI | Passed | Batch 4 received a normal 5 °C reading; exact evidence retained under `evidence/telemetry/` |
| Public view and QR | Passed locally | No wallet needed; batch-specific URL and QR visible |
| Saved chain restart | Passed | Stopped/restarted `npm start`; same deployment, four records and batch 2's recalled/80-unit state retained |
| Live HTTP/RPC/certificate smoke checks | Passed | `npm run smoke`; `evidence/live-smoke.json` and `evidence/live-smoke-run.txt` |
| Offline preview routes/file restrictions | 6 passed | `evidence/preview-http.txt`; root/model/style allowed; .env/package/traversal denied |
| Gas, unsafe-dispense, growth benchmark | Passed | `evidence/benchmark.json`, `evidence/gas.csv`, `evidence/benchmark-run.txt` |

Browser checks were carried out interactively in the Codex in-app browser. They are a manual integration record, not a committed automated browser suite. `evidence/dashboard.jpg` shows the running renamed app. The contract tests exercise their scenarios on isolated chains; the 200 random traces exercise the independent model, not Solidity.

## Measured local benchmark

| Operation | Gas |
|---|---:|
| Baseline registration | 117,426 |
| Baseline one-step handoff | 31,223 |
| Guard registration | 348,313 |
| Guard handoff proposal | 201,831 |
| Guard handoff acceptance | 158,026 |
| Guard complete handoff (sum) | 359,857 |
| Guard temperature hold | 134,410 |
| Guard regulator release | 109,393 |
| Guard recall | 136,027 |

The baseline allowed dispensing after expiry and recall; Guard rejected both. The baseline deliberately implements a weaker specification. It stores less metadata/history, so this compares total design costs, not the isolated cost of recipient acceptance.

Median paged-history reads over 10 trials were 2.802 ms at 10 batches, 2.735 ms at 50, and 2.680 ms at 100. These are a single in-process local run from the October 25 recheck, not public-network throughput, latency guarantees, or monetary cost estimates. Raw JSON retains unrounded values.

## Fixes made during this verification

- Renamed the app, package, Solidity contract names/files, scripts/tests, and editable documentation to MedTrace Guard, matching the supplied proposal.
- Added `npm start` to start the chain, reuse/deploy the contract, seed when empty, and run React from one terminal.
- Saved the local chain to `.local-chain/` with deterministic disposable accounts, so normal restarts preserve state.
- Corrected an actual test failure after hold release: ethers' short-lived RPC cache reused an earlier failed gas estimate. Disabled low-level caching for these providers. The existing hold/release test then passed, and browser rejection → release → successful dispensing was verified. The [ethers provider documentation](https://docs.ethers.org/v6/api/providers/abstract-provider/) describes this synchronous-test-chain limitation.
- Decoded contract rejection data into useful dashboard messages instead of displaying only `missing revert data`.
- Cleared stale certificate registration hashes on file changes; corrected empty-registry counts and cleared unknown-batch history totals.
- Removed the external Google Fonts dependency.
- Installed patched ethers 6.17.0 and Vite 6.4.5 and overrode solc's tmp helper to 0.2.7. Kept compiler 0.8.30 to match the contracts' exact pragma.
- Included a dependency lockfile, changed CI to `npm ci`, added `npm run verify` and `npm run smoke`, and replaced the README with repeatable setup/demo/troubleshooting instructions.

## Remaining boundaries

- **33 dependency audit findings remain**, all within Ganache's dependency tree: 1 low, 5 moderate, 22 high, 5 critical. `evidence/npm-audit.json` contains the advisory details. Compatible fixes were applied; Ganache's bundled dependencies are not repaired by routine audit fixes. A forced downgrade was not applied. Keep this unlocked development chain on localhost and treat this as a classroom prototype, not production.
- Ganache's native µWS binary was unavailable for Node 26, so it used its Node.js fallback. The tested flows passed with that fallback. A Ganache listener-count warning was also observed during the long browser session.
- No live Kubo/IPFS upload, public IPFS gateway retrieval, hosted pinning, MetaMask wallet signing, or Polygon Amoy/Sepolia deployment was verified. These require external services or accounts. The local certificate workflow was verified.
- No public hosting was performed. The running website is reachable on this computer at http://127.0.0.1:5173. Local QR URLs do not work on another device.
- The IEEE report source compiled successfully with the desktop editor compiler on October 25. No newly exported final PDF or final page-by-page layout review was completed. Original PDF snapshots under `docs/archive/` remain historical files with their original branding.
- The original Word proposal and ZIP remain unchanged in the parent folder. Team agreement, course submission, repository upload, and recordings are not completed by these checks.

## Repeat the checks

```bash
npm ci
npm run verify
npm run benchmark
```

For the real website, run `npm start` and keep it running; then, in another terminal, run `npm run smoke`. Browser checks can be repeated using the README walkthrough. Tests passing establishes these tested local behaviors; it is not a security audit or proof of physical medicine authenticity.

## October 25 completion recheck

Three new EVM safety-matrix tests cover manufacturer and distributor proposals, distributor and pharmacy acceptance, and pharmacy dispensing for held, recalled, and expired batches. All 15 actions were valid before the safety condition. Afterward, each returned the contract's `Blocked` error and was forced into a mined transaction with receipt status 0. Batch data, history, and pending state did not change. The expanded total is 14 contract + 3 certificate + 10 model tests = 27 passing tests.

The running browser returned MATCH for the original certificate and MISMATCH for a modified copy of that same file. The original fixture was kept unchanged. The local Kubo version endpoint refused the connection (`ECONNREFUSED`); no `ipfs` executable or testnet `.env` configuration was found. No MP4/MOV/WebM demo files were found in this workspace. See [COMPLETION_CHECKLIST.md](COMPLETION_CHECKLIST.md) and `evidence/recheck-2026-10-25/` for this audit.

## Full A–J acceptance run

See `evidence/acceptance-2026-10-25/results.txt` for all 75 IDs: 64 passed, zero remaining failures, eleven not tested. The unit/integration suite is now 29 passing tests (14 contract, 5 certificate, 10 model), with zero failures or skipped tests. The dedicated destructive acceptance driver verified 45 contract checklist IDs on a fresh extracted disposable chain. Browser checks verified persistence, public access, invalid IDs, confirmations/errors, second-tab consistency, expired lookup, all 17 registry records, all 26 history entries, certificate rename/tampering/unavailability, updated role display, and RPC outage/recovery.

G4 initially failed because a missing certificate URL returned the SPA HTML with HTTP 200 and showed MISMATCH. The frontend now rejects that response as unavailable/unverified, with regression coverage. I6/I7 require actual MetaMask testing and remain untested; G5/G6 and all J checks remain unverified. Your original saved chain is kept separate from the destructive acceptance data.

## Combined three-agent integration

The wallet, IPFS, and testnet lanes were combined after a checksum-verified baseline checkpoint. Final verification passed 58 non-model tests and 10 model tests, with zero failures or skips, plus the Vite production build. Breakdown: 14 contract, 8 certificate, 3 upload-helper, 28 simulated EIP-1193 wallet-session, 5 isolated testnet-workflow, and 10 model tests.

Real Kubo add/pin and exact-byte local gateway retrieval passed. Root registered the actual CID on a disposable local EVM and used the integrated React Check certificate bytes action to retrieve MATCH. Explicit local signing and safe handling of an unavailable MetaMask provider passed in the browser. Original four records, administrator, recalled batch 2, and its 80 remaining units were preserved.

Actual public Amoy read-only RPC reached block 51094095 on chain 80002. No public writes or deployed contract exist. MetaMask was not installed in the checked browser, and no funded test-wallet configuration was provided. These remain genuine live-check blockers. Public ipfs.io connectivity failed separately; local Kubo success is not proof of remote gateway availability. All relevant outputs are under `evidence/integration/`, `evidence/ipfs/`, `evidence/metamask/`, and `evidence/testnet/`. G5/G6 moved to passed; I6/I7 and J1–J7 remain unverified.

## Actual MetaMask and public gateway follow-up

Brave's installed MetaMask extension passed genuine connection, approved registration, rejected registration, account change/reconnection, and connected-site network change checks. These used isolated local chain 31337 at port 18546. Receipt status 1 and exact approved hash are saved in `evidence/metamask-live/approved-receipt.json`; `proof.json` records batch count 2, one history entry, and only one transaction from the MetaMask account after the rejection. I6/I7 now pass; the updated checklist is **68/75 passed**, with J1–J7 still not tested on public Amoy.

Public Pinata and Filebase IPFS gateways returned the exact 165-byte registered certificate; React returned MATCH through Pinata, including for the batch registered via MetaMask. See `evidence/live-checks-2026-10-25/` and `docs/IPFS.md`. This supersedes earlier public-gateway failure and missing-extension observations while preserving those historical evidence files. Amoy was added to MetaMask, but Account 1 had zero test POL at the live balance check. No public contract has been deployed or public receipts recorded.

## Actual public Amoy deployment

The user supplied faucet test POL and approved source upload to Remix. MetaMask deployed MedTraceGuard on actual chain 80002 at `0x95DDa069490E8D6B0650A707052598b306C495e2`. Deployment status 1, exact creation/runtime bytecode match, four distinct stakeholder roles, and batch #1 registration are verified. Public dashboard lookup, wallet-free CLI reading, and IPFS MATCH passed. A direct Manufacturer → Pharmacy route returned InvalidTransfer via actual Amoy eth_call with unchanged state/history. Receipts and screenshots are under `evidence/amoy-live/`.

The first public shipment has not been broadcast: Manufacturer funding fell to approximately 0.00388365 test POL and needs a top-up. J4 remains pending and J7 is outside local hosting scope; updated checklist coverage is 73/75. No held-batch public workflow or failed mined receipt is claimed. The initial public endpoint exposed batching failures and intermittent 500 responses; batching was disabled, public polling adjusted, and the verified PublicNode endpoint selected. The complete automated suite passed 68 tests, zero failures/skips, plus default and Amoy production builds. See AMOY_LIVE.md for exact transaction links and reproduction steps.

## Public custody completed — October 26, 2026

This supersedes the earlier pending-funding observations. The official faucet provided 0.1 Amoy test POL. Four actual MetaMask transactions completed Manufacturer → Distributor → Pharmacy with named-recipient acceptance, sender custody preserved during each proposal, distinct nonces, and five ordered immutable entries. A Pharmacy report of 11.5 °C created a hold. The dashboard rejected one-unit dispensing with `Action blocked: check recall, expiry, temperature hold, and remaining units.` Independent Amoy `eth_call` returned custom error `Blocked` (`0xa5baf151`); state and six-entry history were unchanged. No failed mined receipt is claimed.

Public gateway HTTP 200 returned the exact 165 bytes and SHA-256, and the dashboard showed MATCH. Final compile, 58 non-model tests, ten model tests, and default/Amoy production builds all passed with zero failures/skips. Exact transaction hashes, raw receipts, snapshots, gas used, gateway result, and browser evidence are in `evidence/amoy-completion-2026-10-26/`; see `AMOY_LIVE.md`. Checklist coverage is **75/75**, with J7 supported by the user’s actual phone confirmation (`phone-check.json`); no permanent hosting claim is made. Course reports/videos and permanent remote pin retention are distinct from these software checks.
