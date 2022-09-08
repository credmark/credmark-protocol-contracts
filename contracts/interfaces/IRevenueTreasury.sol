// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IRevenueTreasury {
    function settle(address tokenAddress) external;
}
