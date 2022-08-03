// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./registries/OracleRegistry.sol";
import "./interfaces/IRewards.sol";
import "./cursors/Cursor.sol";

contract Rewards is Registry, IRewards {
    Cursor internal cursor;
    OracleRegistry internal oracles;

    address public override rewardToken;
    mapping(address => uint256) multiplier;

    constructor(address registryManager) Registry(registryManager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        //TODO: make the overall rate the Allowance per annum on the Allowance Contract.
        cursor = new Cursor(true);
        cursor.setRate(31700000000000000);
    }

    function setRate(uint256 rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        cursor.setRate(rate);
    }

    function getRewardsIssued()
        public
        view
        override
        registered(msg.sender)
        returns (uint256)
    {
        return cursor.getAccumulator(msg.sender);
    }

    function updateShares(uint256 deposits, address token)
        external
        override
        registered(msg.sender)
    {
        if (token == rewardToken) {
            cursor.updateProportion(msg.sender, deposits * multiplier[msg.sender]);
        } else {
            uint256 dTokenPrice = oracles.getOracle(token).price();
            uint256 rTokenPrice = oracles.getOracle(rewardToken).price();

            cursor.updateProportion(
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
        //TODO: updateShares
        multiplier[msg.sender] = newMultiplier;
    }

    function issueRewards(address recipient, uint256 amount)
        external
        override
        registered(msg.sender)
    {
        //TODO: Mint or issue rewards
    }
}
