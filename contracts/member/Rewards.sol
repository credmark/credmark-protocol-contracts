// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./oracles/OracleRegistry.sol";
import "./interfaces/IRewards.sol";
import "./cursors/RewardsCursor.sol";

contract Rewards is Registry, IRewards {

    RewardsCursor internal cursor;
    OracleRegistry internal oracles;

    address public override rewardToken;
    mapping(address => uint) multiplier;

    constructor (address registryManager) Registry(registryManager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        cursor = new RewardsCursor(1000000000000000000000000);
    }

    function setRate(uint rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        cursor.updateBaseRate(rate);
    }

    function getRewardsIssued() public override view registered(msg.sender) returns (uint) {
        return cursor.getValue(msg.sender);
    }

    function updateShares(uint deposits, address token) external override registered(msg.sender) {
        if (token == rewardToken){
            cursor.updateShares(msg.sender, deposits * multiplier[msg.sender]);
        } else {
            uint dTokenPrice = oracles.getOracle(token).price();
            uint rTokenPrice = oracles.getOracle(rewardToken).price();

            cursor.updateShares(msg.sender, deposits * multiplier[msg.sender] * rTokenPrice / dTokenPrice);
        }
    }

    function updateMultiplier(uint newMultiplier) public override registered(msg.sender) {
        multiplier[msg.sender] = newMultiplier;
    }

    function issueRewards(address recipient, uint amount) external override registered(msg.sender) {

    }
}