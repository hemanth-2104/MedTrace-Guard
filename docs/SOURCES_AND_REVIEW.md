# Sources and Attribution

## Scope and interpretation

MedTrace Guard is an educational prototype with synthetic medicine batches and simulated temperature reports. References provide background and implementation guidance; they do not establish physical medicine authenticity, clinical benefit, regulatory compliance, production security or first-in-literature originality.

- FDA's DSCSA material concerns interoperable package-level tracing of certain prescription drugs. This batch-level prototype does not establish DSCSA compliance, and public verification or blockchain should not be presented as mandated by that law.
- Centralized systems can use signatures, access control, audit logs and interoperability standards. Hyperledger Fabric can support a public-facing read portal. A public chain is an architectural tradeoff, not evidence that other platforms cannot provide these functions.
- Certificate hashing verifies committed bytes, not issuer identity, laboratory quality or physical authenticity. QR labels can be copied.
- An IPFS CID does not guarantee permanent availability. Pinning/retrieval and the independent raw-file SHA-256 are different concerns.
- The WHO reference below is its **2017 analysis**; it is not a current universal rate or a 2023 study.
- Testnet operations consume test tokens and remain subject to faucet, fee and RPC constraints.

## Primary references

| Source | Use in this project |
|---|---|
| [WHO, 2017 analysis of substandard and falsified medical products](https://www.who.int/en/news/item/28-11-2017-1-in-10-medical-products-in-developing-countries-is-substandard-or-falsified) | Dated problem background; not a claim about current prevalence everywhere |
| [FDA: Drug Supply Chain Security Act](https://www.fda.gov/drugs/drug-supply-chain-integrity/drug-supply-chain-security-act-dscsa) | Regulatory context, with the scope limitations above |
| [Patrick Sylim, F. Liu, A. Marcelo and P. Fontelo, 2018, JMIR Research Protocols 7(9):e10163, DOI 10.2196/10163](https://www.researchprotocols.org/2018/9/e10163/) | Prior pharmaceutical-distribution research; not evidence that existing work is exclusively centralized |
| [IPFS persistence and pinning](https://docs.ipfs.tech/concepts/persistence/) | Availability and retention model for off-chain certificates |
| [Solidity security considerations](https://docs.soliditylang.org/en/latest/security-considerations.html) | Smart-contract implementation guidance |
| [OpenZeppelin access control](https://docs.openzeppelin.com/contracts/5.x/access-control) | Background guidance only; this project implements a small custom role registry and does not import OpenZeppelin contracts |

## Baseline attribution

`MedTraceBaseline.sol` was independently written from a supplied simplified description. The original source implementation was not supplied. It is not an exact reproduction or a claim that another author's real code lacks particular checks. Comparisons cover the two implementations in this repository and are qualified in [evaluation methods and results](EVALUATION.md).

## AI and tool assistance

An AI assistant generated the initial contracts, frontend, scripts, tests and documentation, and assisted with subsequent implementation, troubleshooting, documentation and verification. Node/npm, the Solidity compiler, Ganache, browser/MetaMask interactions, RPC reads, Kubo/gateways, GitHub Actions and Sonar were used during the recorded work. The repository does not claim independent human-only authorship or a completed independent production security audit.

Executed checks, dated public receipts and user-confirmed phone interactions are distinguished from mocked tests, model checks and unverified assumptions. See [verification](VERIFICATION.md), [public Amoy evidence](AMOY_LIVE.md) and [the Sonar review](SONAR_REVIEW.md). AI-generated material and tool results still require reviewer understanding and assessment of their stated limits.
