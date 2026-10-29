# Demonstration and submission guide

## Interim: 5 minutes

0:00–0:40: Explain batch provenance and the difference between a record and physical authenticity.

0:40–1:30: Public viewer: select batch 2, show certificate byte check and provenance history without connecting a wallet.

1:30–3:00: Select manufacturer, propose batch 2 to the distributor (copy the distributor account from the selector/config). Show custody remains manufacturer. Select distributor, accept using the displayed pending nonce. Show custody/timeline update. Propose distributor → pharmacy and accept as pharmacy.

3:00–4:10: Dispense 10 units as pharmacy. Submit an 11.5 C simulated reading with an evidence note. Attempt dispensing; show the transaction is rejected under hold. Explain this is an authorized simulated report, not real sensor evidence.

4:10–5:00: Regulator releases hold using a nonzero digest from the note-hash utility; pharmacy can dispense again. Summarize remaining tests/evaluation and limitations.

## Final: 7–10 minutes

- 0:00–1:00: problem, course scope, and source attribution.
- 1:00–2:00: architecture, public reads vs signed writes, on/off-chain boundary.
- 2:00–4:00: dual-party custody and quantity accounting.
- 4:00–6:00: condition hold → failed action → regulator review; recall → blocked action.
- 6:00–7:00: modified certificate fails verification; explain availability vs integrity.
- 7:00–8:30: show executed contract test log and actual benchmark JSON/CSV, including cost of both handoff transactions.
- 8:30–9:30: privacy, onboarding trust, simulated sensing, batch-vs-package scope, limits/future work.

Use the real React + local-chain app for the submitted blockchain demo, not the labeled model preview. Evidence screenshots should show actual transactions/results. Local demo selectors are an explicit convenience, not wallet identity verification.

## Before submitting

1. Fill team names and complete the contract with actual agreements.
2. Read the separate Canvas deliverable overviews and check exact due dates/file naming.
3. Install packages, compile both contracts, run tests, build frontend, and run benchmark. Fix any failures before claiming the project works.
4. Use the published repository at https://github.com/hemanth-2104/MedTrace-Guard. Source, package-lock.json, README, final 75-check evidence and design PDF are included; private environment files and local runtime data are excluded.
5. Record your own 5-minute interim and 7–10 minute final demonstrations.
6. Replace pending report fields with measured evidence; use technical_report_ieee.tex in Overleaf and confirm 4–8 pages after editing.
7. Upload all final artifacts, repository/video links, and any required AI/source disclosures according to the actual rubric.

The GitHub repository and actual Amoy contract are published, and all 75 software acceptance checks have passing evidence. See ACCEPTANCE_RESULTS.md and AMOY_LIVE.md. Canvas submission, recorded team videos and an agreed team contract remain separate deliverables.
