// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../libraries/Time.sol";

contract PriceAccumulator is AccessControl {
    bytes32 public constant ACCUMULATOR_ROLE = keccak256("ACCUMULATOR_ROLE");

    uint8 public constant decimals = 8;

    uint256 public price;
    uint256 internal offst;
    uint256 internal snapt;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ACCUMULATOR_ROLE, msg.sender);
    }

    function setPrice(uint256 newPrice) external onlyRole(ACCUMULATOR_ROLE) {
        offst = offset();
        snapt = Time.now_u256();
        price = newPrice;
    }

    function offset() public view returns (uint256) {
        return
            price == 0
                ? offst
                : (Time.since(offst) * (10**decimals)) / price + offst;
    }
}
