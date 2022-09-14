// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

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
        require(
            newConfig.modlPercentToDao <= 100,
            "CRevenueTreasury:CONFIG_VALUE_ERROR:modlPercentToDao"
        );
        require(
            newConfig.daoAddress != address(0),
            "CRevenueTreasury:CONFIG_VALUE_ERROR:daoAddress"
        );
        config = newConfig;
        _postConfiguration();
    }

    IModl public immutable modl;
    Configuration config;
}
