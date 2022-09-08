// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./Configurable.sol";
import "../interfaces/IModl.sol";

abstract contract CModlAllowance is Configurable {
    struct ConstructorParams {
        address modlAddress;
    }

    struct Configuration {
        uint256 ceiling;
    }

    constructor(ConstructorParams memory params) {
        modl = IModl(params.modlAddress);
    }

    function configure(Configuration memory newConfig) external {
        config = newConfig;
        _postConfiguration();
    }

    IModl public immutable modl;
    Configuration config;
}
