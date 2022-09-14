// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../configuration/CModlAllowance.sol";
import "../configuration/Permissioned.sol";
import "../interfaces/IModl.sol";
import "../interfaces/IModlAllowance.sol";
import "../libraries/Time.sol";

contract ModlAllowance is IModlAllowance, CModlAllowance {
    constructor(ConstructorParams memory params) CModlAllowance(params) {}

    uint256 private constant PER_ANNUM = 86400 * 365;

    struct Allowance {
        uint256 start;
        uint256 amountPerAnnum;
    }

    mapping(address => Allowance) public allowance;

    uint256 public totalAllowancePerAnnum;
    uint256 public totalClaimed;

    function update(address account, uint256 amountPerAnnum)
        external
        configurer
    {
        require(account != address(0), "ModlAllowance:NULL_ADDRESS");

        totalAllowancePerAnnum =
            totalAllowancePerAnnum +
            amountPerAnnum -
            allowance[account].amountPerAnnum;

        _claim(account);

        allowance[account].start = Time.current();
        allowance[account].amountPerAnnum = amountPerAnnum;

        require(
            totalAllowancePerAnnum <= config.ceiling,
            "ModlAllowance:VALUE_ERROR:totalAllowancePerAnnum"
        );
        emit Update(account, amountPerAnnum);
    }

    function emergencyStop(address account) external configurer configured {
        require(account != address(0), "ModlAllowance:NULL_ADDRESS");

        totalAllowancePerAnnum =
            totalAllowancePerAnnum -
            allowance[account].amountPerAnnum;
        allowance[account].amountPerAnnum = 0;
        emit Update(account, 0);
    }

    function claim(address account)
        external
        override
        managerOr(account)
        configured
        returns (uint256 amount)
    {
        return _claim(account);
    }

    function _claim(address account) private returns (uint256 amount) {
        amount = claimableAmount(account);

        allowance[account].start = Time.current();
        totalClaimed += amount;

        modl.mint(account, amount);
        emit Claim(account, amount);
    }

    function claimableAmount(address account)
        public
        view
        override
        returns (uint256)
    {
        return
            (Time.since(allowance[account].start) *
                allowance[account].amountPerAnnum) / PER_ANNUM;
    }
}
