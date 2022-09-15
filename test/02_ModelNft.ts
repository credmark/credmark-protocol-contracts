import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';

import { modelNft, setupProtocol } from './helpers/contracts';
import { MINTER_ROLE } from './helpers/roles';
import {
  CREDMARK_CONFIGURER,
  CREDMARK_MANAGER,
  CREDMARK_ROLE_ASSIGNER,
  HACKER_ZACH,
  USER_ALICE,
  USER_BRENT,
} from './helpers/users';

describe('Model Nft', () => {
  describe('setup', async () => {
    before(async () => {
      await setupProtocol();
    });
    it('#name', async () => {
      expect(await modelNft.name()).to.equal('Credmark Model NFT');
    });
    it('#symbol', async () => {
      expect(await modelNft.symbol()).to.equal('cmModelNFT');
    });
    it('#supportsInterface', async () => {
      expect(await modelNft.supportsInterface('0x80ac58cd')).true;
      expect(await modelNft.supportsInterface('0x150b7a02')).false;
    });
  });

  describe('permissions', async () => {
    before(async () => {
      await setupProtocol();
    });
    it('#configurer', async () => {
      await expect(modelNft.connect(CREDMARK_MANAGER).pause()).reverted;
      await expect(modelNft.connect(CREDMARK_CONFIGURER).pause()).not.reverted;
      await expect(modelNft.connect(CREDMARK_MANAGER).unpause()).reverted;
      await expect(modelNft.connect(CREDMARK_CONFIGURER).unpause()).not
        .reverted;
    });
    it('#manager', async () => {
      await expect(
        modelNft.connect(HACKER_ZACH).safeMint(HACKER_ZACH.address, 'slug 1')
      ).reverted;
      await expect(
        modelNft
          .connect(CREDMARK_MANAGER)
          .safeMint(USER_ALICE.address, 'slug 1')
      ).not.reverted;
    });
  });

  describe('operation', async () => {
    before(async () => {
      await setupProtocol();
    });
    it('#pause', async () => {
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
      await expect(modelNft.connect(CREDMARK_CONFIGURER).unpause()).not
        .reverted;
      await expect(
        modelNft
          .connect(USER_BRENT)
          .transferFrom(
            USER_BRENT.address,
            USER_ALICE.address,
            ethers.utils.id('slug1')
          )
      ).not.reverted;
    });
    describe('#mint', () => {
      const TEST_SLUG = 'test';
      before(async () => {
        setupProtocol();
      });

      it('should be done by MINTER_ROLE', async () => {
        await expect(
          modelNft
            .connect(CREDMARK_MANAGER)
            .safeMint(USER_ALICE.address, 'slug1')
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
});
