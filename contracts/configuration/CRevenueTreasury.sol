// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Configurable.sol";

import "../interfaces/IModl.sol";

abstract contract CRevenueTreasury is Configurable {
    struct ConstructorParams {
        address modlAddress;
    }

    struct Configuration {
        address daoAddress;
        uint256 modlPercentToDao;
    }

    constructor(ConstructorParams memory params) {
        modl = IModl(params.modlAddress);
    }

    function configure(Configuration memory newConfig) external {
        require(newConfig.modlPercentToDao <= 100, "IC");
        require(newConfig.daoAddress != address(0x0), "IC");
        config = newConfig;
        _postConfiguration();
    }

    IModl public immutable modl;
    Configuration config;
}
