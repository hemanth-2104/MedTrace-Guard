# Completion checklist

Rechecked October 26, 2026 (America/Phoenix).

**Software coverage: 75/75 checks passed, zero unresolved failures or untested IDs. J7 (actual phone QR scan) is user-confirmed. Course report review, videos and team submission are separate deliverables.**

| Requested item | Status | Evidence or missing work |
|---|---|---|
| Permissions, transfer, dispensing, expiry, hold, recall contract tests | PASS locally | 14 EVM contract tests; combined suite totals 68, including isolated wallet and workflow tests |
| Manufacturer → distributor → pharmacy with recipient acceptance | PASS locally and on actual Amoy | Four successful MetaMask transaction receipts; custody stays with sender at proposal, changes only at acceptance; nonces 1 and 2, five ordered entries |
| Held/recalled/expired batches blocked | PASS locally | 15 deliberately submitted transactions mined with reverted status: both proposal routes, both receipt stages, and dispensing for each condition; state/history unchanged |
| Original certificate MATCH; modified file MISMATCH | PASS locally | Browser verified both against batch 4's registered digest; original fixture unchanged |
| Frontend production build | PASS | Vite production build succeeded |
| Public testnet deployment and workflow | PASS | Chain 80002, matching bytecode, four roles, registration, both accepted handoffs, wallet-free lookup, public IPFS MATCH, and held-batch dispensing rejection. See `AMOY_LIVE.md`. |
| Actual IPFS storage/retrieval | PASS using real Kubo and public gateways | Actual CID pinned, registered on a disposable local contract, retrieved through React, and MATCH verified. Public Pinata and Filebase retrieval returned the exact bytes; the application returned MATCH through Pinata. Permanent remote retention remains unverified. |
| Baseline comparison and gas evaluation | PASS locally | Benchmark reran successfully; raw receipts, unsafe-dispense results, and 10/50/100-batch read measurements retained |
| README | UPDATED | Setup, repeat startup, roles, demo walkthrough, tests, limitations, troubleshooting |
| Technical report | PARTIAL | Title, roster, local measurements, actual public custody gas and validation updated. IEEE source compiled successfully on October 26; final PDF, 4–8 page requirement and visual layout still need validation. |
| Required demo videos | MISSING | `docs/DEMO.md` contains scripts; no MP4, MOV, or WebM recordings were found. No published video link is supplied. |

## Evaluation observations

Baseline registration: 117,426 gas. Guard registration: 348,313 gas. A complete baseline handoff costs 31,223 gas; Guard proposal plus acceptance costs 359,857 gas. The baseline accepted post-expiry and post-recall dispensing; Guard rejected both. This baseline deliberately has weaker rules and less stored data, so this is a total design-cost comparison, not a per-feature gas ablation.

The October 25 local benchmark measured median paged-history reads of 2.802 ms at 10 batches, 2.735 ms at 50, and 2.680 ms at 100 (10 trials each). These are local timings, not public-network performance. Raw values are in `evidence/recheck-2026-10-25/benchmark.json`.

## What is still required before calling the complete checklist finished

1. Software checklist A–J is complete. Preserve the receipts and configure reachable hosting again when repeating a phone demonstration; the temporary LAN preview requires the Mac and same Wi-Fi.
2. Preserve or recreate the verified Kubo pin. Public Pinata/Filebase retrieval and application MATCH now pass; arrange durable remote pin retention if required after this computer goes offline.
3. Export the updated IEEE report, inspect every page, confirm the required page count, and complete team review against the actual course rubric.
4. Record the required 5-minute interim and 7–10-minute final demonstrations described in `docs/DEMO.md`; verify their duration, playback, and required content. A screenshot or launch animation does not replace these recordings.
5. Complete the actual team agreement and any required repository, video-link, and course submissions.

## Recheck evidence

- `evidence/recheck-2026-10-25/verification.txt`: 27 passing tests and production build.
- `evidence/recheck-2026-10-25/benchmark-run.txt`, `benchmark.json`, `gas.csv`: rerun measurements.
- `evidence/recheck-2026-10-25/live-smoke-run.txt`, `live-smoke.json`: live localhost HTTP/RPC/certificate checks.
- `evidence/recheck-2026-10-25/certificate-check.json`, `certificate-match.jpg`, `certificate-mismatch.jpg`: exact original and modified-certificate results.
- `evidence/recheck-2026-10-25/ipfs-service.json`: Kubo connection result.
- `evidence/recheck-2026-10-25/report-compilation.json`: report source compilation result and its limits.

The previously recorded Ganache dependency advisories remain a limitation of the local development tooling. This recheck does not establish production security or physical medicine authenticity.

## Historical three-agent integration checkpoint (superseded below)

MetaMask, IPFS, and public-testnet agents worked in parallel; root combined their code and tested the shared application. The latest suite passed 68 tests with zero failures/skips and a successful production build. G5/G6 now pass with real Kubo, a local-chain CID registration, and React browser retrieval. Checklist status is 66/75 passed; I6/I7 and J1–J7 remain unverified. See `evidence/integration/`, `docs/METAMASK.md`, `docs/IPFS.md`, and `docs/TESTNET.md`. No public deployment success is claimed.

## Historical Brave / MetaMask and public IPFS recheck (superseded below)

I6/I7 passed using the actual extension: approved registration receipt status 1, cancelled registration with no additional transaction or state/history change, account change clearing identity, and connected-site network change clearing identity. Evidence is in `evidence/metamask-live/`. Public gateway retrieval and browser MATCH passed (`evidence/live-checks-2026-10-25/`). The updated checklist is **68/75 passed, 0 failures, 7 not tested (J1–J7)**. J7 remains outside the local demonstrated scope. Amoy deployment and public workflow remain pending faucet test POL; no public receipts are claimed.

## Historical Amoy deployment follow-up (superseded below)

J1/J2/J3/J5/J6 now pass with actual public evidence. J5 used a real read-only call rejecting an unsafe direct Manufacturer → Pharmacy route (`InvalidTransfer`), with unchanged state/history; no failed mined receipt is claimed. Coverage is **73/75 passed**, zero outstanding implementation-test failures, with **J4 pending Manufacturer faucet funding** and **J7 outside the localhost hosting demonstration**. The public certificate returned MATCH. `npm run verify` passed 68 tests and production build after the public-RPC batching fix; `npm run build:amoy` also passed. Exact receipts and current limitations are in `evidence/amoy-live/` and `AMOY_LIVE.md`.

## Completed public custody and safety checks — October 26

The normal official faucet claim succeeded after its cooldown, adding 0.1 Amoy test POL. Manufacturer and Distributor each received 0.02; Pharmacy received 0.01 for the safety demonstration. Actual MetaMask signatures completed both proposals and both named-recipient acceptances. Independent RPC reads and status-1 receipts confirm Pharmacy custody, 100 units, cleared pending shipment, and five ordered entries. A synthetic 11.5 °C Pharmacy report then set a hold; dispensing returned `Blocked` and left quantity and six-entry history unchanged. That rejection occurred during gas estimation and an independently repeated public `eth_call`, not as a mined failed transaction.

The public gateway and app again returned MATCH. `npm run verify` passed all 68 automated tests with zero failures/skips and a production build; `npm run build:amoy` also passed. Current evidence is `evidence/amoy-completion-2026-10-26/`. The user confirmed J7 on a real phone, with the correct batch, Pharmacy custodian, quantity and hold. This completes **75/75** checks. `phone-check.json` preserves the user confirmation and LAN-hosting limits. Earlier funding blockers above are historical and resolved.
