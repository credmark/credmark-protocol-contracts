// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ILiquidityManager {
    event Started();
    event Cleanup(uint256 modlBurned);

    function start() external;

    function mint() external;

    function clean(uint160 sqrtPriceLimitX96) external;
}
