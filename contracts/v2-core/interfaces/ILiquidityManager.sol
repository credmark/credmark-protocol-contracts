// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ILiquidityManager {
    event Start(address indexed pool);
    event Clean(uint160 sqrtPriceLimitX96, uint256 swapped, uint256 transfered);

    function start() external;

    function clean(uint160 sqrtPriceLimitX96) external;
}
