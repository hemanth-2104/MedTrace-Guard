# Repository publication checks

Checked October 29, 2026, America/Phoenix, against the publication copy.

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
| Draft design PDF layout | All four rendered pages inspected | `submissions/Group20_2026FallB_CSE_540_MedTrace_Guard_Smart_Contract_Design.pdf` |
| Publication content review | Private environment files, dependencies, saved chains, builds, duplicate archives excluded; candidate text scanned for known signing secrets and common token patterns | `.gitignore`, publication preparation |

The October 26 records remain the evidence for 75 software acceptance checks, actual MetaMask handoffs, public IPFS retrieval, and user-confirmed phone lookup. Those external demonstrations were not repeated merely to publish this repository. Automated local verification does not establish production safety, continued external-service availability, or completion of the separate course report/videos/team agreement.

The commented interface is an additional design artifact compiled independently. It does not change implementation inheritance, function logic, or deployed-source metadata. GitHub Actions repeats the checks in `.github/workflows/verify.yml`; its actual run status should be inspected on GitHub.
