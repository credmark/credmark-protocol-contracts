// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

import "../interfaces/IModl.sol";
import "../configuration/Permissioned.sol";

contract Modl is
    ERC20,
    ERC20Snapshot,
    Permissioned,
    Pausable,
    ERC20Permit,
    IModl
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Modl", "MODL") ERC20Permit("Modl") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function snapshot() external manager {
        _snapshot();
    }

    function pause() external configurer {
        _pause();
    }

    function unpause() external configurer {
        _unpause();
    }

    function mint(address to, uint256 amount)
        external
        override
        onlyRole(MINTER_ROLE)
    {
        _mint(to, amount);
    }

    function burn(uint256 amount) external override {
        _burn(_msgSender(), amount);
        emit Burn(amount);
    }

    function burnFrom(address account, uint256 amount) external override {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
        emit Burn(amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Snapshot) whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
