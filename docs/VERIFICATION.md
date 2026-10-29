# Current verification status

**75/75 software acceptance checks PASS — 0 failed, 0 untested.** See [the complete 75-row results and evidence](ACCEPTANCE_RESULTS.md). The 68 automated tests are a separate suite, not a partially completed 75-check run.

| Verification | Result | Evidence |
|---|---|---|
| A–J acceptance checklist | 75/75 PASS | [Machine-readable final record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| Automated suites | 58 non-model + 10 model = 68 PASS, 0 failures/skips | [Publication verification log](../evidence/publication-2026-10-29/verify.txt) |
| Contract interface | 31 ABI entries match implementation | [Interface log](../evidence/publication-2026-10-29/interface.txt) |
| Frontend production builds | Default and Amoy PASS | [Default](../evidence/publication-2026-10-29/verify.txt), [Amoy](../evidence/publication-2026-10-29/build-amoy.txt) |
| Baseline/Guard benchmark | PASS, actual receipt gas retained | [Benchmark output](../evidence/publication-2026-10-29/benchmark-run.txt) |
| Public accepted custody | Manufacturer → Distributor → Pharmacy; four status-1 receipts | [Receipt index](AMOY_LIVE.md) |
| Public temperature hold | 11.5 °C report mined; dispensing rejected without state/history changes | [Report](../evidence/amoy-completion-2026-10-26/temperature-hold.json), [Blocked action](../evidence/amoy-completion-2026-10-26/blocked-dispense.json) |
| Public certificate retrieval | Exact 165-byte file MATCH | [Gateway proof](../evidence/amoy-completion-2026-10-26/gateway.json), [App result](../evidence/amoy-completion-2026-10-26/public-match.ax.txt) |
| Phone QR | User confirmed correct batch, Pharmacy custodian, 100 units and hold | [Human confirmation](../evidence/amoy-completion-2026-10-26/phone-check.json) |
| Published content | All final completion evidence matches the completed working project | [Publication audit](../evidence/publication-2026-10-29/completion-audit.json) |

## Latest GitHub verification

The published Linux installation correction passed clean `npm ci`, compilation, interface validation, all 68 tests, both builds and benchmark: [GitHub Actions run](https://github.com/hemanth-2104/MedTrace-Guard/actions/runs/40972025737), commit `8425a3c4f207182479fc0e48b1a76b41c545e78d`. Later pushes rerun the workflow; inspect their individual results on the [Actions page](https://github.com/hemanth-2104/MedTrace-Guard/actions).

## What these results establish

The October 25–26 records are demonstrations of the complete software checklist, including real MetaMask and Amoy actions. Public wallet signatures and phone interactions are not automatically replayed by CI. The unsafe public dispensing attempt was rejected at estimation/read-only execution; no failed mined public receipt is claimed. J7 is user-confirmed rather than an agent-observed phone screenshot.

Permanent public website hosting, indefinite remote IPFS pin retention, physical medicine authenticity, production security certification, report layout/review, recordings and course submission are not established by these checks. The source and local/Amoy startup instructions are complete for the demonstrated scope.

Earlier partial counts and missing-access observations are retained only in [the historical verification log](archive/VERIFICATION_HISTORY.md) and dated evidence files. They do not describe the current software status.
