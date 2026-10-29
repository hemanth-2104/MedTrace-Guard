// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

/// @title MedTrace Guard - educational pharmaceutical batch provenance.
/// @notice Reports are assertions by authorized accounts, not independent proof of quality.
contract MedTraceGuard {
    enum Role { None, Manufacturer, Distributor, Pharmacy, Regulator }
    enum Stage { Manufactured, AtDistributor, AtPharmacy, Dispensed }
    enum Kind { Registered, TransferProposed, TransferAccepted, TransferCancelled, Dispensed, ConditionReported, HoldReleased, Recalled }
    struct Batch {
        string code; string drug; string certificateURI; bytes32 certificateSHA256;
        address manufacturer; address custodian; uint64 manufacturedAt; uint64 expiresAt;
        uint64 totalUnits; uint64 remainingUnits; int32 minTemp; int32 maxTemp;
        Stage stage; bool recalled; bool hold;
    }
    struct Pending { address recipient; uint64 deadline; uint64 nonce; }
    struct Entry { Kind kind; address actor; address counterparty; uint64 timestamp; bytes32 evidence; int32 value; uint64 units; }
    address public admin;
    address public pendingAdmin;
    uint256 public batchCount;
    mapping(address => Role) public roleOf;
    mapping(uint256 => Batch) private batches;
    mapping(uint256 => Pending) public pending;
    mapping(uint256 => uint64) public transferNonce;
    mapping(bytes32 => bool) private registeredCodes;
    mapping(uint256 => Entry[]) private history;
    event RoleAssigned(address indexed account, Role role);
    event AdminProposed(address indexed nominee);
    event AdminChanged(address indexed account);
    event Recorded(uint256 indexed batchId, Kind indexed kind, address indexed actor, address counterparty, bytes32 evidence, int32 value, uint64 units);
    error Denied(); error UnknownBatch(); error InvalidInput(); error Blocked(); error InvalidTransfer(); error DuplicateBatch();
    modifier onlyAdmin() { if (msg.sender != admin) revert Denied(); _; }
    modifier onlyRole(Role r) { if (roleOf[msg.sender] != r) revert Denied(); _; }
    constructor() { admin = msg.sender; }
    function assignRole(address account, Role role) external onlyAdmin {
        if (account == address(0)) revert InvalidInput();
        roleOf[account] = role; emit RoleAssigned(account, role);
    }
    function proposeAdmin(address nominee) external onlyAdmin {
        if (nominee == address(0)) revert InvalidInput();
        pendingAdmin = nominee; emit AdminProposed(nominee);
    }
    function acceptAdmin() external {
        if (msg.sender != pendingAdmin) revert Denied();
        admin = msg.sender; pendingAdmin = address(0); emit AdminChanged(msg.sender);
    }
    /// @param minTemp Temperature in tenths of a degree Celsius, e.g. 20 = 2 C.
    function registerBatch(string calldata code, string calldata drug, uint64 manufacturedAt,
        uint64 expiresAt, uint64 totalUnits, int32 minTemp, int32 maxTemp,
        string calldata certificateURI, bytes32 certificateSHA256)
        external onlyRole(Role.Manufacturer) returns (uint256 id)
    {
        if (bytes(code).length == 0 || bytes(code).length > 64 || bytes(drug).length == 0 ||
            bytes(drug).length > 96 || bytes(certificateURI).length == 0 || bytes(certificateURI).length > 200 ||
            certificateSHA256 == bytes32(0) || manufacturedAt > block.timestamp ||
            expiresAt <= block.timestamp || manufacturedAt >= expiresAt || totalUnits == 0 ||
            minTemp >= maxTemp || minTemp < -1000 || maxTemp > 1000) revert InvalidInput();
        bytes32 key = keccak256(abi.encode(msg.sender, code));
        if (registeredCodes[key]) revert DuplicateBatch();
        registeredCodes[key] = true; id = ++batchCount;
        batches[id] = Batch(code, drug, certificateURI, certificateSHA256, msg.sender, msg.sender,
            manufacturedAt, expiresAt, totalUnits, totalUnits, minTemp, maxTemp, Stage.Manufactured, false, false);
        _record(id, Kind.Registered, address(0), certificateSHA256, 0, totalUnits);
    }
    function _batch(uint256 id) internal view returns (Batch storage b) {
        if (id == 0 || id > batchCount) revert UnknownBatch(); b = batches[id];
    }
    function _usable(Batch storage b) internal view {
        if (b.recalled || b.hold || block.timestamp >= b.expiresAt || b.remainingUnits == 0) revert Blocked();
    }
    function _custodian(Batch storage b) internal view {
        if (msg.sender != b.custodian || roleOf[msg.sender] == Role.None) revert Denied();
    }
    function _recipientRole(Stage s) internal pure returns (Role) {
        if (s == Stage.Manufactured) return Role.Distributor;
        if (s == Stage.AtDistributor) return Role.Pharmacy;
        revert InvalidTransfer();
    }
    function proposeTransfer(uint256 id, address recipient, uint64 deadline) external {
        Batch storage b = _batch(id); _custodian(b); _usable(b);
        Role expectedSender = b.stage == Stage.Manufactured ? Role.Manufacturer : Role.Distributor;
        if (roleOf[msg.sender] != expectedSender) revert Denied();
        if (recipient == address(0) || recipient == msg.sender || roleOf[recipient] != _recipientRole(b.stage) ||
            pending[id].recipient != address(0) || deadline <= block.timestamp ||
            deadline > block.timestamp + 7 days || deadline > b.expiresAt) revert InvalidTransfer();
        uint64 nonce = ++transferNonce[id]; pending[id] = Pending(recipient, deadline, nonce);
        _record(id, Kind.TransferProposed, recipient, bytes32(uint256(nonce)), 0, b.remainingUnits);
    }
    function acceptTransfer(uint256 id, uint64 nonce) external {
        Batch storage b = _batch(id); _usable(b); Pending memory req = pending[id];
        if (req.recipient == address(0) || req.recipient != msg.sender || req.nonce != nonce ||
            block.timestamp >= req.deadline || roleOf[msg.sender] != _recipientRole(b.stage) ||
            roleOf[b.custodian] != (b.stage == Stage.Manufactured ? Role.Manufacturer : Role.Distributor)) revert InvalidTransfer();
        address previous = b.custodian; delete pending[id]; b.custodian = msg.sender;
        b.stage = b.stage == Stage.Manufactured ? Stage.AtDistributor : Stage.AtPharmacy;
        _record(id, Kind.TransferAccepted, previous, bytes32(uint256(nonce)), 0, b.remainingUnits);
    }
    function cancelTransfer(uint256 id) external {
        Batch storage b = _batch(id); Pending memory req = pending[id];
        if (req.recipient == address(0)) revert InvalidTransfer();
        if (msg.sender != b.custodian && msg.sender != req.recipient && roleOf[msg.sender] != Role.Regulator) revert Denied();
        delete pending[id]; _record(id, Kind.TransferCancelled, req.recipient, bytes32(uint256(req.nonce)), 0, 0);
    }
    function dispense(uint256 id, uint64 units) external onlyRole(Role.Pharmacy) {
        Batch storage b = _batch(id); _custodian(b); _usable(b);
        if (b.stage != Stage.AtPharmacy || units == 0 || units > b.remainingUnits) revert InvalidInput();
        b.remainingUnits -= units; if (b.remainingUnits == 0) b.stage = Stage.Dispensed;
        _record(id, Kind.Dispensed, address(0), bytes32(0), 0, units);
    }
    /// @notice Authorized simulated readings. No independent oracle or sensor authenticity is claimed.
    function reportTemperature(uint256 id, int32 value, bytes32 evidence) external {
        Batch storage b = _batch(id);
        if ((msg.sender != b.custodian || roleOf[msg.sender] == Role.None) && roleOf[msg.sender] != Role.Regulator) revert Denied();
        if (evidence == bytes32(0) || value < -1000 || value > 1000 || b.remainingUnits == 0 || b.recalled) revert InvalidInput();
        if (value < b.minTemp || value > b.maxTemp) b.hold = true;
        _record(id, Kind.ConditionReported, address(0), evidence, value, 0);
    }
    function releaseHold(uint256 id, bytes32 reviewEvidence) external onlyRole(Role.Regulator) {
        Batch storage b = _batch(id);
        if (!b.hold || b.recalled || reviewEvidence == bytes32(0)) revert InvalidInput();
        b.hold = false; _record(id, Kind.HoldReleased, address(0), reviewEvidence, 0, 0);
    }
    function recallBatch(uint256 id, bytes32 reason) external onlyRole(Role.Regulator) {
        Batch storage b = _batch(id);
        if (b.recalled || reason == bytes32(0)) revert InvalidInput();
        b.recalled = true; delete pending[id]; _record(id, Kind.Recalled, address(0), reason, 0, b.remainingUnits);
    }
    function getBatch(uint256 id) external view returns (Batch memory) { return _batch(id); }
    function eligibility(uint256 id) external view returns (bool eligible, uint8 reason) {
        Batch storage b = _batch(id);
        if (b.recalled) return (false, 1);
        if (block.timestamp >= b.expiresAt) return (false, 2);
        if (b.hold) return (false, 3);
        if (b.remainingUnits == 0) return (false, 4);
        return (true, 0);
    }
    function historyCount(uint256 id) external view returns (uint256) { _batch(id); return history[id].length; }
    function getHistory(uint256 id, uint256 offset, uint256 limit) external view returns (Entry[] memory page) {
        _batch(id); if (limit == 0 || limit > 100) revert InvalidInput();
        uint256 n = history[id].length;
        if (offset >= n) return new Entry[](0);
        uint256 end = offset + (limit < n - offset ? limit : n - offset);
        page = new Entry[](end - offset);
        for (uint256 i = offset; i < end; ++i) page[i-offset] = history[id][i];
    }
    function _record(uint256 id, Kind kind, address counterparty, bytes32 evidence, int32 value, uint64 units) internal {
        history[id].push(Entry(kind, msg.sender, counterparty, uint64(block.timestamp), evidence, value, units));
        emit Recorded(id, kind, msg.sender, counterparty, evidence, value, units);
    }
}
