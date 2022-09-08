// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/IPriceOracle.sol";
import "../configuration/CManagedPriceOracle.sol";

contract ManagedPriceOracle is IPriceOracle, CManagedPriceOracle {
    constructor(ConstructorParams memory params) CManagedPriceOracle(params) {}

    function price() external view override returns (uint256) {
        return config.price;
    }

    function decimals() external view override returns (uint8) {
        return config.decimals;
    }
}
