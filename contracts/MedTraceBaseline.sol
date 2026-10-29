// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
/// @notice Controlled simplified baseline; NOT a reproduction of another author's implementation.
contract MedTraceBaseline {
    enum Role { None, Manufacturer, Distributor, Pharmacy, Regulator }
    struct Batch { address custodian; uint64 expiresAt; uint64 remaining; bytes32 digest; bool recalled; }
    address public admin = msg.sender;
    mapping(address => Role) public roleOf;
    mapping(uint256 => Batch) public batches;
    uint256 public batchCount;
    event Registered(uint256 indexed id, address indexed manufacturer);
    event Transferred(uint256 indexed id, address indexed from, address indexed to);
    event Dispensed(uint256 indexed id, uint64 units);
    event Recalled(uint256 indexed id);
    function assignRole(address a, Role r) external { require(msg.sender == admin && a != address(0), "denied"); roleOf[a] = r; }
    function registerBatch(uint64 expiresAt, uint64 units, bytes32 digest) external returns(uint256 id) {
        require(roleOf[msg.sender] == Role.Manufacturer && units > 0 && digest != bytes32(0), "invalid");
        id = ++batchCount; batches[id] = Batch(msg.sender, expiresAt, units, digest, false); emit Registered(id, msg.sender);
    }
    function transferCustody(uint256 id, address to) external {
        Batch storage b = batches[id]; require(b.custodian == msg.sender && roleOf[to] != Role.None, "denied");
        address previous = b.custodian; b.custodian = to; emit Transferred(id, previous, to);
    }
    function dispense(uint256 id, uint64 units) external {
        Batch storage b = batches[id]; require(b.custodian == msg.sender && roleOf[msg.sender] == Role.Pharmacy && units > 0 && units <= b.remaining, "denied");
        b.remaining -= units; emit Dispensed(id, units);
    }
    function recallBatch(uint256 id) external {
        require(roleOf[msg.sender] == Role.Regulator && id > 0 && id <= batchCount, "denied");
        batches[id].recalled = true; emit Recalled(id);
    }
}
