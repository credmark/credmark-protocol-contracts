import { expect } from 'chai';
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
        modelNft.connect(HACKER_ZACH).safeMint(await HACKER_ZACH.getAddress(), 'slug 1')
      ).reverted;
      await expect(
        modelNft
          .connect(CREDMARK_MANAGER)
          .safeMint(await USER_ALICE.getAddress(), 'slug 1')
      ).not.reverted;
    });
  });

  describe('operation', async () => {
    before(async () => {
      await setupProtocol();
    });
    it('#pause', async () => {
      await expect(
        modelNft.connect(CREDMARK_MANAGER).safeMint(await USER_ALICE.getAddress(), 'slug1')
      ).not.reverted;

      await expect(
        modelNft
          .connect(USER_ALICE)
          .transferFrom(
            await USER_ALICE.getAddress(),
            await USER_BRENT.getAddress(),
            ethers.id('slug1')
          )
      ).not.reverted;

      await expect(modelNft.connect(CREDMARK_CONFIGURER).pause()).not.reverted;

      expect(await modelNft.paused()).to.equal(true);

      await expect(
        modelNft.connect(CREDMARK_MANAGER).safeMint(await USER_ALICE.getAddress(), 'slug2')
      ).reverted;

      await expect(
        modelNft
          .connect(USER_BRENT)
          .transferFrom(
            await USER_BRENT.getAddress(),
            await USER_ALICE.getAddress(),
            ethers.id('slug1')
          )
      ).reverted;
      await expect(modelNft.connect(CREDMARK_CONFIGURER).unpause()).not
        .reverted;
      await expect(
        modelNft
          .connect(USER_BRENT)
          .transferFrom(
            await USER_BRENT.getAddress(),
            await USER_ALICE.getAddress(),
            ethers.id('slug1')
          )
      ).not.reverted;
    });
    describe('#mint', () => {
      const TEST_SLUG = 'test';
      beforeEach(async () => {
        await setupProtocol();
      });

      it('should be done by MINTER_ROLE', async () => {
        await expect(
          modelNft
            .connect(CREDMARK_MANAGER)
            .safeMint(await USER_ALICE.getAddress(), 'slug1')
        ).not.reverted;

        await expect(
          modelNft.connect(HACKER_ZACH).safeMint(await USER_ALICE.getAddress(), 'slug2')
        ).reverted;

        expect(await modelNft.balanceOf(await USER_ALICE.getAddress())).to.equal(1);
      });

      it('should not mint using same slug', async () => {
        await modelNft
          .connect(CREDMARK_MANAGER)
          .safeMint(await USER_ALICE.getAddress(), TEST_SLUG);

        await expect(
          modelNft
            .connect(CREDMARK_MANAGER)
            .safeMint(await USER_BRENT.getAddress(), TEST_SLUG)
        ).reverted;
      });

      it('Check if slugHash is correct', async () => {
        await modelNft
          .connect(CREDMARK_MANAGER)
          .safeMint(await USER_ALICE.getAddress(), TEST_SLUG);

        const tokenId = await modelNft.tokenOfOwnerByIndex(
          await USER_ALICE.getAddress(),
          0x00
        );

        expect(tokenId).to.equal(BigInt(ethers.id(TEST_SLUG)));

        expect(await modelNft.ownerOf(tokenId)).eq(await USER_ALICE.getAddress());
      });
    });
  });
});
