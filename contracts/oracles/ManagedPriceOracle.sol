// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IPriceOracle.sol";
import "../configuration/CManagedPriceOracle.sol";

/// @title ManagedPriceOracle
/// @author Credmark
/// @notice Allows a Manager to set the oracle price to be consumed by other contracts
/// @dev Since subscriptions must have oracles with a decimals() of 8, we only allow for setting of price, not
/// decimals
contract ManagedPriceOracle is IPriceOracle, CManagedPriceOracle {
    constructor(ConstructorParams memory params) CManagedPriceOracle(params) {}

    function setPrice(uint256 newPrice) external manager {
        _price = newPrice;
    }

    function price() external view override returns (uint256) {
        return _price;
    }

    function decimals() external view override returns (uint8) {
        return 8;
    }
}
