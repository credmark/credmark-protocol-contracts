// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../interfaces/IModlAllowance.sol";
import "../interfaces/IModl.sol";
import "../configuration/CModelNftRewards.sol";
import "../interfaces/IModelNftRewards.sol";

contract ModelNftRewards is CModelNftRewards, IModelNftRewards {
    constructor(ConstructorParams memory params) CModelNftRewards(params) {}

    struct Merkle {
        bytes32 root;
        string ipfsHash;
    }

    mapping(uint256 => Merkle) public merkles;

    uint256 public nextMerkleIndex;

    mapping(uint256 => mapping(uint256 => uint256)) private claimedBitmap;

    function appendRoot(bytes32 merkleRoot, string memory ipfsHash)
        external
        override
        manager
    {
        uint256 merkleIndex = nextMerkleIndex;
        nextMerkleIndex = merkleIndex + 1;

        Merkle storage merkle = merkles[merkleIndex];
        merkle.root = merkleRoot;
        merkle.ipfsHash = ipfsHash;

        emit RootAppend(merkleIndex, msg.sender);
    }

    /**
     * @dev    Optimistically tries to batch together consecutive claims for the same account to
     *         reduce gas. Therefore, the most gas-cost-optimal way to use this method
     *         is to pass in an array of claims sorted by account.
     */
    function claimMulti(Claim[] memory claims) external override {
        uint256 batchedAmount = 0;
        uint256 claimCount = claims.length;

        address tokenOwner;
        address nextTokenOwner;
        for (uint256 i = 0; i < claimCount; i++) {
            Claim memory _claim = claims[i];
            tokenOwner = i == 0
                ? modelNft.ownerOf(_claim.tokenId)
                : nextTokenOwner;

            _verifyAndMarkClaimed(tokenOwner, _claim);
            batchedAmount += _claim.amount;

            // If the next claim is NOT the same account or this claim is the last one,
            // then disburse the `batchedAmount` to the current claim's token's account
            uint256 nextI = i + 1;
            nextTokenOwner = nextI == claimCount
                ? address(0)
                : modelNft.ownerOf(claims[nextI].tokenId);

            if (nextI == claimCount || nextTokenOwner != tokenOwner) {
                uint256 balance = modl.balanceOf(address(this));
                if (balance < batchedAmount) {
                    uint256 claimedAllowance = modlAllowance.claim(
                        address(this)
                    );

                    require(
                        claimedAllowance >= batchedAmount - balance,
                        "ModelNftRewards:LOW_FUNDS"
                    );
                }

                bool success = modl.transfer(tokenOwner, batchedAmount);
                require(success, "ModelNftRewards:TRANSFER_FAILED");

                batchedAmount = 0;
            }
        }
    }

    function claim(Claim memory _claim) external override {
        address tokenOwner = modelNft.ownerOf(_claim.tokenId);
        _verifyAndMarkClaimed(tokenOwner, _claim);

        if (modl.balanceOf(address(this)) < _claim.amount) {
            modlAllowance.claim(address(this));
        }

        bool success = modl.transfer(tokenOwner, _claim.amount);
        require(success, "ModelNftRewards:TRANSFER_FAILED");
    }

    function isClaimed(uint256 index, uint256 tokenId)
        public
        view
        returns (bool)
    {
        uint256 claimedWordIndex = tokenId / 256;
        uint256 claimedBitIndex = tokenId % 256;
        uint256 claimedWord = claimedBitmap[index][claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _verifyClaim(Claim memory _claim)
        private
        view
        returns (bool valid)
    {
        bytes32 leaf = keccak256(
            abi.encodePacked(_claim.tokenId, _claim.amount)
        );

        return
            MerkleProof.verify(
                _claim.merkleProof,
                merkles[_claim.index].root,
                leaf
            );
    }

    function _setClaimed(uint256 index, uint256 tokenId) private {
        uint256 claimedWordIndex = tokenId / 256;
        uint256 claimedBitIndex = tokenId % 256;
        claimedBitmap[index][claimedWordIndex] =
            claimedBitmap[index][claimedWordIndex] |
            (1 << claimedBitIndex);
    }

    function _verifyAndMarkClaimed(address tokenOwner, Claim memory _claim)
        private
    {
        require(_verifyClaim(_claim), "ModelNftRewards:INVALID_PROOF");
        require(
            !isClaimed(_claim.index, _claim.tokenId),
            "ModelNftRewards:IS_CLAIMED"
        );

        _setClaimed(_claim.index, _claim.tokenId);
        emit RewardsClaimed(
            _claim.index,
            _claim.tokenId,
            tokenOwner,
            _claim.amount
        );
    }
}
