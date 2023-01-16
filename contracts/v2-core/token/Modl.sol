// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

import "../interfaces/IModl.sol";
import "../util/permissions/Manager.sol";
import "../util/permissions/Configurer.sol";
import "./ERC20MintAllowance.sol";

contract Modl is
    ERC20,
    ERC20Snapshot,
    ERC20MintAllowance,
    Configurer,
    Manager,
    Pausable,
    ERC20Permit,
    IModl
{
    constructor(uint256 launchLiquidity, uint256 ceiling)
        ERC20("Modl", "MODL")
        ERC20Permit("Modl")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _addMintAllowance(msg.sender, launchLiquidity);
        inflationCeiling = ceiling;
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

    function grantMintAllowance(address account, uint256 annualMintAllowance)
        external
        configurer
    {
        _setMintAllowance(account, annualMintAllowance);
    }

    function grantVestingMintAllowance(
        address account,
        uint256 annualMintAllowance,
        uint256 end
    ) external configurer {
        _setMintAllowance(account, annualMintAllowance, end);
    }

    function emergencyStopMintAllowance(address account) external configurer {
        _stopMintAllowance(account);
    }

    function mint(address to, uint256 amount) external override {
        _mint(to, amount);
    }

    function totalInflation() external view returns (uint256) {
        return totalAnnualMintAllowance;
    }

    function burn(uint256 amount) external override {
        _burn(_msgSender(), amount);
        emit Burn(_msgSender(), amount);
    }

    function burnFrom(address account, uint256 amount) external {
        _spendAllowance(account, _msgSender(), amount);
        _burn(account, amount);
        emit Burn(account, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    )
        internal
        override(ERC20, ERC20Snapshot, ERC20MintAllowance)
        whenNotPaused
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}
