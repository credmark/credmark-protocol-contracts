// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./BaseSubscription.sol";

contract ModlSubscription is BaseSubscription {
    bool reentrancyLocked = false;
    modifier reentrancyLock() {
        require(!reentrancyLocked);
        reentrancyLocked = true;
        _;
        reentrancyLocked = false;
    }

    constructor(
        address _modl,
        address _rewardsIssuer,
        address _oracle,
        address _revenueTreasury
    )
        BaseSubscription(
            IERC20(_modl),
            IRewardsIssuer(_rewardsIssuer),
            IPriceOracle(_oracle),
            _revenueTreasury
        )
    {}

    function rebalance(address account) external {
        _rebalance(account);
    }

    function _rebalance(address account) internal {
        rewardsIssuer.issue();

        _deposit(account, rewards(account));
        depositAccumulator.removeAccumulation(account);
    }

    function _liquidate(address account) internal override reentrancyLock {
        require(
            !solvent(account),
            "CMERR: Cannot liquidate solvent subscriptions."
        );
        _rebalance(account);
        _exit(account);
    }

    function solvent(address account) public view override returns (bool) {
        return deposits(account) + rewards(account) >= fees(account);
    }

    function totalRewards() internal view override returns (uint256) {
        return
            rewardsIssuer.getUnissuedRewards(address(this)) +
            IERC20(rewardsIssuer.token()).balanceOf(address(this)) -
            totalDeposits;
    }
}
