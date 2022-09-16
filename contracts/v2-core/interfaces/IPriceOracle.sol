// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IPriceOracle {
    function price() external view returns (uint256);

    function decimals() external view returns (uint8);
}
