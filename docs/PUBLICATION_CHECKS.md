# Repository publication checks

Initial publication checked October 29, 2026 (America/Phoenix). The table records the earlier **68-test** suite; the later security follow-up records **74 tests**, listed below.

| Check | Result | Evidence |
|---|---|---|
| Main and baseline compile | PASS | `evidence/publication-2026-10-29/verify.txt` |
| Contract, certificate, IPFS, wallet, workflow suites | 58 passed; zero failures/skips | Same verification log |
| Independent model suite | 10 passed; zero failures/skips | Same verification log |
| Frontend production build | PASS | Same verification log |
| Amoy frontend build | PASS | `evidence/publication-2026-10-29/build-amoy.txt` |
| Documented interface compiles and matches implementation | 31 ABI entries: 21 functions, four events, six errors | `evidence/publication-2026-10-29/interface.txt` |
| Baseline/Guard benchmark rerun | PASS | `evidence/publication-2026-10-29/benchmark-run.txt`, `evidence/benchmark.json`, `evidence/gas.csv` |
| Original deployed implementation source retained | Main and baseline source are byte-for-byte copies of the completed project | `contracts/MedTraceGuard.sol`, `contracts/MedTraceBaseline.sol` |
| Publication content review | Private environment files, dependencies, saved chains, builds, duplicate archives excluded; candidate text scanned for known signing secrets and common token patterns | `.gitignore`, publication preparation |

The October 26 records remain the evidence for 75 software acceptance checks, actual MetaMask handoffs, public IPFS retrieval, and user-confirmed phone lookup. Those external demonstrations were not repeated merely to publish this repository. Automated local verification does not establish production safety or continued external-service availability.

The commented interface is an additional design artifact compiled independently. It does not change implementation inheritance, function logic, or deployed-source metadata. GitHub Actions repeats the checks in `.github/workflows/verify.yml`; its actual run status should be inspected on GitHub.

## GitHub Linux installation correction

The first GitHub Actions run stopped at `npm ci` with `EBADPLATFORM` for Ganache’s bundled macOS-only `fsevents@2.3.2`. Its lockfile entry is now marked optional, preserving version and integrity. The replacement workflow checks both default and Amoy builds in addition to compilation, interface, all test suites and benchmark. See `evidence/publication-2026-10-29/ci-portability.json` and the repository Actions page for the run outcome.

## Current verification after security hardening

Six file-boundary regressions increased the suite from 68 to **74 tests**: 64 non-model plus 10 model tests, with no failures or skips. A fresh installation, compilation, interface validation, default/Amoy builds and benchmark passed. See [verification results](VERIFICATION.md), [fresh verification log](../evidence/sonar-review-2026-10-29/clean-verify.txt), and the [passing GitHub run](https://github.com/hemanth-2104/MedTrace-Guard/actions/runs/40979652318).

The independent Sonar analysis passed with zero security/reliability findings and A/A/A ratings. Remaining sequential-await maintainability recommendations and the unconfigured coverage measurement are documented in the [Sonar review](SONAR_REVIEW.md). Neither automated test count is the separate 75-check acceptance checklist.
