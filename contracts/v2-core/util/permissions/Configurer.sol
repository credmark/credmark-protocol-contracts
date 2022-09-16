// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Permissioned.sol";

abstract contract Configurer is Permissioned {
    bytes32 public constant CONFIGURER_ROLE = keccak256("CONFIGURER");

    modifier configurer() {
        _checkRole(CONFIGURER_ROLE);
        _;
    }
}
