# Sonar review and hardening — October 29, 2026

Passing software acceptance tests does not establish a Sonar quality-gate pass. The original scan reported 5 security, 99 reliability and 222 maintainability impacts. The API contains **231 distinct issues**, because 95 constructor findings contribute to both reliability and maintainability.

## Five security findings

| Finding | Review and correction |
|---|---|
| `githubactions:S6505` — lifecycle scripts during install | CI now uses `npm ci --ignore-scripts --no-audit --no-fund`. A fresh installation of all 447 dependencies, compilation, tests, both builds and benchmark succeeded without dependency lifecycle scripts. |
| `jssecurity:S8707` — acceptance CLI path | The CLI now accepts only a regular `public/deployment.json` manifest within the project/workspace or OS temporary roots. Parent traversal, control characters, wrong names and resolved symlink escapes are rejected. The existing chain-31337 and fresh-deployment checks remain. |
| `jssecurity:S8707` — IPFS upload CLI path | Certificate reads are confined to project `public/certificates/` and `evidence/ipfs/` roots. File type, nonempty content and 8 MiB limits are enforced before upload. Tests prove that rejected input never contacts Kubo. |
| `jssecurity:S8707` — IPFS proof CLI path | Uses the same confined certificate reader. Output directories must remain below project `evidence/`, including resolved existing parent symlinks, before creating or writing files. |
| `jssecurity:S5145` — IPFS response logging | The proof requires a recursive pin and records a fixed, normalized `{Type: 'recursive'}` value instead of copying an arbitrary remote pin object into its log. CID validation and JSON serialization remain in place. |

All security findings are being reanalyzed after code fixes. No issue was bulk-dismissed or marked false positive to achieve a pass.

## Reliability and meaningful behavior fixes

- Replaced bare `Error(...)` calls with explicit `new Error(...)`, addressing the 95 reliability impacts from `javascript:S7723`.
- Added explicit button types and explicit handling of the registration submission promise.
- Moved the action component outside the main React component. This fixes real input loss on rerender. Account changes intentionally remount the signing forms to clear the previous account’s entries.
- Timeline keys now use each entry’s absolute ledger position, rather than its visible page index.
- Added braces to conditional/loop bodies, removed unused declarations, simplified nested conditionals, reduced testnet configuration/workflow complexity, and used semantic status outputs.
- Added direct assertions to the two contract tests whose shared rejection helper was not recognized by Sonar.

The Solidity implementation and public deployment source were not changed. Existing Amoy receipts and the dated 75-check acceptance evidence remain historical demonstrations; no additional public wallet signatures are claimed for this review.

## Deliberate sequential blockchain operations

Many low-severity `await`-in-loop recommendations concern transactions that share a signer nonce, depend on the previous state, collect comparable serial gas/latency measurements, or assert a deliberate ordering. Parallelizing those operations to silence a rule would change their behavior. They are retained for correctness and reviewed separately from the security/reliability fixes.

## Verification evidence

The automated suite now contains **74 tests**: the previous 68 plus six file-boundary regression tests. This count is separate from the 75 acceptance IDs.

- [Fresh install with lifecycle scripts disabled](../evidence/sonar-review-2026-10-29/clean-install.txt).
- [Fresh compile, tests and default build](../evidence/sonar-review-2026-10-29/clean-verify.txt).
- [Amoy build](../evidence/sonar-review-2026-10-29/clean-build-amoy.txt), [interface check](../evidence/sonar-review-2026-10-29/interface.txt), [benchmark](../evidence/sonar-review-2026-10-29/benchmark.txt).
- [Targeted testnet refactor checks](../evidence/sonar-review-2026-10-29/testnet-refactor.txt).
- [Browser form regression](../evidence/sonar-review-2026-10-29/form-regression.json), [visible browser state](../evidence/sonar-review-2026-10-29/form-regression.dom.txt).
- [Original issue details](../evidence/sonar-review-2026-10-29/issues-before.json), [original uncomputed gate](../evidence/sonar-review-2026-10-29/quality-gate-before.json).

## Quality-gate definition and coverage

The original project had no explicit New Code definition. With the user’s specific approval, **Number of days: 30** was saved on October 29. This includes the repository’s recent work. Security, reliability and coverage thresholds were not changed. [Saved definition](../evidence/sonar-review-2026-10-29/new-code-setting.json).

The current scan result must be checked at the [Sonar dashboard](https://sonarcloud.io/dashboard?id=hemanth-2104_MedTrace-Guard) for the actual published commit. A GitHub neutral result is not a quality-gate pass.

Coverage remains a separate measurement: Sonar’s automatic analysis does not import test coverage. Importing LCOV requires switching to CI-based Sonar analysis and configuring its authenticated scanner. No coverage percentage or coverage-gate pass is invented. See [Sonar’s automatic-analysis limits](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/automatic-analysis) and [JavaScript coverage setup](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage).
