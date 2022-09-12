import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

import { modelNft, setupProtocol } from './helpers/contracts';
import {
  CREDMARK_CONFIGURER,
  CREDMARK_MANAGER,
  HACKER_ZACH,
  USER_ALICE,
  USER_BRENT,
} from './helpers/users';

describe('Credmark Model Nft', () => {
  beforeEach(async () => {
    await setupProtocol();
  });

  it('should construct', async () => {
    expect(await modelNft.name()).to.equal('Credmark Model NFT');
    expect(await modelNft.symbol()).to.equal('cmModelNFT');
  });

  describe('#pause/unpause', () => {
    it('is permissioned', async () => {
      await expect(modelNft.connect(HACKER_ZACH).pause()).reverted;
      await expect(modelNft.connect(CREDMARK_CONFIGURER).pause()).not.reverted;
      expect(await modelNft.paused()).to.equal(true);

      await expect(modelNft.connect(HACKER_ZACH).unpause()).reverted;
      await expect(modelNft.connect(CREDMARK_CONFIGURER).unpause()).not
        .reverted;
      expect(await modelNft.paused()).to.equal(false);
    });

    it('pauses transfers and mints', async () => {
      expect(await modelNft.paused()).to.equal(false);
      await expect(
        modelNft.connect(CREDMARK_MANAGER).safeMint(USER_ALICE.address, 'slug1')
      ).not.reverted;

      await expect(
        modelNft
          .connect(USER_ALICE)
          .transferFrom(
            USER_ALICE.address,
            USER_BRENT.address,
            ethers.utils.id('slug1')
          )
      ).not.reverted;

      await expect(modelNft.connect(CREDMARK_CONFIGURER).pause()).not.reverted;

      expect(await modelNft.paused()).to.equal(true);

      await expect(
        modelNft.connect(CREDMARK_MANAGER).safeMint(USER_ALICE.address, 'slug2')
      ).reverted;

      await expect(
        modelNft
          .connect(USER_BRENT)
          .transferFrom(
            USER_BRENT.address,
            USER_ALICE.address,
            ethers.utils.id('slug1')
          )
      ).reverted;
    });
  });

  describe('#mint', () => {
    const TEST_SLUG = 'test';

    it('should be done by MINTER_ROLE', async () => {
      await expect(
        modelNft.connect(CREDMARK_MANAGER).safeMint(USER_ALICE.address, 'slug1')
      ).not.reverted;

      await expect(
        modelNft.connect(HACKER_ZACH).safeMint(USER_ALICE.address, 'slug2')
      ).reverted;

      expect(await modelNft.balanceOf(USER_ALICE.address)).to.equal(1);
    });

    it('should not mint using same slug', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, TEST_SLUG);

      await expect(
        modelNft
          .connect(CREDMARK_MANAGER)
          .safeMint(USER_BRENT.address, TEST_SLUG)
      ).reverted;
    });

    it('Check if slugHash is correct', async () => {
      await modelNft
        .connect(CREDMARK_MANAGER)
        .safeMint(USER_ALICE.address, TEST_SLUG);

      const tokenId = await modelNft.tokenOfOwnerByIndex(
        USER_ALICE.address,
        0x00
      );

      expect(tokenId).to.equal(BigNumber.from(ethers.utils.id(TEST_SLUG)));

      expect(await modelNft.ownerOf(tokenId)).eq(USER_ALICE.address);
    });
  });
});
