// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./GenericSubscription.sol";

contract CmkSubscription is GenericSubscription {
    constructor(ConstructorParams memory params) GenericSubscription(params) {}
}
