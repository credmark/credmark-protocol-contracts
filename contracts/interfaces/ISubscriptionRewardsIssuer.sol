// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ISubscriptionRewardsIssuer {
    function issue() external returns (uint256 newAccumulation);

    function token() external view returns (address);

    function setShares(uint256 newShares) external;

    function getShares(address subscription) external view returns (uint256);

    function getUnissuedRewards(address subscription)
        external
        view
        returns (uint256 amount);
}
