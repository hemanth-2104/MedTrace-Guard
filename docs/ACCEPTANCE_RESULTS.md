# Final software acceptance results: 75/75 PASS

**75 passed · 0 failed · 0 untested.** This is the completed A–J software acceptance checklist, demonstrated October 25–26, 2026. Repository source, documents and all completion evidence were published on October 29. The 68 automated tests are a separate suite; they do not mean 68 of 75 acceptance checks.

| Verification count | Meaning |
|---|---|
| **75/75 acceptance checks** | Setup, contract behavior, browser interactions, real MetaMask, IPFS, public Amoy workflow, and phone lookup |
| **68/68 automated tests** | 58 contract/certificate/upload/wallet/workflow tests plus 10 model tests |
| **31 interface entries** | Documented functions, events and errors match the implementation |

The current [machine-readable checklist](../evidence/amoy-completion-2026-10-26/checklist-status.json) contains exactly the 75 unique IDs below. Older evidence files retain their original intermediate statuses and dates; they do not override this final result.

## Completed public workflow

- Network: **Polygon Amoy, chain 80002**. [Contract](https://amoy.polygonscan.com/address/0x95DDa069490E8D6B0650A707052598b306C495e2).
- Manufacturer proposal and Distributor acceptance: [proposal receipt](../evidence/amoy-completion-2026-10-26/first-proposal.json), [acceptance receipt](../evidence/amoy-completion-2026-10-26/first-acceptance.json).
- Distributor proposal and Pharmacy acceptance: [proposal receipt](../evidence/amoy-completion-2026-10-26/second-proposal.json), [acceptance receipt](../evidence/amoy-completion-2026-10-26/second-acceptance.json).
- Synthetic 11.5 °C report set a hold: [mined receipt and snapshot](../evidence/amoy-completion-2026-10-26/temperature-hold.json). Dispensing returned `Blocked` and left 100 units and six history entries unchanged: [rejection evidence](../evidence/amoy-completion-2026-10-26/blocked-dispense.json). The rejection occurred during estimation/read-only execution; no failed mined public transaction is claimed.
- The public IPFS gateway returned the exact registered certificate bytes: [MATCH](../evidence/amoy-completion-2026-10-26/gateway.json), [application result](../evidence/amoy-completion-2026-10-26/public-match.ax.txt).
- J7 is supported by [the user’s real phone confirmation](../evidence/amoy-completion-2026-10-26/phone-check.json), rather than an agent-observed phone screenshot. The demonstrated phone URL requires the Mac, preview process and same Wi-Fi; permanent public hosting is not claimed.

These are retained demonstration results, not a claim that wallet signatures, faucets and public services are replayed by every CI run. Final course PDF review, required videos and team submission are separate from the software checklist. Permanent remote IPFS retention remains an operating requirement beyond the recorded retrieval proof.

## Category totals

| Category | Scope | Passed |
|---|---|---:|
| A | Setup, compilation, tests and builds | **6/6** |
| B | Batch registration | **6/6** |
| C | Accepted custody transfers | **10/10** |
| D | Temperature holds | **9/9** |
| E | Recall and expiry | **8/8** |
| F | Dispensing | **6/6** |
| G | Certificates and IPFS | **6/6** |
| H | Accounts and administration | **7/7** |
| I | Browser and history | **10/10** |
| J | Public Amoy and phone QR | **7/7** |

## Every requested check

### A — Setup, compilation, tests and builds

| ID | Result | Verification detail | Evidence |
|---|---|---|---|
| A1 | **PASS** | Solidity compile completed without errors. | [Record](../evidence/publication-2026-10-29/verify.txt) |
| A2 | **PASS** | 19 contract/certificate tests passed; 0 failed, 0 skipped. | [Record](../evidence/publication-2026-10-29/verify.txt) |
| A3 | **PASS** | 10 model tests passed; 0 failed, 0 skipped. | [Record](../evidence/publication-2026-10-29/verify.txt) |
| A4 | **PASS** | Production Vite build completed. | [Record](../evidence/publication-2026-10-29/build-amoy.txt) |
| A5 | **PASS** | Benchmark completed with receipt gas and baseline comparison. | [Record](../evidence/publication-2026-10-29/benchmark-run.txt) |
| A6 | **PASS** | PASS on the refreshed ZIP in a second clean folder: npm ci; npm start; automatic deployment and three seeded batches; public browser lookup and certificate MATCH. See A6-final-install.txt, A6-final-startup.txt, A6-final-browser.txt. | [Record](../evidence/acceptance-2026-10-25/A6-startup.txt) |

### B — Batch registration

| ID | Result | Verification detail | Evidence |
|---|---|---|---|
| B1 | **PASS** | {'batchId': 4} | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| B2 | **PASS** | Reload retained batch 15 details exactly. | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| B3 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| B4 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| B5 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| B6 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |

### C — Accepted custody transfers

| ID | Result | Verification detail | Evidence |
|---|---|---|---|
| C1 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| C2 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| C3 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| C4 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| C5 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| C6 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| C7 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| C8 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| C9 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| C10 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |

### D — Temperature holds

| ID | Result | Verification detail | Evidence |
|---|---|---|---|
| D1 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| D2 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| D3 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| D4 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| D5 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| D6 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| D7 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| D8 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| D9 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |

### E — Recall and expiry

| ID | Result | Verification detail | Evidence |
|---|---|---|---|
| E1 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| E2 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| E3 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| E4 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| E5 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| E6 | **PASS** | Refreshed lookup of batch 10 reports Expired after EVM time advance. | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| E7 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| E8 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |

### F — Dispensing

| ID | Result | Verification detail | Evidence |
|---|---|---|---|
| F1 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| F2 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| F3 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| F4 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| F5 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| F6 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |

### G — Certificates and IPFS

| ID | Result | Verification detail | Evidence |
|---|---|---|---|
| G1 | **PASS** | Downloaded exact registered bytes returned MATCH. | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| G2 | **PASS** | Modified contents of the same registered certificate returned MISMATCH. | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| G3 | **PASS** | Renamed byte-identical certificate returned MATCH. | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| G4 | **PASS** | Certificate unavailable: server returned an HTML page; integrity is unverified. | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| G5 | **PASS** | PASS: real Kubo recursive pin; actual CID stored on local proof and Amoy batch 1. | [Record](../evidence/ipfs/proof.json) |
| G6 | **PASS** | PASS: actual public gateway returns exact 165-byte certificate; React MATCH on Amoy. | [Record](../evidence/amoy-completion-2026-10-26/gateway.json) |

### H — Accounts and administration

| ID | Result | Verification detail | Evidence |
|---|---|---|---|
| H1 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| H2 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| H3 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| H4 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| H5 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| H6 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |
| H7 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |

### I — Browser and history

| ID | Result | Verification detail | Evidence |
|---|---|---|---|
| I1 | **PASS** | Public viewer read batch/history and checked certificate without a wallet. | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| I2 | **PASS** | [{'value': '0', 'validation': {'message': 'Value must be greater than or equal to 1.', 'valid': False}, 'notice': 'Read-only connection ready. No wallet needed for lookup.'}, {'value': '-1', 'validation': {'message': 'Value must be greater than or equal to 1.', 'valid': False}, 'notice': 'Read-only connection ready. No wallet needed for lookup.'}, {'value': '', 'validation': {'message': '', 'valid': True}, 'notice': 'Enter a positive numeric batch ID.'}, {'value': 'abc', 'actualInput': '', 'notice': 'Enter a positive numeric batch ID.'}] | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| I3 | **PASS** | {'notice': 'Confirmed: 0x002ae35a204b1b0a95283fab45dc0f80d704d8ceb05a34b336a29411f6a6aa88', 'historyEntries': 27} | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| I4 | **PASS** | Duplicate pending shipment rejected with Invalid shipment; batch details and 27 history entries unchanged. | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| I5 | **PASS** | Second tab and refreshed first tab show identical batch metadata, custody, and quantity. | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| I6 | **PASS** | PASS: actual Brave MetaMask account/network changes clear signing identity; reconnect required; evidence/metamask-live. | [Record](../evidence/metamask-live/proof.json) |
| I7 | **PASS** | PASS: actual MetaMask transaction rejection preserved count/history and restored UI; evidence/metamask-live. | [Record](../evidence/metamask-live/proof.json) |
| I8 | **PASS** | {'error': 'Cannot reach blockchain RPC. Start the chain, then reload the dashboard.', 'falseSuccess': False, 'isolatedRpcActuallyStopped': True, 'recovery': 'Chain restarted; reload restored public lookup.'} | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| I9 | **PASS** | {'batchIds': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], 'historyPageCounts': [20, 6], 'roundTripSame': True} | [Record](../evidence/amoy-completion-2026-10-26/checklist-status.json) |
| I10 | **PASS** | Assertions passed | [Record](../evidence/acceptance-2026-10-25/contract-checks.json) |

### J — Public Amoy and phone QR

| ID | Result | Verification detail | Evidence |
|---|---|---|---|
| J1 | **PASS** | PASS: successful actual Amoy deployment receipt, evidence/amoy-live/deploy-receipt.json. | [Record](../evidence/amoy-live/deploy-receipt.json) |
| J2 | **PASS** | PASS: exact deployed runtime/creation bytecode match, evidence/amoy-live/bytecode-verification.json. | [Record](../evidence/amoy-live/bytecode-verification.json) |
| J3 | **PASS** | PASS: four distinct role assignments and batch registration through actual MetaMask; dashboard reads state. | [Record](../evidence/amoy-live/register-receipt.json) |
| J4 | **PASS** | PASS: four status-1 receipts; Manufacturer→Distributor→Pharmacy; nonce 1 then 2; sender custody retained until acceptance; pending cleared. | [Record](../evidence/amoy-completion-2026-10-26/second-acceptance.json) |
| J5 | **PASS** | PASS: held Pharmacy dispensing returned Blocked (0xa5baf151) during estimation and public eth_call; quantity/history unchanged; not a mined failed receipt. | [Record](../evidence/amoy-completion-2026-10-26/blocked-dispense.json) |
| J6 | **PASS** | PASS: wallet-free public React/CLI lookup; public IPFS MATCH. | [Record](../evidence/amoy-completion-2026-10-26/public-reader.txt) |
| J7 | **PASS** | User confirmed real phone on same Wi-Fi displays correct Amoy batch, Pharmacy custodian, 100/100 units and Temperature hold. See phone-check.json; no permanent hosting claim. | [Record](../evidence/amoy-completion-2026-10-26/phone-check.json) |
