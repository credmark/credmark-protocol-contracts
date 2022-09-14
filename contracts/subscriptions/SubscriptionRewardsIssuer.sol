// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./accumulators/ShareAccumulator.sol";
import "../configuration/CSubscriptionRewardsIssuer.sol";
import "../interfaces/IModl.sol";
import "../interfaces/ISubscriptionRewardsIssuer.sol";
import "../libraries/Time.sol";

contract SubscriptionRewardsIssuer is
    ShareAccumulator,
    CSubscriptionRewardsIssuer,
    ISubscriptionRewardsIssuer
{
    using SafeERC20 for IERC20;
    uint256 private constant PER_ANNUM = 86400 * 365;

    uint256 lastIssued;

    constructor(ConstructorParams memory params)
        CSubscriptionRewardsIssuer(params)
    {
        lastIssued = Time.current();
    }

    function issue()
        external
        override
        trustedContract
        returns (uint256 rewardsIssued)
    {
        _accumulate(_mintableAmount());
        lastIssued = Time.current();
        rewardsIssued = _removeAccumulation(msg.sender);
        modl.mint(msg.sender, rewardsIssued);

        emit Issue(msg.sender, rewardsIssued);
    }

    function setShares(uint256 newShares) external override trustedContract {
        _setShares(msg.sender, newShares);
        emit SharesSet(msg.sender, newShares);
    }

    function getShares(address subscription)
        external
        view
        override
        returns (uint256 shares)
    {
        return share[subscription];
    }

    function getUnissuedRewards(address subscription)
        external
        view
        override
        returns (uint256 unissuedRewards)
    {
        return accumulation(subscription, _mintableAmount());
    }

    function _mintableAmount() internal view returns (uint256) {
        if (lastIssued > end) {
            return 0;
        }
        return (config.amountPerAnnum * Time.since(lastIssued)) / PER_ANNUM;
    }

    function token() external view override returns (address) {
        return address(modl);
    }
}
