// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IRewards {
    function rewardToken() external returns (address);

    function updateShares(uint256 deposits, address token) external;

    function getRewardsIssued() external view returns (uint256);

    function issueRewards(address recipient, uint256 amount) external;

    function updateMultiplier(uint256 newMultiplier) external;
}
