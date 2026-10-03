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
    expect(await revenueTreasury.getAddress()).not.equal(NULL_ADDRESS);
  });

  it('settles ERC-20 tokens to DAO', async () => {
    await cmk
      .connect(TEST_GODMODE)
      .transfer(await revenueTreasury.getAddress(), (10_000).toBN18());

    await expect(
      revenueTreasury.connect(CREDMARK_MANAGER)['settle(address)'](await cmk.getAddress())
    )
      .to.emit(revenueTreasury, 'Settle')
      .withArgs(
        await cmk.getAddress(),
        await CREDMARK_TREASURY_MULTISIG.getAddress(),
        (10_000).toBN18()
      );

    expect(
      (await cmk.balanceOf(await CREDMARK_TREASURY_MULTISIG.getAddress())).scaledInt(18)
    ).eq(10_000);
  });

  it('burns some MODL when settling', async () => {
    await modl.mint(await revenueTreasury.getAddress(), (10_000).toBN18());

    await expect(
      revenueTreasury.connect(CREDMARK_MANAGER)['settle(address)'](await modl.getAddress())
    )
      .to.emit(revenueTreasury, 'Settle')
      .withArgs(await modl.getAddress(), await CREDMARK_TREASURY_MULTISIG.getAddress(), (0).toBN18());

    expect(
      (await modl.balanceOf(await CREDMARK_TREASURY_MULTISIG.getAddress())).scaledInt(18)
    ).eq(0);
  });

  it('settles ERC-721 NFTs to DAO', async () => {
    await modelNft
      .connect(CREDMARK_MANAGER)
      .safeMint(await revenueTreasury.getAddress(), 'slug 1');

    const tokenId = ethers.id('slug 1');
    await expect(
      revenueTreasury
        .connect(CREDMARK_MANAGER)
        ['settle(address,uint256)'](await modelNft.getAddress(), tokenId)
    )
      .to.emit(revenueTreasury, 'Settle721')
      .withArgs(await modelNft.getAddress(), await CREDMARK_TREASURY_MULTISIG.getAddress(), tokenId);

    expect(await modelNft.ownerOf(tokenId)).eq(
      await CREDMARK_TREASURY_MULTISIG.getAddress()
    );
  });
});
