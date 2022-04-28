// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IPool {

    function deposit(uint amount) external;
    function claim() external;
    function exit() external;
    function pay(address token, uint amount) external;
    function rebalance() external;

}