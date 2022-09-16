// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Subscription.sol";

contract StableTokenSubscription is Subscription {
    uint8 internal immutable _tokenDecimals;

    constructor(
        ConstructorParams memory params,
        uint256 price,
        uint8 tokenDecimals
    ) Subscription(params) {
        setPrice(price);
        _tokenDecimals = tokenDecimals;
    }

    function snapshot() public override {
        uint256 shares = (share[GLOBALS] *
            (10**(18 - _tokenDecimals)) *
            config.multiplier) / (10**8);
        rewardsIssuer.setShares(shares);
    }
}
