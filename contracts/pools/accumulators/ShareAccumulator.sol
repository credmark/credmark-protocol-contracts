// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract ShareAccumulator is AccessControl {

    mapping(address => uint) public shares;
    mapping(address => uint) public accumulators;
    mapping(address => uint) public accumulator_ts;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function updateShares(address account, uint newShares) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(account != address(0), "CMERR: Cannot manually set global shares.");

        accumulators[address(0)] = totalAccumulation();
        accumulator_ts[address(0)] = block.timestamp;

        accumulators[account] = accumulation(account);
        accumulator_ts[account] = block.timestamp;

        shares[address(0)] += newShares - shares[account];
        shares[account] = newShares;
    }

    function advanceAccumulator(address account, uint accumulation) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(accumulation > accumulators[account], "CMERR");
        accumulators[account] -= accumulation;
        accumulators[address(0)] -= accumulation;
    }

    function accumulation(address account) view public returns (uint) {
        return _ts_delta(account) * shares[account] + accumulators[account];
    }

    function totalAccumulation() view public returns (uint) {
        return  _ts_delta(address(0)) * shares[address(0)] + accumulators[address(0)];
    }

    function _ts_delta(address account) private view returns (uint) {
        return block.timestamp - accumulator_ts[account];
    }
}