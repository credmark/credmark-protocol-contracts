// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "./Configurable.sol";

import "../interfaces/ISubscriptionRewardsIssuer.sol";
import "../interfaces/IPriceOracle.sol";

contract CSubscription is Configurable {
    struct ConstructorParams {
        address tokenAddress;
        address rewardsIssuerAddress;
    }

    struct Configuration {
        address oracleAddress;
        uint256 lockup;
        uint256 fee;
        uint256 multiplier;
        bool subscribable;
        uint256 floorPrice;
        uint256 ceilingPrice;
        address treasury;
    }

    constructor(ConstructorParams memory params) {
        token = IERC20(params.tokenAddress);
        rewardsIssuer = ISubscriptionRewardsIssuer(params.rewardsIssuerAddress);
    }

    function configure(Configuration memory newConfig) external {
        config = newConfig;
        oracle = IPriceOracle(newConfig.oracleAddress);
        _postConfiguration();
    }

    Configuration public config;

    IERC20 public immutable token;
    ISubscriptionRewardsIssuer internal immutable rewardsIssuer;
    IPriceOracle internal oracle;
}
