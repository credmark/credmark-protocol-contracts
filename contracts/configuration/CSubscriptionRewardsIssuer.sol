// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./Configurable.sol";

contract CSubscriptionRewardsIssuer is Configurable {
    struct ConstructorParams {
        address modlAddress;
        address modlAllowance;
    }

    struct Configuration {
        uint256 amountPerAnnum;
    }

    Configuration config;

    function configure(Configuration memory newConfig) external {
        config = newConfig;
        _postConfiguration();
    }
}
