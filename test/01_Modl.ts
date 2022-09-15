import { expect } from 'chai';
import { BigNumber } from 'ethers';

import { setupProtocol, modl } from './helpers/contracts';
import { MINTER_ROLE } from './helpers/roles';
import {
  CREDMARK_CONFIGURER,
  CREDMARK_MANAGER,
  CREDMARK_ROLE_ASSIGNER,
  HACKER_ZACH,
  USER_ALICE,
  USER_BRENT,
  USER_CAMMY,
  USER_DAVID,
} from './helpers/users';

describe('Modl', () => {
  describe('setup', async () => {
    before(async () => {
      await setupProtocol();
    });
    it('#name', async () => {
      expect(await modl.name()).to.equal('Modl');
    });
    it('#symbol', async () => {
      expect(await modl.symbol()).to.equal('MODL');
    });
    it('#totalSupply', async () => {
      expect(await (await modl.totalSupply()).scaledInt(18)).eq(0);
    });
    it('#decimals', async () => {
      expect(await modl.decimals()).eq(18);
    });
  });
  describe('permissions', async () => {
    before(async () => {
      await setupProtocol();
    });
    it('#minter', async () => {
      await expect(
        modl
          .connect(HACKER_ZACH)
          .mint(HACKER_ZACH.address, BigNumber.from(100000).toWei(18))
      ).reverted;
      await modl
        .connect(CREDMARK_ROLE_ASSIGNER)
        .grantRole(MINTER_ROLE, CREDMARK_CONFIGURER.address);
      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .mint(USER_ALICE.address, BigNumber.from(100000).toWei(18))
      ).not.reverted;
    });
    it('#configurer', async () => {
      await expect(modl.connect(CREDMARK_MANAGER).pause()).reverted;
      await expect(modl.connect(CREDMARK_CONFIGURER).pause()).not.reverted;
      await expect(modl.connect(CREDMARK_MANAGER).unpause()).reverted;
      await expect(modl.connect(CREDMARK_CONFIGURER).unpause()).not.reverted;
    });
    it('#manager', async () => {
      await expect(modl.connect(CREDMARK_CONFIGURER).snapshot()).reverted;
      await expect(modl.connect(CREDMARK_MANAGER).snapshot()).not.reverted;
    });
  });
  describe('operation', async () => {
    before(async () => {
      await setupProtocol();
      await modl
        .connect(CREDMARK_ROLE_ASSIGNER)
        .grantRole(MINTER_ROLE, CREDMARK_CONFIGURER.address);
    });
    it('#mints', async () => {
      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .mint(USER_ALICE.address, BigNumber.from(100000).toWei(18))
      ).not.reverted;

      expect(await (await modl.balanceOf(USER_ALICE.address)).scaledInt(18)).eq(
        100000
      );
    });
    it('#transfers', async () => {
      await expect(
        modl
          .connect(USER_ALICE)
          .transfer(USER_BRENT.address, BigNumber.from(100).toWei(18))
      ).not.reverted;

      expect(await (await modl.balanceOf(USER_ALICE.address)).scaledInt(18)).eq(
        99900
      );
      expect(await (await modl.balanceOf(USER_BRENT.address)).scaledInt(18)).eq(
        100
      );
    });
    it('#burns', async () => {
      await expect(modl.connect(USER_ALICE).burn(BigNumber.from(100).toWei(18)))
        .not.reverted;

      expect(await (await modl.balanceOf(USER_ALICE.address)).scaledInt(18)).eq(
        99800
      );
    });
    it('#approve & transferFrom', async () => {
      await expect(
        modl
          .connect(USER_ALICE)
          .approve(USER_CAMMY.address, BigNumber.from(100).toWei(18))
      ).not.reverted;
      await expect(
        modl
          .connect(USER_CAMMY)
          .transferFrom(
            USER_ALICE.address,
            USER_CAMMY.address,
            BigNumber.from(110).toWei(18)
          )
      ).reverted;

      await expect(
        await (await modl.balanceOf(USER_CAMMY.address)).scaledInt(18)
      ).eq(0);

      await expect(
        modl
          .connect(USER_CAMMY)
          .transferFrom(
            USER_ALICE.address,
            USER_CAMMY.address,
            BigNumber.from(100).toWei(18)
          )
      ).not.reverted;

      await expect(
        await (await modl.balanceOf(USER_CAMMY.address)).scaledInt(18)
      ).eq(100);
      expect(await (await modl.balanceOf(USER_ALICE.address)).scaledInt(18)).eq(
        99700
      );
    });
    it('#approve & burnFrom', async () => {
      await expect(
        modl
          .connect(USER_CAMMY)
          .approve(USER_DAVID.address, BigNumber.from(100).toWei(18))
      ).not.reverted;
      await expect(
        modl
          .connect(USER_DAVID)
          .burnFrom(USER_CAMMY.address, BigNumber.from(100).toWei(18))
      ).not.reverted;
      await expect(
        await (await modl.balanceOf(USER_CAMMY.address)).scaledInt(18)
      ).eq(0);
    });
  });
});
