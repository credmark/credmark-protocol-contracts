// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../interfaces/IModlAllowance.sol";
import "../interfaces/IModl.sol";
import "../configuration/CModelNftRewards.sol";

contract ModelNftRewards is CModelNftRewards {
    using MerkleProof for bytes32[];

    IERC721 public modelNft;
    IModl public modl;
    IModlAllowance public modlAllowance;

    bytes32 public merkleRoot;
    mapping(uint256 => uint256) public claimed;

    event RewardsClaimed(address indexed _address, uint256 _value);

    constructor(ConstructorParams memory params) {
        modlAllowance = IModlAllowance(params.modlAllowanceAddress);
        modelNft = IERC721(params.modelNftAddress);
        modl = IModl(params.modlAddress);
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
        if (modl.balanceOf(address(this)) < unclaimedRewards) {
            modlAllowance.claim(address(this));
        }

        modl.transfer(tokenOwner, unclaimedRewards);

        emit RewardsClaimed(tokenOwner, unclaimedRewards);
    }
}
