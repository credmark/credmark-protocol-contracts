// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../util/Configurable.sol";

import "../interfaces/IModl.sol";

abstract contract CRevenueTreasury is Configurable {
    struct ConstructorParams {
        address modlAddress;
    }

    struct Configuration {
        address daoAddress;
        uint256 modlPercentToDao;
    }

    IModl public immutable modl;

    Configuration public config;

    constructor(ConstructorParams memory params) {
        modl = IModl(params.modlAddress);
    }

    function configure(Configuration memory newConfig) external {
        require(newConfig.modlPercentToDao <= 100, "VE:modlPercentToDao");
        require(newConfig.daoAddress != address(0), "NA");
        config = newConfig;
        _postConfiguration();
    }
}
