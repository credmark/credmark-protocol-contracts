// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IPool {
    function deposit(uint256 amount) external;

    function claim() external;

    function exit() external;

    function pay(address token, uint256 amount) external;

    function rebalance() external;
}
