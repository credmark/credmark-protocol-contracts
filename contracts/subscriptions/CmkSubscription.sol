// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./StableTokenSubscription.sol";

contract CmkSubscription is StableTokenSubscription {
    constructor(ConstructorParams memory params)
        StableTokenSubscription(params, 7e6, 18)
    {}
}
