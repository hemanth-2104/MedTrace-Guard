# Evaluation

## Recorded verification

The current automated suite contains **74 passing tests**: 64 contract, certificate, IPFS, wallet, workflow and file-boundary tests plus 10 independent model tests. The six file-boundary regressions were added on October 29; earlier October 25–26 and initial publication logs contain 68 tests. Test counts are separate from the **75 A–J software acceptance checks** completed on October 26.

- [Current tests and default build](../evidence/sonar-review-2026-10-29/clean-verify.txt), [Amoy build](../evidence/sonar-review-2026-10-29/clean-build-amoy.txt), and [verification summary](VERIFICATION.md).
- [Complete acceptance results](ACCEPTANCE_RESULTS.md), including real MetaMask and user-confirmed phone lookup.
- [Recorded Amoy demonstration and receipt hashes](AMOY_LIVE.md): chain 80002, deployment and roles, registration, both accepted handoffs, a temperature hold, and dispensing blocked without state/history changes.
- [Public certificate retrieval](../evidence/amoy-completion-2026-10-26/gateway.json) and [dashboard MATCH](../evidence/amoy-completion-2026-10-26/public-match.ax.txt).

These are dated observations. Public operations are not replayed by the automated suite, and the records do not establish ongoing RPC, gateway or hosting availability. The Amoy blocked dispensing action reverted during estimation and a separate read-only call; no failed mined public transaction is claimed.

## Reproduce the local evaluation

From the project root after installation:

```bash
npm run verify
npm run check:interface
npm run build:amoy
npm run benchmark
```

Tests use isolated in-memory chains. The benchmark writes fresh measurements to `evidence/benchmark.json` and `evidence/gas.csv`; retain a dated copy when comparing runs. Public-network receipts remain separate from the controlled local benchmark.

## Comparison definition

`MedTraceBaseline.sol` is independently implemented from a supplied simplified description. The original source implementation was not supplied, so this is not an exact reproduction or a claim about another author's real code.

Both contracts implement role assignment, registration, custody, recall records and quantity-limited dispensing. The baseline records recall without enforcing a dispensing gate, omits recipient acceptance, and does not enforce expiry or temperature policy. Guard adds those controls and richer paged history. The baseline illustrates behavioral differences; it does not represent every pharmaceutical blockchain system.

## Experiments

1. **Gas receipts:** measure registration, a baseline one-step handoff, Guard proposal and acceptance separately, recall, hold and release. Sum proposal plus acceptance for a complete Guard handoff.
2. **Adversarial scenarios:** attempt dispensing after expiry and recall against both contracts; record actual receipts or reverts. Contract tests also exercise roles, stale proposals, deadlines, holds and quantities.
3. **Local growth:** register 100 synthetic batches. At 10, 50 and 100, record the last registration gas and median of 10 paged-history `eth_call` timings. Batch-code lengths vary slightly. This does not measure public-chain throughput or finality.
4. **Certificate integrity:** identical bytes produce MATCH, modified bytes produce MISMATCH, and an unavailable gateway remains unverified. Raw SHA-256 and IPFS CID encoding are distinct.
5. **Quantity property:** the independent model runs 200 deterministic partial-dispensing traces; EVM tests exercise a multi-step conservation trace. These are different evidence types.

## Recorded local results

The following values come from the [October 25 benchmark](../evidence/recheck-2026-10-25/benchmark.json), not public-network measurements:

| Experiment | Baseline | Guard | Interpretation |
|---|---|---|---|
| Registration gas | 117,426 | 348,313 | Different metadata, checks and history writes |
| Complete custody handoff gas | 31,223 | 359,857 | Guard proposal 201,831 plus acceptance 158,026 |
| Post-recall dispensing | Accepted | Rejected | Recorded flag versus enforced restriction |
| Post-expiry dispensing | Accepted | Rejected | Expiry enforcement |
| Out-of-range observation | Not supported | Hold and regulator release passed | Explicit review workflow |
| 100-batch history read | Not measured | 2.680 ms median, 10 trials | Local paged-read latency only |

The benchmark records Node version, compiler settings and local chain identity. Local timings vary by machine and run. Guard's extra metadata and history writes confound per-feature attribution: these are total design-cost comparisons, not an isolated gas ablation. An ablation would require otherwise identical storage and individually toggled policies.

Actual Amoy receipts show complete handoffs of **443,017** and **407,196** gas. Their state and metadata differ from the local benchmark; see the [public receipt table](AMOY_LIVE.md#actual-custody-and-safety-receipts). No dollar savings, clinical outcomes, regulatory compliance or production security guarantees follow from these measurements.
