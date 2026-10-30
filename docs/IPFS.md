# Real certificate storage with Kubo

The application stores a certificate locator (`ipfs://CID`) and an independent
SHA-256 digest of the exact certificate bytes. The CID locates content; the
registered digest is what the verification button compares. Neither establishes
that a laboratory or medicine is authentic. The included certificate is explicitly
a synthetic classroom sample.

## Recorded proof

`evidence/ipfs/proof.json` records an actual Kubo 0.43.1 add, recursive pin query,
and HTTP gateway retrieval, performed on 2026-10-25. These are live daemon results,
not mocked responses.

| Item | Result |
| --- | --- |
| Certificate URI | `ipfs://bafkreibu5ifryw6stuqi7uoddntloolf3rf7zb5aalzctnac5qou47rsei` |
| Exact SHA-256 | `0x34ea0b1c5bd29d208fd1c31b66b73965dc4bfc87a002f229b402ec1d4e7e3222` |
| Length | 165 bytes |
| Local gateway retrieval | MATCH; saved as `evidence/ipfs/certificate-retrieved.json` |
| One modified byte | MISMATCH; modified content also produced a different CID |
| Same bytes, renamed file | MATCH; same CID |
| Gateway CORS | HTTP 200 with `Access-Control-Allow-Origin: *` for frontend origins on ports 5173 and 5174 |
| Public gateways | Later Pinata and Filebase requests returned HTTP 200, 165 bytes, exact SHA-256; React returned MATCH through Pinata |

The original ipfs.io attempt failed (preserved in `evidence/ipfs/`). After restarting and reannouncing the local pin, live public retrieval succeeded through `https://gateway.pinata.cloud` and `https://ipfs.filebase.io`. Exact retrieved bytes and checksums are saved in `evidence/live-checks-2026-10-25/public-gateway-retry.json`; the React result and screenshot are in that same directory. Set `VITE_IPFS_GATEWAY=https://gateway.pinata.cloud` before starting/building to repeat the browser check. Public retrieval does not establish permanent remote pin retention after this machine goes offline. That original IPFS proof used a disposable local chain. The same CID and SHA-256 were subsequently registered on actual Amoy batch #1. On October 26, both the public Pinata gateway (HTTP 200, 165 bytes) and the React application again returned MATCH; see `evidence/amoy-completion-2026-10-26/gateway.json` and `public-match.ax.txt`.

## Current isolated daemon

The working daemon uses `/private/tmp/medtrace-ipfs-repo`, API
`http://127.0.0.1:15001`, gateway `http://127.0.0.1:18080`, and swarm port 14001.
Its process metadata and verified distribution checksum are recorded in
`evidence/ipfs/runtime.json`. It does not use the blockchain RPC port 8545 or the
frontend port 5173. The temporary repository and binary must be preserved if the
local pin needs to survive a restart; they are not packaged in this project.

The binary is `/private/tmp/medtrace-kubo-runtime/kubo/ipfs`. The downloaded
darwin-arm64 tarball's SHA-512 matched its adjacent official distribution checksum:

```text
bc282d781d856736051ce6d216ba47d52bec703f1a54ab5fa20fba26a92e4af3e8fb131e220cdf01f20205f1effb1a5b7bedbdeff15e8edbbe8e5b01923a7cbb
```

## Upload and reproduce

Use an existing Kubo daemon or configure a new isolated repository before starting
it. These commands assume the verified binary above is still present:

```sh
export IPFS_PATH=/private/tmp/medtrace-ipfs-repo
export IPFS_API=http://127.0.0.1:15001
export IPFS_GATEWAY=http://127.0.0.1:18080

# Restart the already configured daemon only if it is stopped.
/private/tmp/medtrace-kubo-runtime/kubo/ipfs daemon
```

From another terminal in the project:

```sh
IPFS_API=http://127.0.0.1:15001 node scripts/ipfs-upload.mjs public/certificates/demo-3.json
IPFS_API=http://127.0.0.1:15001 IPFS_GATEWAY=http://127.0.0.1:18080 node scripts/ipfs-proof.mjs
node --test tests/certificate.test.mjs tests/ipfs-upload.test.mjs
```

The upload helper requests `pin=true`, CIDv1, and raw leaves, enforces the 8 MiB
classroom limit, and prints the URI, independent exact-byte SHA-256, and length.
It accepts a loopback Kubo API origin only and uses a 30-second request timeout.
The proof command intentionally contacts the live daemon and performs a separate
12-second-bounded public gateway attempt. Set `IPFS_EVIDENCE_DIR` to preserve a
new run separately, and `IPFS_PUBLIC_GATEWAY` to select another HTTPS gateway.
The ordinary unit suite mocks API responses explicitly and needs no daemon.

For a fresh repository, run `ipfs init --profile=server`, then configure
`Addresses.API` to `/ip4/127.0.0.1/tcp/15001`, `Addresses.Gateway` to
`/ip4/127.0.0.1/tcp/18080`, and `Addresses.Swarm` to an unused port before starting
the daemon. Keep the administrative API bound to loopback.

## Browser gateway configuration

Launch Vite with the local gateway for this proof:

```sh
VITE_IPFS_GATEWAY=http://127.0.0.1:18080 npm run dev
```

Vite reads this setting at startup/build time. Restart Vite after changing it;
production builds need the setting when `npm run build` runs. The default is
`https://ipfs.io`. The value must be an HTTPS origin or an HTTP loopback origin
(`127.0.0.1`, `localhost`, or `[::1]`), without a path, query, fragment, or
credentials. `certificateURL` appends `/ipfs/CID`; only `ipfs://CID` without
subpaths is supported. Local `/certificates/filename` locators keep their existing
behavior. Node can import the same shared helper without Vite.

Register the real URI and hash printed by the upload helper through the authorized
manufacturer flow. The browser's Check certificate bytes action fetches from the
configured gateway. Gateway/network failures remain **unverified**, not a content
mismatch. A browser page served over HTTPS should use an HTTPS gateway to avoid
mixed-content restrictions. Never put API or pinning-service credentials in a
`VITE_` setting.

## CLI file boundaries

The upload and proof CLIs now accept certificate files only within this project’s `public/certificates/` or `evidence/ipfs/` directories. Copy a new synthetic certificate into `public/certificates/` first. Files must be nonempty, at most 8 MiB, and use a supported certificate extension (`.pdf`, `.json`, `.txt`, `.csv`, `.png`, `.jpg`, `.jpeg`, `.bin`). Parent traversal, control characters, private environment files and symlink escapes are rejected before uploading. Library tests can supply an explicit trusted fixture root; that option is not accepted from CLI arguments. `IPFS_EVIDENCE_DIR`, if set, must remain under this project’s `evidence/` directory, including after symlinks resolve.
