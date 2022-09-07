// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./accumulators/ShareAccumulator.sol";
import "../configuration/CSubscriptionRewardsIssuer.sol";
import "../interfaces/IModl.sol";
import "../libraries/Time.sol";

contract SubscriptionRewardsIssuer is
    ShareAccumulator,
    CSubscriptionRewardsIssuer
{
    using SafeERC20 for IERC20;
    uint256 private constant PER_ANNUM = 86400 * 365;

    uint256 lastIssued;

    IModl public token;

    constructor(ConstructorParams memory params) {
        token = IModl(params.modlAddress);
        lastIssued = Time.now_u256();
    }

    function setShares(uint256 newShares) external trustedContract {
        _setShares(msg.sender, newShares);
    }

    function getShares(address subscription) external view returns (uint256) {
        return share[subscription];
    }

    function issue() external trustedContract returns (uint256 rewardsIssued) {
        _accumulate(_mintableAmount());
        lastIssued = Time.now_u256();
        rewardsIssued = _removeAccumulation(msg.sender);
        token.mint(msg.sender, rewardsIssued);
    }

    function getUnissuedRewards(address subscription)
        external
        view
        returns (uint256 unissuedRewards)
    {
        return accumulation(subscription, _mintableAmount());
    }

    function _mintableAmount() internal view returns (uint256) {
        return (config.amountPerAnnum * Time.since(lastIssued)) / PER_ANNUM;
    }
}
