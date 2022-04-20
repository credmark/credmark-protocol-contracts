// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMembershipPool {

    function deposit(uint tokenId, uint amount) external;
    function claim(uint tokenId, uint amount) external;
    function exit(uint tokenId) external;
    function rebalance(uint tokenId) external;


    function getBaseToken() external view returns (IERC20);

    function getTotalDeposits() external view returns (uint);
    function getMultiplier() external view returns (uint);
}