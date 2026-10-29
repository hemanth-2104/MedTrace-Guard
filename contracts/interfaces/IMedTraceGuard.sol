// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @title MedTrace Guard public interface and design draft.
/// @notice Documents the implemented ABI without changing deployed source.
/// @dev Implementation: MedTraceGuard.sol. check:interface verifies ABI equivalence.
interface IMedTraceGuard {
    /// @notice Admin-assigned stakeholder identity; None revokes privileges.
    enum Role { None, Manufacturer, Distributor, Pharmacy, Regulator }
    /// @notice Custody lifecycle, independent of recall and temperature hold.
    enum Stage { Manufactured, AtDistributor, AtPharmacy, Dispensed }
    /// @notice Operation categories in the append-only provenance history.
    enum Kind { Registered, TransferProposed, TransferAccepted, TransferCancelled, Dispensed, ConditionReported, HoldReleased, Recalled }

    /// @notice Metadata, custody, inventory, and safety state; no patient data.
    /// @dev Temperatures use tenths of a degree Celsius; timestamps use Unix seconds.
    struct Batch {
        string code; string drug; string certificateURI; bytes32 certificateSHA256;
        address manufacturer; address custodian; uint64 manufacturedAt; uint64 expiresAt;
        uint64 totalUnits; uint64 remainingUnits; int32 minTemp; int32 maxTemp;
        Stage stage; bool recalled; bool hold;
    }
    /// @notice Named-recipient proposal; custody stays with sender until acceptance.
    struct Pending { address recipient; uint64 deadline; uint64 nonce; }
    /// @notice Immutable history item; evidence is a digest of off-chain material.
    struct Entry { Kind kind; address actor; address counterparty; uint64 timestamp; bytes32 evidence; int32 value; uint64 units; }

    /// @notice Administrator assigned or revoked a stakeholder role.
    event RoleAssigned(address indexed account, Role role);
    /// @notice Administrator nominated a successor.
    event AdminProposed(address indexed nominee);
    /// @notice Nominated successor accepted administration.
    event AdminChanged(address indexed account);
    /// @notice Emitted alongside each new provenance entry.
    event Recorded(uint256 indexed batchId, Kind indexed kind, address indexed actor, address counterparty, bytes32 evidence, int32 value, uint64 units);

    /// @notice Caller lacks required authority or custody.
    error Denied();
    /// @notice Batch identifier is outside the registered range.
    error UnknownBatch();
    /// @notice Invalid metadata, quantity, observation, evidence, or pagination input.
    error InvalidInput();
    /// @notice Recall, expiry, hold, or exhaustion prevents use.
    error Blocked();
    /// @notice Invalid recipient, stage, role, nonce, or deadline.
    error InvalidTransfer();
    /// @notice Manufacturer already registered this exact batch code.
    error DuplicateBatch();

    /// @notice Current administrator, separate from stakeholder roles.
    function admin() external view returns (address);
    /// @notice Nominated successor, or zero if none exists.
    function pendingAdmin() external view returns (address);
    /// @notice Registered batch count; valid identifiers begin at one.
    function batchCount() external view returns (uint256);
    /// @notice Current account role. Public reads require no role.
    function roleOf(address account) external view returns (Role);
    /// @notice Active proposal, or zero recipient when none exists.
    function pending(uint256 id) external view returns (address recipient, uint64 deadline, uint64 nonce);
    /// @notice Latest consumed nonce; cancellation does not reset it.
    function transferNonce(uint256 id) external view returns (uint64);

    /// @notice Administrator onboards a stakeholder or revokes with None.
    function assignRole(address account, Role role) external;
    /// @notice Administrator nominates a nonzero successor.
    function proposeAdmin(address nominee) external;
    /// @notice Only the nominee can accept administrative authority.
    function acceptAdmin() external;
    /// @notice Manufacturer creates immutable metadata, inventory, and initial custody.
    /// @dev Rejects duplicate manufacturer/code pairs, invalid dates, and zero digests.
    /// @param certificateURI Off-chain locator; this call does not upload a file.
    /// @param certificateSHA256 SHA-256 digest of exact certificate bytes.
    function registerBatch(string calldata code, string calldata drug, uint64 manufacturedAt,
        uint64 expiresAt, uint64 totalUnits, int32 minTemp, int32 maxTemp,
        string calldata certificateURI, bytes32 certificateSHA256) external returns (uint256 id);
    /// @notice Eligible custodian proposes the next stage's named recipient.
    /// @dev Future deadline is within seven days and no later than batch expiry.
    function proposeTransfer(uint256 id, address recipient, uint64 deadline) external;
    /// @notice Recipient accepts the active nonce before its deadline.
    /// @dev Rechecks safety and both roles; advances custody and clears pending.
    function acceptTransfer(uint256 id, uint64 nonce) external;
    /// @notice Sender, recipient, or regulator cancels a pending proposal.
    function cancelTransfer(uint256 id) external;
    /// @notice Current pharmacy dispenses positive units from an eligible batch.
    /// @dev Inventory cannot go negative; zero remaining units means Dispensed.
    function dispense(uint256 id, uint64 units) external;
    /// @notice Current authorized custodian or regulator records a simulated reading.
    /// @dev Excursions set a hold; normal readings cannot clear it.
    function reportTemperature(uint256 id, int32 value, bytes32 evidence) external;
    /// @notice Regulator releases a hold with nonzero review evidence.
    /// @dev Does not undo recall, expiry, or exhaustion.
    function releaseHold(uint256 id, bytes32 reviewEvidence) external;
    /// @notice Regulator permanently recalls a batch and clears pending shipment.
    function recallBatch(uint256 id, bytes32 reason) external;
    /// @notice Public batch lookup; unknown identifiers revert.
    function getBatch(uint256 id) external view returns (Batch memory);
    /// @notice Safety eligibility, separate from caller and shipment authorization.
    /// @return eligible True when no safety or inventory gate blocks the batch.
    /// @return reason 0=eligible, 1=recalled, 2=expired, 3=held, 4=exhausted.
    function eligibility(uint256 id) external view returns (bool eligible, uint8 reason);
    /// @notice History length for a known batch.
    function historyCount(uint256 id) external view returns (uint256);
    /// @notice Public page capped at 100 entries; past-end offset returns empty.
    function getHistory(uint256 id, uint256 offset, uint256 limit) external view returns (Entry[] memory page);
}
