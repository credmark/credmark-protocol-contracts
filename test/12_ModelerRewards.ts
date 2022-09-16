import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

import { MerkleTree } from 'merkletreejs';
import {
  modelNft,
  rewardsNft,
  modl,
  NULL_ADDRESS,
  setupProtocol,
} from './helpers/contracts';
import {
  CREDMARK_MANAGER,
  HACKER_ZACH,
  TEST_GODMODE,
  USER_ALICE,
  USER_BRENT,
  USER_CAMMY,
} from './helpers/users';

import './helpers/bigNumber';

describe('Credmark Model NFT Rewards', () => {
  let merkleTree: MerkleTree;

  const leaves = [
    {
      tokenId: ethers.utils.id('slug 1'),
      amount: BigNumber.from(1),
    },
    {
      tokenId: ethers.utils.id('slug 2'),
      amount: BigNumber.from(100),
    },
    {
      tokenId: ethers.utils.id('slug 3'),
      amount: BigNumber.from(3).mul(BigNumber.from(10).pow(18)),
    },
    {
      tokenId: ethers.utils.id('slug 4'),
      amount: BigNumber.from(4).mul(BigNumber.from(10).pow(18)),
    },
    {
      tokenId: ethers.utils.id('slug 5'),
      amount: BigNumber.from(5).mul(BigNumber.from(10).pow(18)),
    },
    {
      tokenId: ethers.utils.id('slug 6'),
      amount: BigNumber.from(50).mul(1e6).mul(BigNumber.from(10).pow(18)),
    },
  ];

  const encodeLeaf = (leaf: { tokenId: string; amount: BigNumber }) =>
    ethers.utils.keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['uint256', 'uint256'],
        [BigNumber.from(leaf.tokenId), leaf.amount]
      )
    );

  beforeEach(async () => {
    await setupProtocol();
    await modl.mint(rewardsNft.address, (10_000_000).toBN18());

    merkleTree = new MerkleTree(
      leaves.map((leaf) => encodeLeaf(leaf)),
      ethers.utils.keccak256,
      { sort: true }
    );
  });

  describe('#deploy', () => {
    it('should deploy', () => {
      expect(modelNft.address).not.eq(NULL_ADDRESS);
    });
  });

  describe('#root', () => {
    it('should allow setting root', async () => {
      const root = merkleTree.getHexRoot();
      await rewardsNft.connect(CREDMARK_MANAGER).appendRoot(root, '');

      const newRoot = (await rewardsNft.merkles(0)).root;
      expect(newRoot).to.equal(root);
    });

    it('should not allow setting root for non CREDMARK_MANAGER', async () => {
      await expect(
        rewardsNft.connect(HACKER_ZACH).appendRoot(merkleTree.getHexRoot(), '')
      ).to.be.reverted;
    });
  });

  describe('#claimRewards', () => {
    it('should allow claiming rewards', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 2'); // 1
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 3'); // 2

      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, 'slug 4'); // 3
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, 'slug 5'); // 4
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, 'slug 6'); // 5

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      for (const leaf of leaves) {
        const tokenOwner = await modelNft.ownerOf(leaf.tokenId);
        await expect(
          rewardsNft.claim({
            index: 0,
            tokenId: leaf.tokenId,
            amount: leaf.amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
          })
        )
          .to.emit(rewardsNft, 'RewardsClaimed')
          .withArgs(0, leaf.tokenId, tokenOwner, leaf.amount);
      }
    });

    it('should claim rewards only once', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      const leaf = leaves[0];
      const tokenOwner = await modelNft.ownerOf(leaf.tokenId);
      await expect(
        rewardsNft.claim({
          index: 0,
          tokenId: leaf.tokenId,
          amount: leaf.amount,
          merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
        })
      )
        .to.emit(rewardsNft, 'RewardsClaimed')
        .withArgs(0, leaf.tokenId, tokenOwner, leaf.amount);

      await expect(
        rewardsNft.claim({
          index: 0,
          tokenId: leaf.tokenId,
          amount: leaf.amount,
          merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
        })
      ).to.be.reverted;
    });

    it('should fail to claim rewards for unminted nft', async () => {
      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      const leaf = leaves[0];
      await expect(
        rewardsNft.claim({
          index: 0,
          tokenId: leaf.tokenId,
          amount: leaf.amount,
          merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
        })
      ).to.be.revertedWith('ERC721: invalid token ID');
    });

    it('should fail to claim rewards for wrong amount', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      const leaf = leaves[0];
      await expect(
        rewardsNft.claim({
          index: 0,
          tokenId: leaf.tokenId,
          amount: leaf.amount.add(1),
          merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
        })
      ).to.be.revertedWith('ModelNftRewards:INVALID_PROOF');

      await expect(
        rewardsNft.claim({
          index: 0,
          tokenId: leaf.tokenId,
          amount: leaf.amount,
          merkleProof: merkleTree.getHexProof(
            encodeLeaf({ tokenId: leaf.tokenId, amount: leaf.amount.add(1) })
          ),
        })
      ).to.be.revertedWith('ModelNftRewards:INVALID_PROOF');
    });

    it('should reward to owner of nft only', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      const leaf = leaves[0];
      await expect(
        rewardsNft.connect(USER_BRENT).claim({
          index: 0,
          tokenId: leaf.tokenId,
          amount: leaf.amount,
          merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
        })
      )
        .to.emit(rewardsNft, 'RewardsClaimed')
        .withArgs(0, leaf.tokenId, USER_ALICE.address, leaf.amount);

      expect(await modl.balanceOf(USER_ALICE.address)).to.equal(leaf.amount);
      expect(await modl.balanceOf(USER_BRENT.address)).to.equal(
        BigNumber.from(0)
      );
    });
  });

  describe('#multiClaim', () => {
    it('should allow claiming rewards for multiple accounts', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 2'); // 1
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 3'); // 2

      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, 'slug 4'); // 3
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, 'slug 5'); // 4
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, 'slug 6'); // 5

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      let expectClaimMulti = expect(
        rewardsNft.claimMulti(
          leaves.map((leaf) => ({
            index: 0,
            tokenId: leaf.tokenId,
            amount: leaf.amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
          }))
        )
      );

      for (const leaf of leaves) {
        const tokenOwner = await modelNft.ownerOf(leaf.tokenId);
        expectClaimMulti = expectClaimMulti.to
          .emit(rewardsNft, 'RewardsClaimed')
          .withArgs(0, leaf.tokenId, tokenOwner, leaf.amount);
      }

      await expectClaimMulti;
    });

    it('should club rewards for multiple tokens for a single account', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 2'); // 1
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 3'); // 2

      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, 'slug 4'); // 3
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, 'slug 5'); // 4
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_BRENT.address, 'slug 6'); // 5

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      await expect(
        rewardsNft.claimMulti(
          leaves.map((leaf) => ({
            index: 0,
            tokenId: leaf.tokenId,
            amount: leaf.amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
          }))
        )
      )
        .to.emit(modl, 'Transfer')
        .withArgs(
          rewardsNft.address,
          USER_ALICE.address,
          leaves[0].amount.add(leaves[1].amount).add(leaves[2].amount)
        )
        .and.to.emit(modl, 'Transfer')
        .withArgs(
          rewardsNft.address,
          USER_BRENT.address,
          leaves[3].amount.add(leaves[4].amount).add(leaves[5].amount)
        );
    });

    it('should fail to claim rewards for any unminted nft', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      const mintedLeaf = leaves[0];
      const unmintedLeaf = leaves[1];
      await expect(
        rewardsNft.claimMulti([
          {
            index: 0,
            tokenId: mintedLeaf.tokenId,
            amount: mintedLeaf.amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(mintedLeaf)),
          },
          {
            index: 0,
            tokenId: unmintedLeaf.tokenId,
            amount: unmintedLeaf.amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(unmintedLeaf)),
          },
        ])
      ).to.be.revertedWith('ERC721: invalid token ID');
    });

    it('should fail to claim rewards for any wrong amount', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0

      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 2'); // 1

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      await expect(
        rewardsNft.claimMulti([
          {
            index: 0,
            tokenId: leaves[0].tokenId,
            amount: leaves[0].amount.add(1),
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaves[0])),
          },
          {
            index: 0,
            tokenId: leaves[1].tokenId,
            amount: leaves[1].amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaves[1])),
          },
        ])
      ).to.be.revertedWith('ModelNftRewards:INVALID_PROOF');

      await expect(
        rewardsNft.claimMulti([
          {
            index: 0,
            tokenId: leaves[0].tokenId,
            amount: leaves[0].amount,
            merkleProof: merkleTree.getHexProof(
              encodeLeaf({
                tokenId: leaves[0].tokenId,
                amount: leaves[0].amount.add(1),
              })
            ),
          },
          {
            index: 0,
            tokenId: leaves[1].tokenId,
            amount: leaves[1].amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaves[1])),
          },
        ])
      ).to.be.revertedWith('ModelNftRewards:INVALID_PROOF');
    });

    it('should reward to owner of nft only', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      const leaf = leaves[0];
      await expect(
        rewardsNft.connect(USER_BRENT).claimMulti([
          {
            index: 0,
            tokenId: leaf.tokenId,
            amount: leaf.amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
          },
        ])
      )
        .to.emit(rewardsNft, 'RewardsClaimed')
        .withArgs(0, leaf.tokenId, USER_ALICE.address, leaf.amount);

      expect(await modl.balanceOf(USER_ALICE.address)).to.equal(leaf.amount);
      expect(await modl.balanceOf(USER_BRENT.address)).to.equal(
        BigNumber.from(0)
      );
    });

    it('should fail to claim rewards for duplicate claims', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      const leaf = leaves[0];
      await expect(
        rewardsNft.claimMulti([
          {
            index: 0,
            tokenId: leaf.tokenId,
            amount: leaf.amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
          },
          {
            index: 0,
            tokenId: leaf.tokenId,
            amount: leaf.amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
          },
        ])
      ).to.be.revertedWith('ModelNftRewards:IS_CLAIMED');
    });
  });

  describe('#multipleRoots', () => {
    let otherMerkleTree: MerkleTree;

    const otherLeaves = [
      {
        tokenId: ethers.utils.id('slug 10'),
        amount: (1).toBN(),
      },
      {
        tokenId: ethers.utils.id('slug 20'),
        amount: (10).toBN18(),
      },
      {
        tokenId: ethers.utils.id('slug 30'),
        amount: (7).toBN18(),
      },
      {
        tokenId: ethers.utils.id('slug 40'),
        amount: (8).toBN18(),
      },
      {
        tokenId: ethers.utils.id('slug 50'),
        amount: (1000).toBN(),
      },
      {
        tokenId: ethers.utils.id('slug 60'),
        amount: (3).toBN18(),
      },
    ];

    beforeEach(async () => {
      otherMerkleTree = new MerkleTree(
        otherLeaves.map((leaf) => encodeLeaf(leaf)),
        ethers.utils.keccak256,
        { sort: true }
      );
    });

    it('should allow appending root more than once', async () => {
      const root = merkleTree.getHexRoot();
      await rewardsNft.connect(CREDMARK_MANAGER).appendRoot(root, '');

      const otherRoot = otherMerkleTree.getHexRoot();
      await rewardsNft.connect(CREDMARK_MANAGER).appendRoot(otherRoot, '');

      const newRoot = (await rewardsNft.merkles(0)).root;
      expect(newRoot).to.equal(root);

      const newOtherRoot = (await rewardsNft.merkles(1)).root;
      expect(newOtherRoot).to.equal(otherRoot);
    });

    it('should allow claiming rewards for different roots', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, 'slug 1'); // 0
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_CAMMY.address, 'slug 10'); // 2

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(otherMerkleTree.getHexRoot(), '');

      await expect(
        rewardsNft.claim({
          index: 0,
          tokenId: leaves[0].tokenId,
          amount: leaves[0].amount,
          merkleProof: merkleTree.getHexProof(encodeLeaf(leaves[0])),
        })
      )
        .to.emit(rewardsNft, 'RewardsClaimed')
        .withArgs(0, leaves[0].tokenId, USER_ALICE.address, leaves[0].amount);

      await expect(
        rewardsNft.claim({
          index: 1,
          tokenId: otherLeaves[0].tokenId,
          amount: otherLeaves[0].amount,
          merkleProof: otherMerkleTree.getHexProof(encodeLeaf(otherLeaves[0])),
        })
      )
        .to.emit(rewardsNft, 'RewardsClaimed')
        .withArgs(
          1,
          otherLeaves[0].tokenId,
          USER_CAMMY.address,
          otherLeaves[0].amount
        );
    });
  });
});
