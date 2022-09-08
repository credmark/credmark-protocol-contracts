// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IRevenueTreasury {
    event Settle(
        address indexed tokenAddress,
        address indexed to,
        uint256 amount
    );

    event Settle721(
        address indexed tokenAddress,
        address indexed to,
        uint256 tokenId
    );

    function settle(address tokenAddress) external;

    function settle(address tokenAddress, uint256 tokenId) external;
}
