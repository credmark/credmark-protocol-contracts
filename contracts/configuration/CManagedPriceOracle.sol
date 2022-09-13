// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Configurable.sol";

abstract contract CManagedPriceOracle is Configurable {
    struct ConstructorParams {
        address tokenAddress;
        uint256 initialPrice;
    }

    constructor(ConstructorParams memory params) {
        token = params.tokenAddress;
        _price = params.initialPrice;
    }

    address public immutable token;
    uint256 internal _price;
}
