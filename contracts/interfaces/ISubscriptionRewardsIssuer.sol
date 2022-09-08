// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ISubscriptionRewardsIssuer {
    event Issue(address indexed to, uint256 amount);

    event SharesSet(address indexed account, uint256 shares);

    function issue() external returns (uint256 newAccumulation);

    function setShares(uint256 newShares) external;

    function token() external view returns (address);

    function getShares(address subscription) external view returns (uint256);

    function getUnissuedRewards(address subscription)
        external
        view
        returns (uint256 amount);
}
