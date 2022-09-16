// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";

import "../interfaces/IModl.sol";
import "../configuration/Permissioned.sol";
import "./ERC20Allowance.sol";

contract Modl is
    ERC20,
    ERC20Snapshot,
    ERC20Allowance,
    Permissioned,
    Pausable,
    ERC20Permit,
    IModl
{
    constructor(uint256 launchLiquidity, uint256 ceiling)
        ERC20("Modl", "MODL")
        ERC20Permit("Modl")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _addAllowance(msg.sender, launchLiquidity);
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

    function grantAllowance(address account, uint256 annualAllowance)
        external
        configurer
    {
        _setAllowance(account, annualAllowance);
    }

    function grantVestingAllowance(
        address account,
        uint256 annualAllowance,
        uint256 end
    ) external configurer {
        _setAllowance(account, annualAllowance, end);
    }

    function emergencyStopAllowance(address account) external configurer {
        _stopAllowance(account);
    }

    function mint(address to, uint256 amount) external override {
        _mint(to, amount);
    }

    function totalInflation() external view returns (uint256) {
        return totalAnnualAllowance;
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
    ) internal override(ERC20, ERC20Snapshot, ERC20Allowance) whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
