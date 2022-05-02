// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Registry.sol";

contract PoolRegistry is Registry {
    constructor(address registryManager) Registry(registryManager) {}
}
