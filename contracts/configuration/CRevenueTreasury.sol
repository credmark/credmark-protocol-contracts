// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./Configurable.sol";

contract CRevenueTreasury is Configurable {
    struct ConstructorParams {
        address modlAddress;
    }

    struct Configuration {
        address daoAddress;
        uint256 modlPercentToDao;
    }

    Configuration config;

    function configure(Configuration memory newConfig) external configurer {
        require(newConfig.modlPercentToDao <= 100, "CONFIG");
        require(newConfig.daoAddress != address(0x0), "CONFIG");
        config = newConfig;
        _configured = true;
    }
}
