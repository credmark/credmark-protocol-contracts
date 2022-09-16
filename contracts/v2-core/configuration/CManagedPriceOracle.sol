// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../util/Configurable.sol";

abstract contract CManagedPriceOracle {
    struct ConstructorParams {
        address tokenAddress;
        uint256 initialPrice;
    }

    address public immutable token;
    uint256 internal _price;

    constructor(ConstructorParams memory params) {
        token = params.tokenAddress;
        _price = params.initialPrice;
    }
}
