// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../token/ModlAllowance.sol";
import "../configuration/Permissioned.sol";

contract ModelNftRewards is Permissioned {
    using MerkleProof for bytes32[];

    bytes32 public merkleRoot;
    IERC721 public modelNft;
    ModlAllowance public modlAllowance;
    mapping(uint256 => uint256) public claimed;

    event RewardsClaimed(address indexed _address, uint256 _value);

    constructor(ModlAllowance modlAllowance_, IERC721 modelNft_) {
        modelNft = modelNft_;
        modlAllowance = modlAllowance_;
    }

    function setMerkleRoot(bytes32 root) public manager {
        require(merkleRoot == "", "Root already set");
        merkleRoot = root;
    }

    function claimRewards(
        uint256 tokenId,
        uint256 amount,
        bytes32[] memory proof
    ) external {
        bytes32 leaf = keccak256(abi.encode(tokenId, amount));

        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");

        uint256 unclaimedRewards = amount - claimed[tokenId];
        address tokenOwner = modelNft.ownerOf(tokenId);
        claimed[tokenId] += unclaimedRewards;
        if (IERC20(address(0x0)).balanceOf(address(this)) < unclaimedRewards) {
            modlAllowance.claim(address(this));
        }

        modlAllowance.modl().transfer(tokenOwner, unclaimedRewards);

        emit RewardsClaimed(tokenOwner, unclaimedRewards);
    }
}
