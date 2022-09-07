// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./GenericSubscription.sol";

contract ModlSubscription is GenericSubscription {
    constructor(ConstructorParams memory params) GenericSubscription(params) {
        require(
            params.tokenAddress ==
                address(
                    ISubscriptionRewardsIssuer(params.rewardsIssuerAddress)
                        .token()
                ),
            "CMERR: Both rewards and deposit token must be the same."
        );
    }

    function rebalance(address account) external managerOr(account) configured {
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
}
