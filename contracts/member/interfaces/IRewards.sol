// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IRewards {
    function rewardToken() external returns (address);
    function updateShares(uint deposits, address token) external;
    function getRewardsIssued() external view returns (uint);
    function issueRewards(address recipient, uint amount) external;
    function updateMultiplier(uint newMultiplier) external;
}