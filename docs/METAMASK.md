# MetaMask signing

The dashboard has three explicit signing states: public read-only, local demo RPC, and MetaMask. Connecting a wallet always selects MetaMask signing, including when its address matches an unlocked Ganache account. Only selecting **Local demo account** chooses unlocked RPC signing, and that selector is restricted to localhost, chain 31337, and the accounts listed in the deployment manifest.

**Connect MetaMask** requests wallet account permission and checks the wallet's current account and chain against the deployment. It never automatically switches the network. **Switch wallet network** explicitly requests the deployment chain, adds a supported network only on an unknown-chain response (4902), switches again, and reconnects. Known additions are the local demo chain and Polygon Amoy (80002). Amoy additions require a public HTTPS RPC URL without embedded credentials or query parameters; local additions require a loopback HTTP(S) RPC. Other networks must be added manually in the wallet.

Wallet account changes, chain changes, revocation, and disconnects clear signing identity, role, and administrator state. Reconnect before signing again. The app rechecks the current account and chain before obtaining a signer and again before returning it to a transaction. Failed or rejected connections return to public mode. Rejected transactions release the dashboard's pending state and display an actionable message. Provider listeners and cached ethers wallet providers are removed when a session ends or the component unmounts.

**Disconnect signing** clears the app session; it does not revoke the site's permissions inside MetaMask. Use the wallet's connected-sites settings to revoke those permissions.

## Select a deployment

The default manifest is `/deployment.json`, preserving the original localhost demo. An independent testnet frontend can select the separately deployed manifest without replacing the local manifest:

```sh
VITE_DEPLOYMENT_PATH=/deployment.amoy.json npm run dev -- --port 5174
```

The Amoy manifest must first exist and contain a deployed contract on chain 80002. The dashboard checks the read RPC chain and deployed bytecode before enabling access. `VITE_READ_RPC` can override the read endpoint. Wallet network additions use the public `rpcUrl` stored in the deployment manifest. Never put API credentials or private keys in a Vite variable or public manifest.

## Actual verification status (2026-10-25)

Brave's actual MetaMask extension was connected and tested after the user installed and unlocked it. All writes in this check used a separate disposable local chain at `http://127.0.0.1:18546`, chain ID **31337**, and contract `0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab`. The original saved four-batch chain on port 8545 was preserved.

- Connected Account 1, public address `0xC330B28A3C1f892d301f035078469E0ca5Cfb45A`. A mainnet/deployment-chain mismatch was correctly rejected before switching to the local deployment.
- Approved an actual MetaMask transaction registering `MM-LIVE-APPROVED-20261025`. Receipt status **1**, transaction `0xeaae71ec6e36674e2b0b7431a32833016dfd1586d4bea50b41fec62db40c3884`, gas **398,930**. Batch 2 has 100/100 units and the wallet as manufacturer/custodian.
- Cancelled a second valid registration (`MM-LIVE-REJECTED-20261025`) in MetaMask. The dashboard displayed `Wallet request rejected. No new wallet connection or signature was approved.` and restored its controls. Batch count stayed 2; only the approved transaction from this account exists on this chain.
- Added Account 2 through MetaMask and connected it to the app. The app cleared signing identity and requested reconnection. After reconnecting it displayed the new address and Public viewer role.
- Switched the connected site's network to Ethereum without sending any mainnet transaction. The app cleared signing access and displayed `Wallet network changed. Reconnect before signing.`
- The wallet-created batch's certificate returned MATCH through `https://gateway.pinata.cloud` in the application.

Evidence: `evidence/metamask-live/proof.json`, `approved-receipt.json`, and the accompanying screenshots/accessibility snapshots. I6/I7 now pass as genuine extension checks. The 28 simulated EIP-1193 tests remain separate automated regression coverage. These local wallet checks do not establish Amoy deployment or public-network workflow success.

Amoy (80002, POL) was subsequently funded and used for actual MetaMask deployment, four stakeholder-role assignments, registration, and funding transfers. See `AMOY_LIVE.md` and `evidence/amoy-live/`. The first public handoff awaits a Manufacturer test-POL top-up. Only public addresses and synthetic records were recorded; no private keys or recovery phrases were read or exported.

## User-run extension acceptance

1. Open the selected frontend in the browser containing MetaMask. Select **Connect MetaMask**, reject once, and verify the dashboard stays public without an authorized-actions identity.
2. Connect with an authorized account. On the local deployment, confirm the header says **MetaMask signing** even if the address is also listed in the demo selector.
3. Reject an action in the wallet. Confirm the dashboard exits its pending state. Approve a suitable synthetic-data action when ready; retain the transaction hash, receipt status, chain ID, contract address, and before/after ledger state.
4. Change wallet account, switch chain, and disconnect/revoke permissions separately. Confirm the identity/actions disappear each time and reconnect is required.
5. Use **Switch wallet network** explicitly to return to the deployment chain. For an unrecognized supported network, review the network parameters shown by MetaMask before approving.
6. Select a local demo account and confirm the header changes to **Local demo signing**. Return to MetaMask and verify the next action creates a wallet approval prompt.

Keep evidence limited to public chain details and synthetic records. Do not capture seed phrases, private keys, wallet passwords, or API credentials.
