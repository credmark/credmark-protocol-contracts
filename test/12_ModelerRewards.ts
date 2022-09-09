import { ethers, waffle } from "hardhat";
import { expect, use } from "chai";
import { BigNumber } from "ethers";

use(waffle.solidity);

import { MerkleTree } from "merkletreejs";
import {
  setupProtocol,
  modelNft,
  modelNftRewards,
  MODL,
  NULL_ADDRESS,
} from "./helpers/contracts";
import {
  USER_ALICE,
  USER_BRENT,
  CREDMARK_MANAGER,
  HACKER_ZACH,
  MOCK_GODMODE,
} from "./helpers/users";

import { advanceAMonth, advanceAYear } from "./helpers/time";

describe("Credmark Model NFT Rewards", () => {
  let merkleTree: MerkleTree;

  const leaves = [
    {
      tokenId: ethers.utils.id("slug 1"),
      amount: BigNumber.from(1),
    },
    {
      tokenId: ethers.utils.id("slug 2"),
      amount: BigNumber.from(100),
    },
    {
      tokenId: ethers.utils.id("slug 3"),
      amount: BigNumber.from(3).mul(BigNumber.from(10).pow(18)),
    },
    {
      tokenId: ethers.utils.id("slug 4"),
      amount: BigNumber.from(4).mul(BigNumber.from(10).pow(18)),
    },
    {
      tokenId: ethers.utils.id("slug 5"),
      amount: BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
    },
    {
      tokenId: ethers.utils.id("slug 6"),
      amount: BigNumber.from(50).mul(1e6).mul(BigNumber.from(10).pow(18)),
    },
  ];

  const encodeLeaf = (leaf: { tokenId: string; amount: BigNumber }) =>
  ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256"],
        [BigNumber.from(leaf.tokenId), leaf.amount]
      )
    );

  beforeEach(async () => {
    await setupProtocol();
    await MODL.connect(MOCK_GODMODE).mint(
      modelNftRewards.address,
      BigNumber.from(100).mul(1e6).mul(BigNumber.from(10).pow(18))
    );
    merkleTree = new MerkleTree(
      leaves.map((leaf) => encodeLeaf(leaf)),
      ethers.utils.keccak256,
      { sort: true }
    );
  });

  describe("#deploy", () => {
    it("should deploy", () => {
      expect(modelNft.address).not(NULL_ADDRESS);
    });
  });

  describe("#setMerkleRoot", () => {
    it("should allow setting root", async () => {
      const root = merkleTree.getHexRoot();
      await modelNftRewards.connect(CREDMARK_MANAGER).setMerkleRoot(root);

      const newRoot = await modelNftRewards.merkleRoot();
      expect(newRoot).to.equal(root);
    });

    it("should not allow setting root for non CREDMARK_MANAGER", async () => {
      await expect(
        modelNftRewards
          .connect(HACKER_ZACH)
          .setMerkleRoot(merkleTree.getHexRoot())
      ).to.be.reverted;
    });

    it("should fail on setting root more than once", async () => {
      const root = merkleTree.getHexRoot();
      await modelNftRewards.connect(CREDMARK_MANAGER).setMerkleRoot(root);
      await expect(
        modelNftRewards
          .connect(CREDMARK_MANAGER)
          .setMerkleRoot(merkleTree.getHexRoot())
      ).to.be.revertedWith("Root already set");
    });
  });

  describe("#claimRewards", () => {
    it("should allow claiming rewards", async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, "slug 1"); // 0
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, "slug 2"); // 1
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, "slug 3"); // 2

      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, "slug 4"); // 3
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, "slug 5"); // 4
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, "slug 6"); // 5

      await expect(
        modelNft
          .connect(CREDMARK_MANAGER)
          .safeMint(USER_BRENT.address, "slug 1")
      ).to.be.reverted;

      await modelNftRewards
        .connect(CREDMARK_MANAGER)
        .setMerkleRoot(merkleTree.getHexRoot());

      for (const leaf of leaves) {
        const tokenOwner = await modelNft.ownerOf(leaf.tokenId);
        await expect(
          modelNftRewards.claimRewards(
            leaf.tokenId,
            leaf.amount,
            merkleTree.getHexProof(encodeLeaf(leaf))
          )
        )
          .to.emit(modelNftRewards, "RewardsClaimed")
          .withArgs(tokenOwner, leaf.amount);
      }
    });

    it("should claim rewards only once", async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, "slug 1"); // 0

      await modelNftRewards
        .connect(CREDMARK_MANAGER)
        .setMerkleRoot(merkleTree.getHexRoot());

      const leaf = leaves[0];
      await expect(
        modelNftRewards.claimRewards(
          leaf.tokenId,
          leaf.amount,
          merkleTree.getHexProof(encodeLeaf(leaf))
        )
      )
        .to.emit(modelNftRewards, "RewardsClaimed")
        .withArgs(USER_ALICE.address, leaf.amount);

      await expect(
        modelNftRewards.claimRewards(
          leaf.tokenId,
          leaf.amount,
          merkleTree.getHexProof(encodeLeaf(leaf))
        )
      )
        .to.emit(modelNftRewards, "RewardsClaimed")
        .withArgs(USER_ALICE.address, BigNumber.from(0));
    });

    it("should fail to claim rewards for unminted nft", async () => {
      await setupProtocol();
      await modelNftRewards
        .connect(CREDMARK_MANAGER)
        .setMerkleRoot(merkleTree.getHexRoot());

      const leaf = leaves[0];
      await expect(
        modelNftRewards.claimRewards(
          leaf.tokenId,
          leaf.amount,
          merkleTree.getHexProof(encodeLeaf(leaf))
        )
      ).to.be.revertedWith("ERC721: invalid token ID");
    });

    it("should fail to claim rewards for wrong amount", async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, "slug 1"); // 0

      await modelNftRewards
        .connect(CREDMARK_MANAGER)
        .setMerkleRoot(merkleTree.getHexRoot());

      const leaf = leaves[0];
      await expect(
        modelNftRewards.claimRewards(
          leaf.tokenId,
          leaf.amount.add(1),
          merkleTree.getHexProof(encodeLeaf(leaf))
        )
      ).to.be.revertedWith("Invalid proof");

      await expect(
        modelNftRewards.claimRewards(
          leaf.tokenId,
          leaf.amount,
          merkleTree.getHexProof(
            encodeLeaf({ tokenId: leaf.tokenId, amount: leaf.amount.add(1) })
          )
        )
      ).to.be.revertedWith("Invalid proof");
    });

    it("should reward to owner of nft only", async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, "slug 1"); // 0

      await modelNftRewards
        .connect(CREDMARK_MANAGER)
        .setMerkleRoot(merkleTree.getHexRoot());

      const leaf = leaves[0];
      await expect(
        modelNftRewards
          .connect(USER_BRENT)
          .claimRewards(
            leaf.tokenId,
            leaf.amount,
            merkleTree.getHexProof(encodeLeaf(leaf))
          )
      )
        .to.emit(modelNftRewards, "RewardsClaimed")
        .withArgs(USER_ALICE.address, leaf.amount);

      expect(await MODL.balanceOf(USER_ALICE.address)).to.equal(leaf.amount);
      expect(await MODL.balanceOf(USER_BRENT.address)).to.equal(
        BigNumber.from(0)
      );
    });
  });
});
