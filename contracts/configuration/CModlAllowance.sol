// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./Configurable.sol";

contract CModlAllowance is Configurable {
    struct ConstructorParams {
        address modlAddress;
    }

    struct Configuration {
        uint256 ceiling;
    }

    Configuration config;

    function configure(Configuration memory newConfig) external {
        config = newConfig;
        _postConfiguration();
    }
}
