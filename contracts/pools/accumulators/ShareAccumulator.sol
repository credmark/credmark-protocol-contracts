// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ShareAccumulator is AccessControl {

    mapping(address => int) public shares;
    mapping(address => int) public accumulators;
    mapping(address => uint) public accumulator_ts;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function updateShares(address account, int newShares) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "CMERR: Cannot manually set global shares.");

        accumulators[address(0)] = totalAccumulation();
        accumulators[account] = accumulators[address(0)] - accumulation(account);

        accumulator_ts[address(0)] = block.timestamp;
        accumulator_ts[account] = block.timestamp;

        shares[address(0)] += newShares;
        shares[account] += newShares;
    }

    function advanceAccumulator(address account, int accumulation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        accumulators[account] += accumulation;
    }

    function accumulation(address account) view public returns (int) {
        return int(block.timestamp - accumulator_ts[account]) * shares[account] - accumulators[account];
    }

    function totalAccumulation() view public returns (int) {
        return accumulators[address(0)] + accumulation(address(0));
    }
}