import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { ethers, waffle } from 'hardhat';
import { ModelNft } from '../typechain';
import { MINTER_ROLE, modelNft, PAUSER_ROLE, setupProtocol } from './helpers/contracts';
import { CREDMARK_DEPLOYER, USER_ALICE, USER_BRENT } from './helpers/users';

describe('Credmark Model', () => {

  beforeEach(async () => {
    await setupProtocol();
  });

  it('should construct', async () => {
    expect(await modelNft.name()).to.equal('Credmark Model NFT');
    expect(await modelNft.symbol()).to.equal('cmModelNFT');
    expect(await modelNft.hasRole(MINTER_ROLE, CREDMARK_DEPLOYER.address)).to.equal(
      true
    );
    expect(await modelNft.hasRole(PAUSER_ROLE, CREDMARK_DEPLOYER.address)).to.equal(
      true
    );
  });

  describe('#pause/unpause', () => {
    it('should be done by PAUSER_ROLE', async () => {
      //pause by CREDMARK_DEPLOYER
      await modelNft.connect(CREDMARK_DEPLOYER).pause();
      expect(await modelNft.paused()).to.equal(true);

      //unpuase by pauser
      await modelNft.grantRole(PAUSER_ROLE, USER_ALICE.address);

      await modelNft.connect(USER_ALICE).unpause();
      expect(await modelNft.paused()).to.equal(false);
    });

    it('should not be done by non-pauser', async () => {
      await expect(modelNft.connect(USER_ALICE).pause()).to.be.reverted;
      await expect(modelNft.connect(USER_ALICE).unpause()).to.be.reverted;
    });
  });

  describe('#mint', () => {
    const TEST_SLUG = 'test';
    const tokenId = BigNumber.from(1);

    it('should be done by MINTER_ROLE', async () => {
      await expect(
        modelNft.connect(USER_ALICE).safeMint(USER_ALICE.address, TEST_SLUG)
      ).to.reverted;

      //grant minter role to normal user

      await modelNft
        .connect(CREDMARK_DEPLOYER)
        .grantRole(MINTER_ROLE, USER_ALICE.address);

      await expect(
        modelNft.connect(USER_ALICE).safeMint(USER_BRENT.address, TEST_SLUG)
      )
        .to.emit(modelNft, 'NFTMinted')
        .withArgs(tokenId, await modelNft.getSlugHash(TEST_SLUG));
    });

    it('should emit NFTMinted event', async () => {
      await expect(
        modelNft.connect(CREDMARK_DEPLOYER).safeMint(USER_ALICE.address, TEST_SLUG)
      )
        .to.emit(modelNft, 'NFTMinted')
        .withArgs(tokenId, await modelNft.getSlugHash(TEST_SLUG));
    });

    it('should mint nft', async () => {
      await modelNft.connect(CREDMARK_DEPLOYER).safeMint(USER_ALICE.address, TEST_SLUG);
      expect(await modelNft.balanceOf(USER_ALICE.address)).to.equal(1);
    });

    it('should not mint using same slug', async () => {
      await modelNft.connect(CREDMARK_DEPLOYER).safeMint(USER_ALICE.address, TEST_SLUG);

      await expect(
        modelNft.connect(CREDMARK_DEPLOYER).safeMint(USER_BRENT.address, TEST_SLUG)
      ).to.be.revertedWith('Slug already Exists');
    });

    it('Check if slugHash is correct', async () => {
      await modelNft.connect(CREDMARK_DEPLOYER).safeMint(USER_ALICE.address, TEST_SLUG);

      const tokenId = await modelNft.tokenOfOwnerByIndex(
        USER_ALICE.address,
        0x00
      );

      expect(await modelNft.getHashById(tokenId)).to.equal(
        await modelNft.getSlugHash(TEST_SLUG)
      );
    });
  });
});