import { expect } from 'chai';
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
import { advanceAYear } from './helpers/time';

describe('Credmark Model NFT Rewards', () => {
  let merkleTree: MerkleTree;

  const leaves = [
    {
      tokenId: ethers.id('slug 1'),
      amount: BigInt(1),
    },
    {
      tokenId: ethers.id('slug 2'),
      amount: BigInt(100),
    },
    {
      tokenId: ethers.id('slug 3'),
      amount: (BigInt(3) * BigInt(10) ** BigInt(18)),
    },
    {
      tokenId: ethers.id('slug 4'),
      amount: (BigInt(4) * BigInt(10) ** BigInt(18)),
    },
    {
      tokenId: ethers.id('slug 5'),
      amount: (BigInt(5) * BigInt(10) ** BigInt(18)),
    },
    {
      tokenId: ethers.id('slug 6'),
      amount: BigInt(5) * (BigInt(1e5)) * (BigInt(10) ** BigInt(18)),
    },
  ];

  const encodeLeaf = (leaf: { tokenId: string; amount: bigint }) =>
    ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ['uint256', 'uint256'],
        [BigInt(leaf.tokenId), leaf.amount]
      )
    );

  beforeEach(async () => {
    await setupProtocol();
    let i = 0;
    while (i < 100) {
      await advanceAYear();
      i++;
    }

    merkleTree = new MerkleTree(
      leaves.map((leaf) => encodeLeaf(leaf)),
      ethers.utils.keccak256,
      { sort: true }
    );
  });

  describe('#deploy', () => {
    it('should deploy', async () => {
      expect(await modelNft.getAddress()).not.equal(NULL_ADDRESS);
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
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 2'); // 1
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 3'); // 2

      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_BRENT.getAddress(), 'slug 4'); // 3
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_BRENT.getAddress(), 'slug 5'); // 4
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_BRENT.getAddress(), 'slug 6'); // 5

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
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0

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
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      const leaf = leaves[0];
      await expect(
        rewardsNft.claim({
          index: 0,
          tokenId: leaf.tokenId,
          amount: leaf.amount + (BigInt(1)),
          merkleProof: merkleTree.getHexProof(encodeLeaf(leaf)),
        })
      ).to.be.revertedWith('IP');

      await expect(
        rewardsNft.claim({
          index: 0,
          tokenId: leaf.tokenId,
          amount: leaf.amount,
          merkleProof: merkleTree.getHexProof(
            encodeLeaf({ tokenId: leaf.tokenId, amount: leaf.amount + (BigInt(1)) })
          ),
        })
      ).to.be.revertedWith('IP');
    });

    it('should reward to owner of nft only', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0

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
        .withArgs(0, leaf.tokenId, await USER_ALICE.getAddress(), leaf.amount);

      expect(await modl.balanceOf(await USER_ALICE.getAddress())).to.equal(leaf.amount);
      expect(await modl.balanceOf(await USER_BRENT.getAddress())).to.equal(
        BigInt(0)
      );
    });
  });

  describe('#multiClaim', () => {
    it('should allow claiming rewards for multiple accounts', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 2'); // 1
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 3'); // 2

      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_BRENT.getAddress(), 'slug 4'); // 3
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_BRENT.getAddress(), 'slug 5'); // 4
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_BRENT.getAddress(), 'slug 6'); // 5

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
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 2'); // 1
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 3'); // 2

      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_BRENT.getAddress(), 'slug 4'); // 3
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_BRENT.getAddress(), 'slug 5'); // 4
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_BRENT.getAddress(), 'slug 6'); // 5

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
          NULL_ADDRESS,
          await USER_ALICE.getAddress(),
          leaves[0].amount + (leaves[1].amount) + (leaves[2].amount)
        )
        .and.to.emit(modl, 'Transfer')
        .withArgs(
          NULL_ADDRESS,
          await USER_BRENT.getAddress(),
          leaves[3].amount + (leaves[4].amount) + (leaves[5].amount)
        );
    });

    it('should fail to claim rewards for any unminted nft', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0

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
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0

      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 2'); // 1

      await rewardsNft
        .connect(CREDMARK_MANAGER)
        .appendRoot(merkleTree.getHexRoot(), '');

      await expect(
        rewardsNft.claimMulti([
          {
            index: 0,
            tokenId: leaves[0].tokenId,
            amount: leaves[0].amount + (BigInt(1)),
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaves[0])),
          },
          {
            index: 0,
            tokenId: leaves[1].tokenId,
            amount: leaves[1].amount,
            merkleProof: merkleTree.getHexProof(encodeLeaf(leaves[1])),
          },
        ])
      ).to.be.revertedWith('IP');

      await expect(
        rewardsNft.claimMulti([
          {
            index: 0,
            tokenId: leaves[0].tokenId,
            amount: leaves[0].amount,
            merkleProof: merkleTree.getHexProof(
              encodeLeaf({
                tokenId: leaves[0].tokenId,
                amount: leaves[0].amount + (BigInt(1)),
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
      ).to.be.revertedWith('IP');
    });

    it('should reward to owner of nft only', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0

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
        .withArgs(0, leaf.tokenId, await USER_ALICE.getAddress(), leaf.amount);

      expect(await modl.balanceOf(await USER_ALICE.getAddress())).to.equal(leaf.amount);
      expect(await modl.balanceOf(await USER_BRENT.getAddress())).to.equal(
        BigInt(0)
      );
    });

    it('should fail to claim rewards for duplicate claims', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0

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
      ).to.be.revertedWith('IC');
    });
  });

  describe('#multipleRoots', () => {
    let otherMerkleTree: MerkleTree;

    const otherLeaves = [
      {
        tokenId: ethers.id('slug 10'),
        amount: (1).toBN(),
      },
      {
        tokenId: ethers.id('slug 20'),
        amount: (10).toBN18(),
      },
      {
        tokenId: ethers.id('slug 30'),
        amount: (7).toBN18(),
      },
      {
        tokenId: ethers.id('slug 40'),
        amount: (8).toBN18(),
      },
      {
        tokenId: ethers.id('slug 50'),
        amount: (1000).toBN(),
      },
      {
        tokenId: ethers.id('slug 60'),
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
        .safeMint(await USER_ALICE.getAddress(), 'slug 1'); // 0
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(await USER_CAMMY.getAddress(), 'slug 10'); // 2

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
        .withArgs(0, leaves[0].tokenId, await USER_ALICE.getAddress(), leaves[0].amount);

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
          await USER_CAMMY.getAddress(),
          otherLeaves[0].amount
        );
    });
  });
});
