# Demonstration walkthrough

Start with `npm start` from the project root. Use batch 2 or 3 on a fresh local deployment; seeded batch 1 is held. A previously used batch may already be recalled or exhausted. The steps below use the local account selector; on Amoy, connect/reconnect the authorized MetaMask account at each handoff.

## Short walkthrough: about 5 minutes

0:00–0:40: Explain batch provenance and the difference between a record and physical authenticity.

0:40–1:30: Public viewer: select batch 2, show certificate byte check and provenance history without connecting a wallet.

1:30–3:00: Select manufacturer, propose batch 2 to the distributor (copy the distributor account from the selector/config). Show custody remains manufacturer. Select distributor, accept using the displayed pending nonce. Show custody/timeline update. Propose distributor → pharmacy and accept as pharmacy.

3:00–4:10: Dispense 10 units as pharmacy. Submit an 11.5 C simulated reading with an evidence note. Attempt dispensing; show the transaction is rejected under hold. Explain this is an authorized simulated report, not real sensor evidence.

4:10–5:00: Regulator releases hold using a nonzero digest from the note-hash utility; pharmacy can dispense again. Show the recorded verification summary and limitations.

## Extended walkthrough: about 7–10 minutes

- 0:00–1:00: problem, prototype scope, and source attribution.
- 1:00–2:00: architecture, public reads vs signed writes, on/off-chain boundary.
- 2:00–4:00: dual-party custody and quantity accounting.
- 4:00–6:00: condition hold → failed action → regulator review; recall → blocked action.
- 6:00–7:00: modified certificate fails verification; explain availability vs integrity.
- 7:00–8:30: show executed contract test log and actual benchmark JSON/CSV, including cost of both handoff transactions.
- 8:30–9:30: privacy, onboarding trust, simulated sensing, batch-vs-package scope, limits/future work.

Use the real React + local-chain app for the blockchain walkthrough, not the labeled model preview. Evidence screenshots should show actual transactions/results. Local demo selectors are an explicit convenience, not wallet identity verification.

## Verify the result

Check that each proposal retains the sender as custodian, each acceptance clears the pending shipment, dispensing reduces quantity exactly, and a blocked action leaves state/history unchanged. Refresh to confirm persisted local state. Match the original certificate and demonstrate MISMATCH with modified bytes.

See [current verification](VERIFICATION.md) for the 74-test suite and [acceptance results](ACCEPTANCE_RESULTS.md) for the separate 75-check record. To inspect or repeat the public workflow, use the [Amoy guide and receipt table](AMOY_LIVE.md). The recorded public batch is intentionally held; register a fresh valid batch for another full lifecycle.
