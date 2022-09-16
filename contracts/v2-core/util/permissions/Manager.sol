// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Permissioned.sol";

abstract contract Manager is Permissioned {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER");

    modifier manager() {
        _checkRole(MANAGER_ROLE);
        _;
    }
}
