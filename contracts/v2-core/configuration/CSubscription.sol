// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../util/Configurable.sol";

import "../interfaces/ISubscriptionRewardsIssuer.sol";
import "../interfaces/ISubscription.sol";

abstract contract CSubscription is Configurable {
    struct ConstructorParams {
        address tokenAddress;
        address rewardsIssuerAddress;
    }

    struct Configuration {
        uint256 lockup;
        uint256 fee;
        uint256 multiplier;
        uint256 floorPrice;
        address treasury;
    }

    IERC20 public immutable token;
    ISubscriptionRewardsIssuer internal immutable rewardsIssuer;

    Configuration public config;

    constructor(ConstructorParams memory params) {
        token = IERC20(params.tokenAddress);
        rewardsIssuer = ISubscriptionRewardsIssuer(params.rewardsIssuerAddress);
    }
}
