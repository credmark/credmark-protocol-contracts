// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IModl.sol";

abstract contract CSubscriptionRewardsIssuer {
    struct ConstructorParams {
        address modlAddress;
    }

    constructor(ConstructorParams memory params) {
        modl = IModl(params.modlAddress);
    }

    IModl public immutable modl;
}
