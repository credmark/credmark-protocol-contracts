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
        uint64 start;
        uint256 amountPerAnnum;
    }

    mapping(address => Allowance) public allowance;

    uint256 public totalAllowancePerAnnum;
    uint256 public totalClaimed;

    function update(address account, uint256 amountPerAnnum)
        external
        configurer
    {
        require(
            account != address(0),
            "CMERR: account must not be null address."
        );

        totalAllowancePerAnnum =
            totalAllowancePerAnnum +
            amountPerAnnum -
            allowance[account].amountPerAnnum;

        _claim(account);

        allowance[account].start = Time.now_u64();
        allowance[account].amountPerAnnum = amountPerAnnum;

        require(
            totalAllowancePerAnnum <= config.ceiling,
            "CMERR: Cannot allocate more than ceiling."
        );
        emit Update(account, amountPerAnnum);
    }

    function emergencyStop(address account) external configurer configured {
        require(
            account != address(0),
            "CMERR: account must not be null address."
        );

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

    function _claim(address account) internal returns (uint256 amount) {
        amount = claimableAmount(account);

        allowance[account].start = Time.now_u64();
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
