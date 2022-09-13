// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract Permissioned is AccessControl {
    bytes32 public constant CONFIGURER_ROLE = keccak256("CONFIGURER");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER");

    modifier configurer() {
        _checkRole(CONFIGURER_ROLE);
        _;
    }

    modifier manager() {
        _checkRole(MANAGER_ROLE);
        _;
    }

    modifier managerOr(address account) {
        if (msg.sender != account) {
            _checkRole(MANAGER_ROLE);
        }
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
