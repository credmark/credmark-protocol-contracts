// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./Configurable.sol";

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

    Configuration public config;

    function configure(Configuration memory newConfig) external {
        config = newConfig;
        _postConfiguration();
    }
}
