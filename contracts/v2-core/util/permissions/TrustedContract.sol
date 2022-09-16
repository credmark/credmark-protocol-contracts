// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Permissioned.sol";

abstract contract TrustedContract is Permissioned {
    bytes32 public constant TRUSTED_CONTRACT_ROLE =
        keccak256("TRUSTED_CONTRACT_ROLE");

    modifier trustedContract() {
        _checkRole(TRUSTED_CONTRACT_ROLE);
        _;
    }
}
