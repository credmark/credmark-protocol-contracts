// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IModelNftRewards {
    event RootUpdate(bytes32 root);
    event Claim(uint256 indexed tokenId, address indexed to, uint256 amount);

    function setMerkleRoot(bytes32 root) external;

    function claimRewards(
        uint256 tokenId,
        uint256 amount,
        bytes32[] memory proof
    ) external;
}
