// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IModl.sol";
import "../libraries/Time.sol";

contract ModlAllowance is AccessControl {
    bytes32 public constant ALLOWANCE_MANAGER = keccak256("ALLOWANCE_MANAGER");

    uint private _perAnnum = 86400 * 365;

    struct Allowance {
        uint64 start;
        uint amountPerAnnum;
    }

    mapping(address => Allowance) public allowance;

    uint public totalAllowancePerAnnum;
    uint public totalClaimed;
    uint public ceiling = 2000000 * 10 ** 18;

    IModl private _modl;

    event Claim(address account, uint amount);

    constructor (IModl modl) {
        _modl = modl;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setCeiling(uint newCeiling) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newCeiling >= totalAllowancePerAnnum, "CMERR: Ceiling cannot be less than current allocation.");

        ceiling = newCeiling;
    }

    function update(address account, uint amountPerAnnum) external onlyRole(ALLOWANCE_MANAGER) {
        require(account != address(0), "CMERR: account must not be null address.");

        totalAllowancePerAnnum = totalAllowancePerAnnum + amountPerAnnum - allowance[account].amountPerAnnum;

        _claim(account);

        allowance[account].start = Time.now_u64();
        allowance[account].amountPerAnnum = amountPerAnnum;

        require(totalAllowancePerAnnum <= ceiling, "CMERR: Cannot allocate more than ceiling.");
    }

    function emergencyStop(address account) external onlyRole(ALLOWANCE_MANAGER) {
        require(account != address(0), "CMERR: account must not be null address.");

        totalAllowancePerAnnum = totalAllowancePerAnnum - allowance[account].amountPerAnnum;
        allowance[account].amountPerAnnum = 0;
    }

    function claim(address account) external {
        require(msg.sender == account || hasRole(ALLOWANCE_MANAGER, msg.sender), "CMERR: Unauthorized account");

        _claim(account);
    }

    function _claim(address account) internal {
        uint amount = claimableAmount(account);

        allowance[account].start = Time.now_u64();
        totalClaimed += amount;

        _modl.mint(account, amount);

        emit Claim(account, amount);
    }

    function claimableAmount(address account) public view returns (uint256) {
        return Time.since(allowance[account].start) * allowance[account].amountPerAnnum / _perAnnum;
    }
}