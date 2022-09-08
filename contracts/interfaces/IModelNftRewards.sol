// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IModelNftRewards {
    event RootUpdated(bytes32 root);
    event Claimed(uint256 indexed tokenId, address indexed to, uint256 amount);

    function setMerkleRoot(bytes32 root) external;

    function claimRewards(
        uint256 tokenId,
        uint256 amount,
        bytes32[] memory proof
    ) external;
}