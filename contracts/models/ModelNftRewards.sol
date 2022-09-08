// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../interfaces/IModlAllowance.sol";
import "../interfaces/IModl.sol";
import "../configuration/CModelNftRewards.sol";
import "../interfaces/IModelNftRewards.sol";

contract ModelNftRewards is CModelNftRewards, IModelNftRewards {
    using MerkleProof for bytes32[];

    constructor(ConstructorParams memory params) CModelNftRewards(params) {}

    bytes32 public merkleRoot;
    mapping(uint256 => uint256) public claimed;

    function setMerkleRoot(bytes32 root) external override manager {
        require(merkleRoot == "", "Root already set");
        merkleRoot = root;

        emit RootUpdate(root);
    }

    function claimRewards(
        uint256 tokenId,
        uint256 amount,
        bytes32[] memory proof
    ) external override {
        bytes32 leaf = keccak256(abi.encode(tokenId, amount));

        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");

        uint256 unclaimedRewards = amount - claimed[tokenId];
        address tokenOwner = modelNft.ownerOf(tokenId);

        claimed[tokenId] += unclaimedRewards;
        if (modl.balanceOf(address(this)) < unclaimedRewards) {
            modlAllowance.claim(address(this));
        }

        bool success = modl.transfer(tokenOwner, unclaimedRewards);

        emit Claim(tokenId, tokenOwner, amount);
        require(success, "Transfer Failed");
    }
}
