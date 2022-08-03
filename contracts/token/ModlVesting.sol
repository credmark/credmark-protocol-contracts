// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IModl.sol";
import "../utils/BlockTimeUtils.sol";

contract ModlVesting is BlockTimeUtils, AccessControl {
    bytes32 public constant VESTING_MANAGER = keccak256("VESTING_MANAGER");

    struct Vesting {
        uint64 start;
        uint64 end;
        uint amount;
    }

    mapping(address => Vesting) public vesting;

    uint public totalAllocated;
    uint public ceiling;

    IModl private _modl;

    event Claim(address account, uint amount);

    constructor (IModl modl) {
        _modl = modl;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        ceiling = 7500000 * 10 ** 18;
    }

    function setCeiling(uint newCeiling) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newCeiling >= totalAllocated, "CMERR: Ceiling cannot be less than current allocation.");

        ceiling = newCeiling;
    }

    function update(address account, uint duration, uint amount) external onlyRole(VESTING_MANAGER) {
        require(account != address(0), "CMERR: account must not be null address.");
        require(duration > 0 && duration < 315360000, "CMERR: Duration must be greater than 0, and less than 10 years.");

        _claim(account);

        totalAllocated = totalAllocated + amount - vesting[account].amount;

        vesting[account].start = uint64(_blocktime());
        vesting[account].end = uint64(_blocktime() + duration);
        vesting[account].amount = amount;

        require(totalAllocated <= ceiling, "CMERR: Cannot allocate more than ceiling.");
    }

    function emergencyStop(address account) external onlyRole(VESTING_MANAGER) {
        require(account != address(0), "CMERR: account must not be null address.");

        totalAllocated = totalAllocated - vesting[account].amount;
        vesting[account].amount = 0;
    }

    function claim(address account) external {
        require(msg.sender == account || hasRole(VESTING_MANAGER, msg.sender), "CMERR: Unauthorized account");

        _claim(account);
    }

    function _claim(address account) internal {
        uint amount = claimableAmount(account);

        vesting[account].amount -= amount;
        vesting[account].start = uint64(_blocktime());

        _modl.mint(account, amount);

        emit Claim(account, amount);
    }

    function claimableAmount(address account) public view returns (uint256) {
        if (_blocktime() > vesting[account].end) {
            return vesting[account].amount;
        }
        return elapsedWithScalar(
                vesting[account].start,
                vesting[account].end,
                vesting[account].amount
            );
    }
}