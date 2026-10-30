# Sonar review and hardening — October 29, 2026

Passing software acceptance tests does not establish a Sonar quality-gate pass. The original scan reported 5 security, 99 reliability and 222 maintainability impacts. The API contains **231 distinct issues**, because 95 constructor findings contribute to both reliability and maintainability.

## Verified final result

Sonar analyzed commit `404d9d24bcb86131734da1f6b315b5c6a73410be` on October 29 (Phoenix time). The **quality gate passed**, with **zero open security findings, zero open reliability findings, and A ratings in all three categories**. There are 82 remaining low-priority sequential-await maintainability findings. No findings were dismissed or accepted, and no rules or gate thresholds were disabled.

| Category | Original open impacts | Final open impacts | Final rating |
|---|---:|---:|---|
| Security | 5 | 0 | A |
| Reliability | 99 | 0 | A |
| Maintainability | 222 | 82 | A |

Evidence: [analysis revision](../evidence/sonar-review-2026-10-29/analysis-after.json), [passing gate](../evidence/sonar-review-2026-10-29/quality-gate-after.json), [ratings](../evidence/sonar-review-2026-10-29/ratings-after.json), [remaining issue details](../evidence/sonar-review-2026-10-29/issues-after.json), [summary](../evidence/sonar-review-2026-10-29/summary.json), and [dashboard screenshot](../evidence/sonar-review-2026-10-29/sonar-passed.png). The same code passed [GitHub verification](https://github.com/hemanth-2104/MedTrace-Guard/actions/runs/40978861539).

## Five security findings

| Finding | Review and correction |
|---|---|
| `githubactions:S6505` — lifecycle scripts during install | CI now uses `npm ci --ignore-scripts --no-audit --no-fund`. A fresh installation of all 447 dependencies, compilation, tests, both builds and benchmark succeeded without dependency lifecycle scripts. |
| `jssecurity:S8707` — acceptance CLI path | The CLI now accepts only a regular `public/deployment.json` manifest within the project/workspace or OS temporary roots. Parent traversal, control characters, wrong names and resolved symlink escapes are rejected. The existing chain-31337 and fresh-deployment checks remain. |
| `jssecurity:S8707` — IPFS upload CLI path | Certificate reads are confined to project `public/certificates/` and `evidence/ipfs/` roots. File type, nonempty content and 8 MiB limits are enforced before upload. Tests prove that rejected input never contacts Kubo. |
| `jssecurity:S8707` — IPFS proof CLI path | Uses the same confined certificate reader. Output directories must remain below project `evidence/`, including resolved existing parent symlinks, before creating or writing files. |
| `jssecurity:S5145` — IPFS response logging | The proof requires a recursive pin and records a fixed, normalized `{Type: 'recursive'}` value instead of copying an arbitrary remote pin object into its log. CID validation and JSON serialization remain in place. |

The final reanalysis closed all security findings after code fixes. No issue was bulk-dismissed or marked false positive to achieve a pass.

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
- [Final allow-list boundary and upload tests](../evidence/sonar-review-2026-10-29/allowlist-tests.txt), [45 local contract acceptance IDs](../evidence/sonar-review-2026-10-29/acceptance-regression.json).
- [Targeted testnet refactor checks](../evidence/sonar-review-2026-10-29/testnet-refactor.txt).
- [Browser form regression](../evidence/sonar-review-2026-10-29/form-regression.json), [visible browser state](../evidence/sonar-review-2026-10-29/form-regression.dom.txt).
- [Original issue details](../evidence/sonar-review-2026-10-29/issues-before.json), [original uncomputed gate](../evidence/sonar-review-2026-10-29/quality-gate-before.json).

## Quality-gate definition and coverage

The original project had no explicit New Code definition. With the user’s specific approval, **Number of days: 30** was saved on October 29. This includes the repository’s recent work. Security, reliability and coverage thresholds were not changed. [Saved definition](../evidence/sonar-review-2026-10-29/new-code-setting.json).

The final result was verified as Passed at the [Sonar dashboard](https://sonarcloud.io/dashboard?id=hemanth-2104_MedTrace-Guard), with the matching analysis revision saved above. Future commits have their own analysis results; a GitHub neutral result alone is not a quality-gate pass.

Coverage remains a separate measurement: Sonar’s automatic analysis does not import test coverage. Importing LCOV requires switching to CI-based Sonar analysis and configuring its authenticated scanner. No coverage percentage or coverage-gate pass is invented. See [Sonar’s automatic-analysis limits](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/automatic-analysis) and [JavaScript coverage setup](https://docs.sonarsource.com/sonarqube-cloud/analyzing-source-code/test-coverage/javascript-typescript-test-coverage).

## First reanalysis and path-selection follow-up

Sonar analyzed commit `64966421431c004023d545c81ebd14b0b88d3a70`. All 99 reliability impacts were resolved, and only 82 low-priority sequential-await maintainability findings remained. The original install-script and log-injection findings closed. Five path findings were raised at the shared helper’s metadata/read calls because the analyzer did not carry its multi-root containment proof through to those sinks. The gate was now computed and failed its unchanged security condition. That result is retained in `quality-gate-after-first-fix.json`.

The follow-up changes selection to a positive allow-list: filesystem paths are independently built from trusted directory entries and fixed deployment names; CLI input only selects a candidate and is never the path supplied to `stat` or `readFile`. Certificate selection is limited to direct files in the approved certificate directories. Deployment discovery is bounded to expected project directories within the workspace/temporary roots; it only inspects the matching directory branch. Symlink/traversal and output-directory tests remain in place.

The isolated local acceptance regression also passed all 45 contract checklist IDs without altering the retained historical evidence. The final allow-list reader accepts that actual deployment manifest. The final external scan accepted the revised data flow and passed the gate with zero security findings; no findings were dismissed or rules disabled.
