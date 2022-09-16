// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./accumulators/ShareAccumulator.sol";
import "../configuration/CSubscriptionRewardsIssuer.sol";
import "../interfaces/IModl.sol";
import "../interfaces/ISubscriptionRewardsIssuer.sol";

contract SubscriptionRewardsIssuer is
    ShareAccumulator,
    CSubscriptionRewardsIssuer,
    ISubscriptionRewardsIssuer
{
    using SafeERC20 for IModl;

    constructor(ConstructorParams memory params)
        CSubscriptionRewardsIssuer(params)
    {}

    function issue()
        external
        override
        trustedContract
        returns (uint256 rewardsIssued)
    {
        uint256 mintable = modl.mintable(address(this));

        _accumulate(mintable);
        rewardsIssued = _removeAccumulation(msg.sender);

        modl.mint(address(this), mintable);
        modl.safeTransfer(msg.sender, rewardsIssued);

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
        return accumulation(subscription, modl.mintable(address(this)));
    }

    function token() external view override returns (address) {
        return address(modl);
    }
}
