// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./Configurable.sol";

contract CModlAllowance is Configurable {
    struct ConstructorParams {
        address modl;
    }

    struct Configuration {
        address modlAddress;
        uint256 ceiling;
    }
    Configuration config;

    function configure(Configuration memory newConfig) external configurer {
        if (_configured) {
            require(newConfig.modlAddress == config.modlAddress);
        }
        config = newConfig;
        _configured = true;
    }
}
