// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IModelNftRewards {
    struct Claim {
        uint256 index;
        uint256 tokenId;
        uint256 amount;
        bytes32[] merkleProof;
    }

    event RootAppend(uint256 indexed index, address account);
    event RewardsClaimed(
        uint256 index,
        uint256 indexed tokenId,
        address indexed account,
        uint256 amount
    );

    function appendRoot(bytes32 merkleRoot, string memory ipfsHash) external;

    function claimMulti(Claim[] memory claims) external;

    function claim(Claim memory _claim) external;
}
