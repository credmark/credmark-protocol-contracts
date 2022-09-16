import { expect } from 'chai';
import { ethers } from 'hardhat';
import './helpers/bigNumber';
import { NULL_ADDRESS } from './helpers/constants';

import {
  cmk,
  modelNft,
  modl,
  revenueTreasury,
  setupProtocol,
} from './helpers/contracts';
import {
  CREDMARK_MANAGER,
  CREDMARK_TREASURY_MULTISIG,
  TEST_GODMODE,
} from './helpers/users';

describe('RevenueTreasury.sol', () => {
  beforeEach(async () => {
    await setupProtocol();
  });

  it('deploys', async () => {
    expect(revenueTreasury.address).not.eq(NULL_ADDRESS);
  });

  it('settles ERC-20 tokens to DAO', async () => {
    await cmk
      .connect(TEST_GODMODE)
      .transfer(revenueTreasury.address, (10_000).toBN18());

    await expect(
      revenueTreasury.connect(CREDMARK_MANAGER)['settle(address)'](cmk.address)
    )
      .to.emit(revenueTreasury, 'Settle')
      .withArgs(
        cmk.address,
        CREDMARK_TREASURY_MULTISIG.address,
        (10_000).toBN18()
      );

    expect(
      (await cmk.balanceOf(CREDMARK_TREASURY_MULTISIG.address)).scaledInt(18)
    ).eq(10_000);
  });

  it('burns some MODL when settling', async () => {
    await modl.mint(revenueTreasury.address, (10_000).toBN18());

    await expect(
      revenueTreasury.connect(CREDMARK_MANAGER)['settle(address)'](modl.address)
    )
      .to.emit(revenueTreasury, 'Settle')
      .withArgs(modl.address, CREDMARK_TREASURY_MULTISIG.address, (0).toBN18());

    expect(
      (await modl.balanceOf(CREDMARK_TREASURY_MULTISIG.address)).scaledInt(18)
    ).eq(0);
  });

  it('settles ERC-721 NFTs to DAO', async () => {
    await modelNft
      .connect(CREDMARK_MANAGER)
      .safeMint(revenueTreasury.address, 'slug 1');

    const tokenId = ethers.utils.id('slug 1');
    await expect(
      revenueTreasury
        .connect(CREDMARK_MANAGER)
        ['settle(address,uint256)'](modelNft.address, tokenId)
    )
      .to.emit(revenueTreasury, 'Settle721')
      .withArgs(modelNft.address, CREDMARK_TREASURY_MULTISIG.address, tokenId);

    expect(await modelNft.ownerOf(tokenId)).eq(
      CREDMARK_TREASURY_MULTISIG.address
    );
  });
});
