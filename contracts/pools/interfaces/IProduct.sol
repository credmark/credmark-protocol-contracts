// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IProduct {
    function updatePrice(address baseToken) external;

    function getFee(address baseToken) external view returns (uint256);

    function getEquivalentAmount(
        address baseToken,
        uint256 amount,
        address outputToken
    ) external view returns (uint256);
}
