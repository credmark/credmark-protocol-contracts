// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IRewardsIssuer {
    function issue() external;

    function token() external view returns (address);

    function setShares(uint256 newShares) external;

    function getShares(address subscription) external view returns (uint256);

    function getUnissuedRewards(address subscription)
        external
        view
        returns (uint256 amount);
}
