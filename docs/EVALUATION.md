# Evaluation protocol

## Do not invent results

Run `npm test`, `npm run build`, and `npm run benchmark`. Copy actual logs/JSON into your final report. These checks passed locally on October 25, 2026; see VERIFICATION.md and the retained evidence. Public-testnet behavior remains unverified.

## Comparison definition

`MedTraceBaseline.sol` is a deliberately simpler contract inspired by the **description** supplied by the user. The source implementation of that project was not provided. Therefore it is not an exact reproduction, and no claim is made that its author omitted checks in real code.

Both contracts implement role assignment, registration, custody, recall records, and quantity-limited dispensing. The baseline records recall without enforcing a dispensing gate, omits recipient acceptance, and does not enforce expiry or temperature policy. Guard adds those explicit controls and richer paged history. This makes it useful for demonstrating behavioral differences. It is not a representative comparison with every existing pharmaceutical blockchain system.

## Experiments supplied

1. **Gas receipts:** registration, baseline one-step handoff, Guard proposal and acceptance separately, recall, hold, release. Sum proposal + acceptance for a complete Guard handoff. Compare like workflows, not one transaction against half a handoff.
2. **Adversarial scenarios:** attempt dispensing after expiry and after recall against both contracts. Record accepted/rejected from actual receipts or reverts. See contract tests for unauthorized roles, stale proposals, deadline, hold, recall, and quantity checks.
3. **Local growth:** register 100 synthetic batches; at 10/50/100, record last registration gas and median of 10 paged-history eth_call timings. Fixed metadata differs slightly in code length; acknowledge it. This experiment does not measure public chain TPS or finality.
4. **Certificate integrity:** byte-identical file succeeds, reformatted/modified bytes fail, unavailable gateway is unverified. Use exact UTF-8 byte sequences; do not confuse raw SHA-256 with IPFS DAG/CID encoding.
5. **Quantity property:** the independent model runs 200 deterministic random partial-dispense traces; EVM tests run one multi-step conservation trace. These are distinct evidence types.

Gas comparisons are confounded by additional metadata and history writes, so describe them as total design-cost comparisons. An isolated ablation would require otherwise identical storage layouts and toggling individual policies. It is future work; do not claim causal per-feature gas attribution from the supplied two-contract experiment.

## Reporting template

| Experiment | Baseline | Guard | Interpretation |
|---|---|---|---|
| Full custody handoff gas | 31,223 | 359,857 (sum two transactions) | Extra acknowledgment cost |
| Post-recall dispensing | Accepted | Rejected | Enforced policy vs recorded flag |
| Post-expiry dispensing | Accepted | Rejected | Temporal policy enforcement |
| Out-of-range observation | Not supported | Hold and regulator release passed | Explicit hold/review workflow |
| 100-batch history read | Not measured | 2.680 ms median, 10 trials | Local paged-read latency only |

Record hardware, OS, Node version, solc version, optimizer, EVM revision, and chain ID. Retain raw logs, not just screenshots. Testnet receipts, latency, and gas-price observations must be separately identified. No dollar savings, security guarantees, health outcomes, or compliance claims follow from these classroom tests.
