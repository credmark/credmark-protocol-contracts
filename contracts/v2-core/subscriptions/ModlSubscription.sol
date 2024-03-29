// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./VariableTokenSubscription.sol";

contract ModlSubscription is VariableTokenSubscription {
    constructor(ConstructorParams memory params, address oracleAddress)
        VariableTokenSubscription(params, oracleAddress)
    {
        require(
            params.tokenAddress ==
                address(
                    ISubscriptionRewardsIssuer(params.rewardsIssuerAddress)
                        .token()
                ),
            "VE:tokenAddress"
        );
    }

    event Rebalanced(address indexed account, uint256 amount);

    function rebalance() external {
        _rebalance(msg.sender);
    }

    function _rebalance(address account) internal {
        _accumulate(rewardsIssuer.issue());
        _deposit(account, rewards(account));
        uint256 amount = _removeAccumulation(account);
        emit Rebalanced(account, amount);
    }

    function solvent(address account) public view override returns (bool) {
        return deposits(account) + rewards(account) >= fees(account);
    }
}
