// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./oracles/OracleRegistry.sol";
import "./interfaces/IRewards.sol";
import "./cursors/RewardsCursor.sol";

contract Rewards is Registry, IRewards {
    RewardsCursor internal cursor;
    OracleRegistry internal oracles;

    address public override rewardToken;
    mapping(address => uint256) multiplier;

    constructor(address registryManager) Registry(registryManager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        cursor = new RewardsCursor(1000000000000000000000000);
    }

    function setRate(uint256 rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        cursor.updateBaseRate(rate);
    }

    function getRewardsIssued()
        public
        view
        override
        registered(msg.sender)
        returns (uint256)
    {
        return cursor.getValue(msg.sender);
    }

    function updateShares(uint256 deposits, address token)
        external
        override
        registered(msg.sender)
    {
        if (token == rewardToken) {
            cursor.updateShares(msg.sender, deposits * multiplier[msg.sender]);
        } else {
            uint256 dTokenPrice = oracles.getOracle(token).price();
            uint256 rTokenPrice = oracles.getOracle(rewardToken).price();

            cursor.updateShares(
                msg.sender,
                (deposits * multiplier[msg.sender] * rTokenPrice) / dTokenPrice
            );
        }
    }

    function updateMultiplier(uint256 newMultiplier)
        public
        override
        registered(msg.sender)
    {
        multiplier[msg.sender] = newMultiplier;
    }

    function issueRewards(address recipient, uint256 amount)
        external
        override
        registered(msg.sender)
    {}
}
