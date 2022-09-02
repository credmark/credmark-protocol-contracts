// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "../interfaces/IModl.sol";

contract Modl is
    ERC20,
    ERC20Snapshot,
    AccessControl,
    Pausable,
    ERC20Permit,
    IModl
{
    bytes32 public constant SNAPSHOT_ROLE = keccak256("SNAPSHOT_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Modl", "MODL") ERC20Permit("Modl") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SNAPSHOT_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
    }

    function snapshot() public override onlyRole(SNAPSHOT_ROLE) {
        _snapshot();
    }

    function pause() public override onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() public override onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(address to, uint256 amount)
        public
        override
        onlyRole(MINTER_ROLE)
    {
        _mint(to, amount);
    }

    function burn(uint256 amount) public override {
        _burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) public override {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
