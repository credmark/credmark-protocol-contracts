// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../configuration/Permissioned.sol";

import "../token/ModlAllowance.sol";
import "../libraries/Time.sol";
import "../accumulators/ShareAccumulator.sol";

contract RewardsIssuer is Permissioned, ShareAccumulator {
    using SafeERC20 for IERC20;

    IERC20 public token;
    ModlAllowance public modlAllowance;

    constructor(IModl token_, ModlAllowance modlAllowance_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        modlAllowance = modlAllowance_;
        token = token_;
        Time.now_u256();
    }

    function setShares(uint256 newShares) external trustedContract {
        _setShares(msg.sender, newShares);
    }

    function getShares(address subscription) external view returns (uint256) {
        return share[subscription];
    }

    function issue() external trustedContract returns (uint256 rewardsIssued) {
        _accumulate(modlAllowance.claim(address(this)));
        rewardsIssued = _removeAccumulation(msg.sender);
        IERC20(address(token)).safeTransfer(msg.sender, rewardsIssued);
    }

    function getUnissuedRewards(address subscription)
        external
        returns (uint256 unissuedRewards)
    {
        return
            accumulation(
                subscription,
                modlAllowance.claimableAmount(address(this))
            );
    }
}
