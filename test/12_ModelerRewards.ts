import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';
import * as utils from 'ethers/lib/utils';
import { ethers, waffle } from 'hardhat';
import { MerkleTree } from 'merkletreejs';
import { setupProtocol, modelNft, modelNftRewards, MODL } from './helpers/contracts';
import { USER_ALICE, USER_BRENT, CREDMARK_MANAGER, HACKER_ZACH, MOCK_GODMODE } from './helpers/users';

import { expect } from 'chai';
import { advanceAMonth, advanceAYear } from './helpers/time';

describe('Credmark Model NFT Rewards', () => {
  let merkleTree: MerkleTree;

  const leaves = [
    {
      tokenId: BigNumber.from(0),
      amount: BigNumber.from(1),
    },
    {
      tokenId: BigNumber.from(1),
      amount: BigNumber.from(100),
    },
    {
      tokenId: BigNumber.from(2),
      amount: BigNumber.from(3).mul(BigNumber.from(10).pow(18)),
    },
    {
      tokenId: BigNumber.from(3),
      amount: BigNumber.from(4).mul(BigNumber.from(10).pow(18)),
    },
    {
      tokenId: BigNumber.from(4),
      amount: BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
    },
    {
      tokenId: BigNumber.from(5),
      amount: BigNumber.from(50).mul(1e6).mul(BigNumber.from(10).pow(18)),
    },
  ];

  const encodeLeaf = (leaf: { tokenId: BigNumber; amount: BigNumber }) =>
    utils.keccak256(
      utils.defaultAbiCoder.encode(
        ['uint256', 'uint256'],
        [leaf.tokenId, leaf.amount]
      )
    );


  beforeEach(async () => {
    await setupProtocol();
    await MODL.connect(MOCK_GODMODE).mint(modelNftRewards.address,  BigNumber.from(100).mul(1e6).mul(BigNumber.from(10).pow(18)));
    merkleTree = new MerkleTree(
      leaves.map((leaf) => encodeLeaf(leaf)),
      utils.keccak256,
      { sort: true }
    );
  });

  describe('#deploy', () => {
    it('should deploy', () => {});
  });

  describe('#setMerkleRoot', () => {
    it('should allow setting root', async () => {
      const root = merkleTree.getHexRoot();
      await modelNftRewards.connect(CREDMARK_MANAGER).setMerkleRoot(root);

      const newRoot = await modelNftRewards.merkleRoot();
      expect(newRoot).to.equal(root);
    });

    it('should not allow setting root for non CREDMARK_MANAGER', async () => {
      await expect(modelNftRewards.connect(HACKER_ZACH).setMerkleRoot(merkleTree.getHexRoot())).to.be
        .reverted;
    });

    it('should fail on setting root more than once', async () => {
      const root = merkleTree.getHexRoot();
      await modelNftRewards.connect(CREDMARK_MANAGER).setMerkleRoot(root);
      await expect(
        modelNftRewards.connect(CREDMARK_MANAGER).setMerkleRoot(merkleTree.getHexRoot())
      ).to.be.revertedWith('Root already set');
    });
  });

  describe('#claimRewards', () => {
    it('should allow claiming rewards', async () => {


      await modelNft.safeMint(USER_ALICE.address, "0x101010"); // 0
      await modelNft.safeMint(USER_ALICE.address, "0x201010"); // 1
      await modelNft.safeMint(USER_ALICE.address, "0x301010"); // 2

      await modelNft.safeMint(USER_BRENT.address, "0x401010"); // 3
      await modelNft.safeMint(USER_BRENT.address, "0x501010"); // 4
      await modelNft.safeMint(USER_BRENT.address, "0x601010"); // 5

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
          .to.emit(modelNftRewards, 'RewardsClaimed')
          .withArgs(tokenOwner, leaf.amount);
      }
    });

    it('should claim rewards only once', async () => {

      await modelNft.safeMint(USER_ALICE.address, "0x0101010"); // 0

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
        .to.emit(modelNftRewards, 'RewardsClaimed')
        .withArgs(USER_ALICE.address, leaf.amount);

      await expect(
        modelNftRewards.claimRewards(
          leaf.tokenId,
          leaf.amount,
          merkleTree.getHexProof(encodeLeaf(leaf))
        )
      )
        .to.emit(modelNftRewards, 'RewardsClaimed')
        .withArgs(USER_ALICE.address, BigNumber.from(0));
    });

    it('should fail to claim rewards for unminted nft', async () => {
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
      ).to.be.revertedWith('ERC721: owner query for nonexistent token');
    });

    it('should fail to claim rewards for wrong amount', async () => {

      await modelNft.safeMint(USER_ALICE.address, "0x10101010"); // 0

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
      ).to.be.revertedWith('Invalid proof');

      await expect(
        modelNftRewards.claimRewards(
          leaf.tokenId,
          leaf.amount,
          merkleTree.getHexProof(
            encodeLeaf({ tokenId: leaf.tokenId, amount: leaf.amount.add(1) })
          )
        )
      ).to.be.revertedWith('Invalid proof');
    });

    it('should reward to owner of nft only', async () => {

      await modelNft.safeMint(USER_ALICE.address, "0x10101010"); // 0

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
        .to.emit(modelNftRewards, 'RewardsClaimed')
        .withArgs(USER_ALICE.address, leaf.amount);

      expect(await MODL.balanceOf(USER_ALICE.address)).to.equal(leaf.amount);
      expect(await MODL.balanceOf(USER_BRENT.address)).to.equal(
        BigNumber.from(0)
      );
    });
  });
});