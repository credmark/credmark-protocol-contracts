// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IModl.sol";

contract CredmarkRegistry is AccessControl {
    bytes32 public constant REGISTRY_ADMIN_ROLE =
        keccak256("REGISTRY_ADMIN_ROLE");
    bytes32 public constant CONFIGURATOR = keccak256("CONFIGURATOR");
    bytes32 public constant ALLOWANCE_ADMIN_ROLE =
        keccak256("ALLOWANCE_ADMIN_ROLE");

    IModl public modl;
    IERC20 public cmk;
    address public revenueTreasury;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
