import { expect } from 'chai';
import { BigNumber } from 'ethers';
import './helpers/bigNumber';
import { ethers } from 'hardhat';
import { Modl, Modl__factory } from '../typechain';

import {
  CREDMARK_CONFIGURER,
  CREDMARK_MANAGER,
  HACKER_ZACH,
  setupUsers,
  USER_ALICE,
  USER_BRENT,
  USER_CAMMY,
  USER_DAVID,
} from './helpers/users';
import { CONFIGURER_ROLE, MANAGER_ROLE } from './helpers/roles';
import { advanceAYear, aYearFromNow } from './helpers/time';

let modl: Modl;
// eslint-disable-next-line camelcase
let modlFactory: Modl__factory;
describe('Modl', () => {
  before(async () => {
    await setupUsers();
    modlFactory = await ethers.getContractFactory('Modl');
  });

  describe('setup', async () => {
    before(async () => {
      modl = await modlFactory.deploy(
        BigNumber.from(10_000_000).toWei(),
        BigNumber.from(1_000_000).toWei()
      );
    });

    it('#name', async () => {
      expect(await modl.name()).to.equal('Modl');
    });

    it('#symbol', async () => {
      expect(await modl.symbol()).to.equal('MODL');
    });

    it('#totalSupply', async () => {
      expect((await modl.totalSupply()).scaledInt(18)).eq(0);
    });

    it('#decimals', async () => {
      expect(await modl.decimals()).eq(18);
    });
  });
  describe('permissions', async () => {
    before(async () => {
      modl = await modlFactory.deploy(
        BigNumber.from(10_000_000).toWei(),
        BigNumber.from(1_000_000).toWei()
      );
      await modl.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
      await modl.grantRole(MANAGER_ROLE, CREDMARK_MANAGER.address);
    });

    it('#configurer', async () => {
      await expect(modl.connect(CREDMARK_MANAGER).pause()).reverted;
      await expect(modl.connect(CREDMARK_CONFIGURER).pause()).not.reverted;
      await expect(modl.connect(CREDMARK_MANAGER).unpause()).reverted;
      await expect(modl.connect(CREDMARK_CONFIGURER).unpause()).not.reverted;
      await expect(
        modl
          .connect(CREDMARK_MANAGER)
          .grantAllowance(USER_ALICE.address, BigNumber.from(10000).toWei())
      ).reverted;
      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .grantAllowance(USER_ALICE.address, BigNumber.from(10000).toWei())
      ).not.reverted;
      await expect(
        modl
          .connect(CREDMARK_MANAGER)
          .grantVestingAllowance(
            USER_ALICE.address,
            BigNumber.from(10000).toWei(),
            1798783200
          )
      ).reverted;
      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .grantVestingAllowance(
            USER_ALICE.address,
            BigNumber.from(10000).toWei(),
            1798783200
          )
      ).not.reverted;
    });
    it('#manager', async () => {
      await expect(modl.connect(CREDMARK_CONFIGURER).snapshot()).reverted;
      await expect(modl.connect(CREDMARK_MANAGER).snapshot()).not.reverted;
    });
  });
  describe('operation', async () => {
    before(async () => {
      modl = await modlFactory.deploy(
        BigNumber.from(10_000_000).toWei(),
        BigNumber.from(1_000_000).toWei()
      );
      await modl.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
      await modl.grantRole(MANAGER_ROLE, CREDMARK_MANAGER.address);
    });

    it('#minting initial liquidity', async () => {
      // Hackers can't mint
      await expect(
        modl
          .connect(HACKER_ZACH)
          .mint(HACKER_ZACH.address, BigNumber.from(100000).toWei(18))
      ).reverted;

      // deployer can mint to alice
      await expect(
        modl.mint(USER_ALICE.address, BigNumber.from(5_000_000).toWei())
      ).not.reverted;

      // alice gets it
      expect((await modl.balanceOf(USER_ALICE.address)).scaledInt(18)).eq(
        5_000_000
      );

      // deployer can't mint beyond launch liquidity amount.
      await expect(
        modl.mint(USER_ALICE.address, BigNumber.from(5_000_001).toWei())
      ).reverted;
    });

    it('#transfers', async () => {
      await expect(
        modl
          .connect(USER_ALICE)
          .transfer(USER_DAVID.address, BigNumber.from(1000).toWei())
      ).not.reverted;

      expect((await modl.balanceOf(USER_DAVID.address)).scaledInt(18)).eq(1000);
      expect((await modl.balanceOf(USER_ALICE.address)).scaledInt(18)).eq(
        4999000
      );
    });
    it('#burns', async () => {
      await expect(
        modl.connect(USER_ALICE).burn(BigNumber.from(999_000).toWei(18))
      ).not.reverted;

      expect((await modl.balanceOf(USER_ALICE.address)).scaledInt(18)).eq(
        4_000_000
      );
      await expect(
        modl.connect(USER_BRENT).burn(await modl.balanceOf(USER_BRENT.address))
      ).not.reverted;
      await expect(
        modl.connect(USER_CAMMY).burn(await modl.balanceOf(USER_CAMMY.address))
      ).not.reverted;
      await expect(
        modl.connect(USER_DAVID).burn(await modl.balanceOf(USER_DAVID.address))
      ).not.reverted;
    });
    it('#approve & transferFrom', async () => {
      await expect(
        modl
          .connect(USER_ALICE)
          .approve(USER_CAMMY.address, BigNumber.from(1_000_000).toWei(18))
      ).not.reverted;
      await expect(
        modl
          .connect(USER_CAMMY)
          .transferFrom(
            USER_ALICE.address,
            USER_CAMMY.address,
            BigNumber.from(1_000_001).toWei(18)
          )
      ).reverted;

      await expect((await modl.balanceOf(USER_CAMMY.address)).scaledInt(18)).eq(
        0
      );

      await expect(
        modl
          .connect(USER_CAMMY)
          .transferFrom(
            USER_ALICE.address,
            USER_CAMMY.address,
            BigNumber.from(1_000_000).toWei(18)
          )
      ).not.reverted;

      expect((await modl.balanceOf(USER_CAMMY.address)).scaledInt(18)).eq(
        1_000_000
      );
      expect((await modl.balanceOf(USER_ALICE.address)).scaledInt(18)).eq(
        3_000_000
      );
    });
    it('#approve & burnFrom', async () => {
      await expect(
        modl
          .connect(USER_CAMMY)
          .approve(USER_DAVID.address, BigNumber.from(1_000_000).toWei(18))
      ).not.reverted;
      await expect(
        modl
          .connect(USER_DAVID)
          .burnFrom(USER_CAMMY.address, BigNumber.from(900_000).toWei(18))
      ).not.reverted;
      expect((await modl.balanceOf(USER_CAMMY.address)).scaledInt(18)).eq(
        100_000
      );
    });
  });
  describe('allowances', async () => {
    before(async () => {
      modl = await modlFactory.deploy(
        BigNumber.from(10_000_000).toWei(),
        BigNumber.from(1_000_000).toWei()
      );
      await modl.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
      await modl.grantRole(MANAGER_ROLE, CREDMARK_MANAGER.address);
    });

    it('#set up allowance', async () => {
      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .grantAllowance(USER_BRENT.address, BigNumber.from(1_000).toWei())
      ).not.reverted;
      expect((await modl.totalInflation()).scaledInt(18)).to.eq(1_000);
      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .grantVestingAllowance(
            USER_CAMMY.address,
            BigNumber.from(1_000).toWei(),
            await aYearFromNow()
          )
      ).not.reverted;

      expect((await modl.totalInflation()).scaledInt(18)).to.eq(2_000);
    });

    it('#minting allowance liquidity', async () => {
      await advanceAYear();

      expect((await modl.mintable(USER_BRENT.address)).scaledInt(18)).eq(1000);
      expect((await modl.mintable(USER_CAMMY.address)).scaledInt(18)).eq(1000);

      await expect(
        modl
          .connect(USER_BRENT)
          .mint(USER_BRENT.address, await modl.mintable(USER_BRENT.address))
      ).not.reverted;

      expect((await modl.mintable(USER_BRENT.address)).scaledInt(18)).eq(0);

      await modl
        .connect(USER_CAMMY)
        .mint(USER_CAMMY.address, await modl.mintable(USER_CAMMY.address));

      expect((await modl.mintable(USER_CAMMY.address)).scaledInt(18)).eq(0);

      await expect(
        modl
          .connect(USER_BRENT)
          .mint(USER_BRENT.address, BigNumber.from(10).toWei())
      ).reverted;
      await expect(
        modl
          .connect(USER_CAMMY)
          .mint(USER_CAMMY.address, BigNumber.from(10).toWei())
      ).reverted;

      await advanceAYear();

      await expect(
        modl
          .connect(USER_BRENT)
          .mint(USER_BRENT.address, BigNumber.from(990).toWei())
      ).not.reverted;
      // cammy's is expired
      await expect(
        modl
          .connect(USER_CAMMY)
          .mint(USER_CAMMY.address, BigNumber.from(990).toWei())
      ).reverted;
      expect(await modl.connect(USER_CAMMY).mintable(USER_CAMMY.address)).eq(0);
    });

    it('#should not mint after stopping allowance', async () => {
      await advanceAYear();

      expect((await modl.mintable(USER_BRENT.address)).scaledInt(18)).to.be.eq(
        1010
      );

      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .emergencyStopAllowance(USER_BRENT.address)
      ).to.not.be.reverted;

      expect(await modl.mintable(USER_BRENT.address)).eq(0);
    });
  });
});
