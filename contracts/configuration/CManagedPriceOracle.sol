// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Configurable.sol";

abstract contract CManagedPriceOracle is Configurable {
    struct ConstructorParams {
        address tokenAddress;
        uint256 initialPrice;
        uint8 initialDecimals;
    }

    struct Configuration {
        uint256 price;
        uint8 decimals;
    }

    constructor(ConstructorParams memory params) {
        token = params.tokenAddress;
        config = Configuration(params.initialPrice, params.initialDecimals);
        _configured = true;
    }

    function configure(Configuration memory newConfig) external {
        config = newConfig;
        _postConfiguration();
    }

    address public immutable token;
    Configuration config;
}
