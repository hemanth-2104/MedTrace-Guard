# Course requirement mapping

Based on the supplied Fall B 2026 overview and Project 1 brief. Separate Canvas milestone overviews were not supplied; check them before submission. The overview says to integrate off-chain data, while the detailed brief calls it optional; this prototype includes certificate files and simulated observations to cover the stronger interpretation.

| Requirement | Implementation / evidence |
|---|---|
| Stakeholders, read/write access, product journey | proposal.tex, ARCHITECTURE.md, contract role checks |
| Unique product registration | registerBatch; generated numeric ID; duplicate manufacturer/code rejected |
| Custody transfer | proposeTransfer + acceptTransfer; cancelTransfer |
| Status updates and events | stages, safety flags, Recorded events, append-only paged history |
| Access control and invalid transaction safeguards | admin/role/custodian checks, deadlines, nonces, quantity and eligibility gates |
| Simple UI for submission/viewing | React app in src/, public read RPC and signed transactions |
| Off-chain records | local demo certificate files; optional actual IPFS/Kubo upload; SHA-256 verification |
| Simulated real-world data | simulate-temperature.mjs; evidence retention and contract condition hold |
| Scalability, gas, data management analysis | benchmark.mjs, EVALUATION.md, report draft; measured local outputs in evidence/benchmark.json |
| Centralized comparison, privacy, limitations | technical_report_body.tex, ARCHITECTURE.md |
| GitHub code and README | complete source folder; user creates/uploads repository |
| Proposal + team contract (Oct 25, 2026) | proposal Word source, updated LaTeX, and archived original PDF; TEAM_CONTRACT.md requires team input |
| Contract draft (Nov 1, 2026) | source + README; compile/tests passed; repository upload still needed |
| Interim demo (Nov 15, 2026) | 5-minute recording by team; DEMO.md supplies script |
| Final (Dec 4, 2026) | code + README, 7–10 minute recording, completed 4–8 page IEEE two-column report |

Weights: proposal 10%, draft 5%, interim 15%, final 70%. Individual project briefs show 2025 dates; the 2026 overview supplies the dates above. Canvas posted due times control your actual submission.
