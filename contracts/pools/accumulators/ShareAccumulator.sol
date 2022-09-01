// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../../libraries/Time.sol";

contract ShareAccumulator is AccessControl {

    bytes32 public constant ACCUMULATOR_ROLE = keccak256("ACCUMULATOR_ROLE");
    uint internal constant R = 10**18;

    mapping(address => uint) public shares;
    mapping(address => uint) internal offset;
    mapping(address => uint) internal accumulations;

    uint internal gShares;
    uint internal gOffset;
    uint internal gOffTimestamp;
    uint internal gAccumulation;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setShares(address account, uint newShares) external onlyRole(ACCUMULATOR_ROLE) {
        accumulations[account] = accumulation(account);
        offset[account] = globalOffset();
        gAccumulation = totalAccumulation();
        gOffset = offset[account];
        gOffTimestamp = Time.now_u256();
        gShares = gShares + newShares - shares[account];
        shares[account] = newShares;
    }

    function removeAccumulation(address account) external onlyRole(ACCUMULATOR_ROLE) {
        gAccumulation = totalAccumulation() - accumulation(account);
        offset[account] = globalOffset();
        gOffTimestamp = Time.now_u256();
        gOffset = offset[account];
        accumulations[account] = 0;
    }

    function accumulation(address account) public view returns (uint) {
        return shares[account] * ( globalOffset() - offset[account] ) + accumulations[account];
    }

    function globalOffset() internal view returns (uint) {
        return gShares == 0 ? gOffset : gOffset + (Time.since(gOffTimestamp) * R / gShares);
    }

    function totalAccumulation() public view returns (uint) {
        return gShares * (globalOffset() - gOffset) + gAccumulation;
    }

    function getShares(address account) external view returns (uint) {
        return shares[account];
    }
}