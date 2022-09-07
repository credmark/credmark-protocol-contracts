// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract Permissioned is AccessControl {
    bytes32 public constant CONFIGURER_ROLE = keccak256("CONFIGURER");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER");
    bytes32 public constant TRUSTED_CONTRACT_ROLE =
        keccak256("TRUSTED_CONTRACT_ROLE");

    modifier configurer() {
        _checkRole(CONFIGURER_ROLE);
        _;
    }

    modifier manager() {
        _checkRole(MANAGER_ROLE);
        _;
    }

    modifier managerOr(address account) {
        require(
            msg.sender == account || hasRole(MANAGER_ROLE, msg.sender),
            "unauthorized"
        );
        _;
    }

    modifier trustedContract() {
        _checkRole(TRUSTED_CONTRACT_ROLE);
        _;
    }

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(CONFIGURER_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }
}
