// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./IMembershipPool.sol";

interface IMembershipRewards {

    function updateShares(IMembershipPool pool) external;
    function getPoolRewardsIssued(IMembershipPool pool) external view returns (uint);
    function getRewardsToken() external view returns (IERC20);
}