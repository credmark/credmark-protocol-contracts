// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../../libraries/Time.sol";

contract PriceAccumulator is AccessControl {
    bytes32 public constant ACCUMULATOR_ROLE = keccak256("ACCUMULATOR_ROLE");

    uint8 public constant decimals = 8;
    mapping(address => uint) prices;
    mapping(address => uint) offset;
    mapping(address => uint) offset_ts;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setPrice(address token, uint newPrice) external onlyRole(ACCUMULATOR_ROLE) {
        offset[token] = getOffset(token);
        offset_ts[token] = Time.now_u256();
        prices[token] = newPrice;
    }

    function getOffset(address token) view public returns (uint) {
        if (prices[token] == 0) {
            return 0;
        }
        return Time.since(offset_ts[token]) * (10 ** decimals) / prices[token] + offset[token];
    }

}