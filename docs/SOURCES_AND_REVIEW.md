# Sources and review of the supplied proposal

## Corrections made

- The supplied text asserts implementation as if it already exists. The proposal now uses planned-work language; the report distinguishes supplied source from executed evidence.
- DSCSA addresses interoperable **package-level** tracing of certain prescription drugs. This batch-level classroom prototype is DSCSA-inspired and does not establish compliance. Public verification is not itself a DSCSA compliance requirement. The law does not prescribe blockchain.
- Claims that conventional systems are generally tamperable or cannot interoperate were removed. Centralized systems can use signatures, access control, audit logs, and standards too.
- Hyperledger Fabric does not inherently prevent public-facing read portals. Public-chain choice is a project tradeoff, not proof that a Fabric portal is impossible; no universal throughput comparison is claimed.
- Certificate hashing verifies consistency of committed bytes, not physical authenticity, certification authority identity, or laboratory quality. QR labels can be copied.
- IPFS availability is not permanent just because content has a CID. Pinning and retrieval availability matter. CID encoding and raw-file digest are distinct.
- The WHO estimate is explicitly dated to its 2017 analysis, not an invented 2023 study or a universal current rate.
- The Sylim reference is **Patrick Sylim**, not M. Sylim. It concerns pharmaceutical distribution directly; it is not evidence that only centralized DSCSA systems exist.
- Unverified repository claims and broad claims that earlier work lacks RBAC/IPFS were removed. MedRec is not needed to justify this focused supply-chain proposal.
- Testnet operations consume test tokens and may have faucet/RPC constraints; they are not literally free execution.
- The original source implementation was not supplied. Our baseline is independently written from a stated simplified specification, not an exact replication or a claim about someone else's real code.

## Verified primary sources

1. WHO, 2017: https://www.who.int/en/news/item/28-11-2017-1-in-10-medical-products-in-developing-countries-is-substandard-or-falsified
2. FDA, Drug Supply Chain Security Act: https://www.fda.gov/drugs/drug-supply-chain-integrity/drug-supply-chain-security-act-dscsa
3. P. Sylim, F. Liu, A. Marcelo, P. Fontelo, 2018, JMIR Res Protoc 7(9):e10163, DOI 10.2196/10163: https://www.researchprotocols.org/2018/9/e10163/
4. IPFS persistence/pinning: https://docs.ipfs.tech/concepts/persistence/
5. Solidity security considerations: https://docs.soliditylang.org/en/latest/security-considerations.html
6. OpenZeppelin access control guidance (background only; the supplied contract implements a small custom role registry, not an imported OpenZeppelin contract): https://docs.openzeppelin.com/contracts/5.x/access-control

The supplied course PDFs define the milestones and baseline requirements. No claims of first-in-literature originality, clinical benefit, production security, or compliance are established by this prototype.

## AI assistance record

An AI assistant generated the initial contract, frontend, scripts, tests, documentation, and proposal in this conversation; the package includes its verification limitations. The team should review every part, run the actual chain workflows, revise/understand the implementation, and disclose assistance using the course's required format. No declaration of independent human-only authorship is included.
