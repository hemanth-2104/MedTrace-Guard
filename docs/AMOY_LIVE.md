# Verified live Amoy workflow and repeat guide

Verified October 26, 2026 (America/Phoenix). The public custody workflow is complete. This guide describes real MetaMask signatures and public-chain receipts, separately from local fixtures and mocked wallet tests.

## Deployment and current state

- Network: Polygon Amoy, chain **80002**, gas token **test POL**.
- Contract: [0x95DDa069490E8D6B0650A707052598b306C495e2](https://amoy.polygonscan.com/address/0x95DDa069490E8D6B0650A707052598b306C495e2).
- Deployment: [0x5c59371be153977350264ee4daa8c8fb660c96e4b415d9d92b59e0559dd59e6b](https://amoy.polygonscan.com/tx/0x5c59371be153977350264ee4daa8c8fb660c96e4b415d9d92b59e0559dd59e6b), status 1, block 51098731, 2,373,241 gas.
- Creation/runtime bytecode exactly match `MedTraceGuard.sol`, solc 0.8.30, optimizer 200, via IR, Shanghai; see `evidence/amoy-live/bytecode-verification.json`.
- Registration: [0x0eca14386d686667d5cf884186a188d7c0578d47524603b85bc9ee41e4f52165](https://amoy.polygonscan.com/tx/0x0eca14386d686667d5cf884186a188d7c0578d47524603b85bc9ee41e4f52165), status 1, block 51099629, 464,654 gas.
- Batch #1: `AMOY-LIVE-20261025`, **100/100 units, Pharmacy custody, temperature hold, no pending shipment**. The hold is intentional synthetic demonstration data. Five custody entries plus one temperature entry remain in order.

## Actual custody and safety receipts

Every receipt below has status **1**. Gas values are actual receipt gas, not estimates. Different metadata/state makes these observations distinct from the controlled local baseline benchmark.

| Action | Transaction | Block | Gas used |
|---|---|---:|---:|
| Manufacturer proposes to Distributor | [0x1f18348d993e8bf3ddd0fdbb9751fc8c7268cb1dd0fef6fbc565653fac223c50](https://amoy.polygonscan.com/tx/0x1f18348d993e8bf3ddd0fdbb9751fc8c7268cb1dd0fef6fbc565653fac223c50) | 51214245 | 245,511 |
| Distributor accepts nonce 1 | [0xf68ab589960120c616a033c573a1e2b0a443d37f00f8723cc6cdacb80288ebab](https://amoy.polygonscan.com/tx/0xf68ab589960120c616a033c573a1e2b0a443d37f00f8723cc6cdacb80288ebab) | 51214351 | 197,506 |
| Distributor proposes to Pharmacy | [0x792fb13ce9ccd1aa165e06f0e82488ddb02cc121015bd921ab6fd40fc3546c6c](https://amoy.polygonscan.com/tx/0x792fb13ce9ccd1aa165e06f0e82488ddb02cc121015bd921ab6fd40fc3546c6c) | 51214486 | 227,600 |
| Pharmacy accepts nonce 2 | [0x3dad36be36ed9ca77305c0fbd7a1d0d25ce8ac2b9cf8e74128bbbca8d5e537b6](https://amoy.polygonscan.com/tx/0x3dad36be36ed9ca77305c0fbd7a1d0d25ce8ac2b9cf8e74128bbbca8d5e537b6) | 51214579 | 179,596 |
| Pharmacy reports 11.5 °C | [0x3bfb03bc109f444c5ea77a56fc57d31125104fe9ffe840c65b1a9846f26234c8](https://amoy.polygonscan.com/tx/0x3bfb03bc109f444c5ea77a56fc57d31125104fe9ffe840c65b1a9846f26234c8) | 51214779 | 163,822 |

The two complete handoffs consumed 443,017 and 407,196 gas respectively (proposal plus acceptance). Snapshots after each transaction independently confirm that custody stays with the sender until the named recipient accepts; the pending proposal then clears. Nonces 1 and 2 and all counterparties match the history.

After the 11.5 °C report, the authorized Pharmacy tried to dispense one unit through the dashboard. It showed **Action blocked: check recall, expiry, temperature hold, and remaining units.** A separate public `eth_call` returned **Blocked**, selector `0xa5baf151`. Quantity stayed 100, history stayed six entries, and custody/pending state stayed unchanged. This rejection happened during estimation/read-only execution; **no failed mined transaction is claimed**. See `blocked-dispense.json` and `blocked-dispense.ax.txt` in the completion evidence directory.

## MetaMask accounts

No keys or recovery phrases were exported. Match exact public address and network before signing.

| Role | MetaMask label | Public address |
|---|---|---|
| Administrator | Account 1 | `0xC330B28A3C1f892d301f035078469E0ca5Cfb45A` |
| Manufacturer | Account 2 | `0x9f43140B44D58e2F3bdAE44EF613fbCc4ccDDE52` |
| Distributor | Account 3 | `0xed0C1F66366a323e219846eb1a064D1066632828` |
| Pharmacy | Account 4 | `0x7468B4468B644B062ddC9E33Fc320368fD60a529` |
| Regulator | Account 5 | `0x84e8B8e2A9d55872cE70dB38Aa882FaFB071FaD5` |

The original administrator has role None while retaining administrator authority. Four role-assignment receipts are in `evidence/amoy-live/role-1.json` through `role-4.json`. Account changes clear the dashboard's signing session; reconnect before using the next role. MetaMask may require **Connect** for that account on the current site. The asset-list network filter and the connected site's network control are separate.

## Open the deployed application next time

From a fresh extracted project directory, with Node 22.13 or newer:

```sh
npm ci
cp .env.amoy.example .env.amoy.local
chmod 600 .env.amoy.local
npm run dev:amoy -- --port 5176
```

Open **http://127.0.0.1:5176/?batch=1**. Later, run only the last command. Keep an existing configuration instead of copying over it. Leave all private-key fields empty for browser use. Public lookup needs no wallet; MetaMask holds signing keys. Reuse `public/deployment.amoy.json`; no chain startup, redeployment or seeding is needed. Internet access is required.

```sh
npm run testnet:read -- 1
npm run build:amoy
```

The first command independently checks the deployed runtime and public state without signing. The second creates `dist/` for a static web server. Use localhost or HTTPS for certificate hashing and wallet access. On non-localhost HTTP, browsers can withhold Web Crypto; LAN HTTP is suitable for the optional read-only lookup check, not a certificate-verification deployment.

Primary RPC: `https://polygon-amoy-bor-rpc.publicnode.com`. Alternate: `https://polygon-amoy.drpc.org`, which intermittently returned errors during testing. The frontend disables batching and uses a 1.5-second public polling interval. Public gateway: `https://gateway.pinata.cloud`.

## Public IPFS verification

- URI: `ipfs://bafkreibu5ifryw6stuqi7uoddntloolf3rf7zb5aalzctnac5qou47rsei`
- Registered SHA-256: `0x34ea0b1c5bd29d208fd1c31b66b73965dc4bfc87a002f229b402ec1d4e7e3222`
- Original synthetic certificate: `evidence/ipfs/certificate-original.json`, 165 bytes.

On October 26, Pinata returned HTTP 200 and those exact bytes; the dashboard returned MATCH. See `gateway.json` and `public-match.ax.txt`. Prior real Kubo add/pin, renamed-file MATCH and modified-file MISMATCH evidence is retained under `evidence/ipfs/`. Public gateway success proves retrieval at that time, not permanent remote pin retention. Preserve/recreate the Kubo pin or arrange a durable pin for long-term availability; see `IPFS.md`.

## Repeat a new public demonstration

Batch 1 is intentionally held. To demonstrate a fresh lifecycle, register a **new unique synthetic batch code** as Manufacturer with a valid future expiry and the exact original certificate file/URI. Then:

1. Manufacturer proposes to Distributor with a future deadline no more than seven days away and before expiry. Verify Manufacturer remains custodian.
2. Distributor connects/reconnects, accepts the displayed pending nonce, and checks cleared pending state.
3. Distributor proposes to Pharmacy. Verify custody remains Distributor until Pharmacy connects/reconnects and accepts the new nonce.
4. Pharmacy reports 11.5 °C with a retained synthetic evidence note. Verify hold, then attempt dispensing and check the rejection without state/history change.

Check current test-POL balances and estimates first. A prior deadline cannot be reused after it expires. Existing receipt hashes should be reconciled before retrying any uncertain broadcast. A regulator can release a nonrecalled hold only after a valid review digest; normal readings alone do not clear it. Do not treat synthetic test results as physical medicine or regulatory certification.

## Faucet and fee history

The official faucet denied the October 25 repeat request with a 24-hour limit. On October 26, the normal claim using the same verified session succeeded: [0x84e6e307b7cc86eb62b35abe62b037a7872eeaeaaeda3ccd3fdf967537b444b1](https://amoy.polygonscan.com/tx/0x84e6e307b7cc86eb62b35abe62b037a7872eeaeaaeda3ccd3fdf967537b444b1), block 51213870, status 1, 0.1 test POL. Manufacturer and Distributor were topped up by 0.02 each; Pharmacy by 0.01. No identity/IP rotation or rate-limit bypass was used.

The October 25 anomalous 49,000,000-gas funding request was cancelled, recreated with a correct fee, and sent safely. During October 26 date entry, automatic approval review initially rejected proposal submission until complete form values were visibly verified. The unrelated cancellation field was cleared; a full accessibility read verified batch 1, exact recipient and deadline before submission was allowed. No cancellation or malformed proposal was sent. Review final wallet fees and encoded target/data before confirming.

## Coverage and evidence

**75/75 checklist checks pass, zero unresolved failures or untested IDs.** J4 is complete. The user confirmed on a real phone that the Wi-Fi preview shows the correct Amoy batch, Pharmacy custodian, 100/100 units and Temperature hold. J7 evidence is `phone-check.json`; this is user-confirmed rather than an agent-observed phone screenshot. The preview requires the Mac and same Wi-Fi; permanent public hosting is not claimed. All 68 automated tests, default production build and Amoy production build passed on October 26. Course report layout/review, team agreement and required videos remain separate submission tasks.

Current evidence: `evidence/amoy-completion-2026-10-26/`. Earlier deployment and actual-extension approval/cancellation/account/network evidence remains in `evidence/amoy-live/` and `evidence/metamask-live/`. The immutable previous checkpoint is retained; the new code/evidence checkpoint and runnable ZIP include the public deployment manifest and exclude all wallet secrets.
