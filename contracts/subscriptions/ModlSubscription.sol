// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BaseSubscription.sol";

contract ModlSubscription is BaseSubscription {
    constructor(ConstructorParams memory params) BaseSubscription(params) {
        require(
            params.tokenAddress ==
                address(IRewardsIssuer(params.rewardsIssuerAddress).token()),
            "CMERR: Both rewards and deposit token must be the same."
        );
    }

    function rebalance(address account)
        external
        managerOrMine(account)
        configured
    {
        _rebalance(account);
    }

    function _rebalance(address account) internal {
        _accumulate(rewardsIssuer.issue());
        _deposit(account, rewards(account));
        _removeAccumulation(account);
    }

    function solvent(address account) public view override returns (bool) {
        return deposits(account) + rewards(account) >= fees(account);
    }

    function totalRewards() public view override returns (uint256) {
        require(
            rewardsIssuer.getUnissuedRewards(address(this)) +
                IERC20(rewardsIssuer.token()).balanceOf(address(this)) >=
                share[GLOBALS],
            "CMERR: Math error what"
        );
        return
            rewardsIssuer.getUnissuedRewards(address(this)) +
            IERC20(rewardsIssuer.token()).balanceOf(address(this)) -
            share[GLOBALS];
    }
}
