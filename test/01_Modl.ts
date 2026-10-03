import { expect } from 'chai';
import './helpers/bigNumber';
import { ethers } from 'hardhat';
import { Modl, Modl__factory } from '../typechain-types';

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
        BigInt(10_000_000).toWei(),
        BigInt(1_000_000).toWei()
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
        BigInt(10_000_000).toWei(),
        BigInt(1_000_000).toWei()
      );
      await modl.grantRole(CONFIGURER_ROLE, await CREDMARK_CONFIGURER.getAddress());
      await modl.grantRole(MANAGER_ROLE, await CREDMARK_MANAGER.getAddress());
    });

    it('#configurer', async () => {
      await expect(modl.connect(CREDMARK_MANAGER).pause()).reverted;
      await expect(modl.connect(CREDMARK_CONFIGURER).pause()).not.reverted;
      await expect(modl.connect(CREDMARK_MANAGER).unpause()).reverted;
      await expect(modl.connect(CREDMARK_CONFIGURER).unpause()).not.reverted;
      await expect(
        modl
          .connect(CREDMARK_MANAGER)
          .grantMintAllowance(await USER_ALICE.getAddress(), BigInt(10000).toWei())
      ).reverted;
      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .grantMintAllowance(await USER_ALICE.getAddress(), BigInt(10000).toWei())
      ).not.reverted;
      await expect(
        modl
          .connect(CREDMARK_MANAGER)
          .grantVestingMintAllowance(
            await USER_ALICE.getAddress(),
            BigInt(10000).toWei(),
            1798783200
          )
      ).reverted;
      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .grantVestingMintAllowance(
            await USER_ALICE.getAddress(),
            BigInt(10000).toWei(),
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
        BigInt(10_000_000).toWei(),
        BigInt(1_000_000).toWei()
      );
      await modl.grantRole(CONFIGURER_ROLE, await CREDMARK_CONFIGURER.getAddress());
      await modl.grantRole(MANAGER_ROLE, await CREDMARK_MANAGER.getAddress());
    });

    it('#minting initial liquidity', async () => {
      // Hackers can't mint
      await expect(
        modl
          .connect(HACKER_ZACH)
          .mint(await HACKER_ZACH.getAddress(), BigInt(100000).toWei(18))
      ).reverted;

      // deployer can mint to alice
      await expect(
        modl.mint(await USER_ALICE.getAddress(), BigInt(5_000_000).toWei())
      ).not.reverted;

      // alice gets it
      expect((await modl.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)).eq(
        5_000_000
      );

      // deployer can't mint beyond launch liquidity amount.
      await expect(
        modl.mint(await USER_ALICE.getAddress(), BigInt(5_000_001).toWei())
      ).reverted;
    });

    it('#transfers', async () => {
      await expect(
        modl
          .connect(USER_ALICE)
          .transfer(await USER_DAVID.getAddress(), BigInt(1000).toWei())
      ).not.reverted;

      expect((await modl.balanceOf(await USER_DAVID.getAddress())).scaledInt(18)).eq(1000);
      expect((await modl.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)).eq(
        4999000
      );
    });
    it('#burns', async () => {
      await expect(
        modl.connect(USER_ALICE).burn(BigInt(999_000).toWei(18))
      ).not.reverted;

      expect((await modl.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)).eq(
        4_000_000
      );
      await expect(
        modl.connect(USER_BRENT).burn(await modl.balanceOf(await USER_BRENT.getAddress()))
      ).not.reverted;
      await expect(
        modl.connect(USER_CAMMY).burn(await modl.balanceOf(await USER_CAMMY.getAddress()))
      ).not.reverted;
      await expect(
        modl.connect(USER_DAVID).burn(await modl.balanceOf(await USER_DAVID.getAddress()))
      ).not.reverted;
    });
    it('#approve & transferFrom', async () => {
      await expect(
        modl
          .connect(USER_ALICE)
          .approve(await USER_CAMMY.getAddress(), BigInt(1_000_000).toWei(18))
      ).not.reverted;
      await expect(
        modl
          .connect(USER_CAMMY)
          .transferFrom(
            await USER_ALICE.getAddress(),
            await USER_CAMMY.getAddress(),
            BigInt(1_000_001).toWei(18)
          )
      ).reverted;

      await expect((await modl.balanceOf(await USER_CAMMY.getAddress())).scaledInt(18)).eq(
        0
      );

      await expect(
        modl
          .connect(USER_CAMMY)
          .transferFrom(
            await USER_ALICE.getAddress(),
            await USER_CAMMY.getAddress(),
            BigInt(1_000_000).toWei(18)
          )
      ).not.reverted;

      expect((await modl.balanceOf(await USER_CAMMY.getAddress())).scaledInt(18)).eq(
        1_000_000
      );
      expect((await modl.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)).eq(
        3_000_000
      );
    });
    it('#approve & burnFrom', async () => {
      await expect(
        modl
          .connect(USER_CAMMY)
          .approve(await USER_DAVID.getAddress(), BigInt(1_000_000).toWei(18))
      ).not.reverted;
      await expect(
        modl
          .connect(USER_DAVID)
          .burnFrom(await USER_CAMMY.getAddress(), BigInt(900_000).toWei(18))
      ).not.reverted;
      expect((await modl.balanceOf(await USER_CAMMY.getAddress())).scaledInt(18)).eq(
        100_000
      );
    });
  });
  describe('mintAllowances', async () => {
    before(async () => {
      modl = await modlFactory.deploy(
        BigInt(10_000_000).toWei(),
        BigInt(1_000_000).toWei()
      );
      await modl.grantRole(CONFIGURER_ROLE, await CREDMARK_CONFIGURER.getAddress());
      await modl.grantRole(MANAGER_ROLE, await CREDMARK_MANAGER.getAddress());
    });

    it('#set up mintAllowance', async () => {
      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .grantMintAllowance(await USER_BRENT.getAddress(), BigInt(1_000).toWei())
      ).not.reverted;
      expect((await modl.totalInflation()).scaledInt(18)).to.equal(1_000);
      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .grantVestingMintAllowance(
            await USER_CAMMY.getAddress(),
            BigInt(1_000).toWei(),
            await aYearFromNow()
          )
      ).not.reverted;

      expect((await modl.totalInflation()).scaledInt(18)).to.equal(2_000);
    });

    it('#minting mintAllowance liquidity', async () => {
      await advanceAYear();

      expect((await modl.mintable(await USER_BRENT.getAddress())).scaledInt(18)).eq(1000);
      expect((await modl.mintable(await USER_CAMMY.getAddress())).scaledInt(18)).eq(1000);

      await expect(
        modl
          .connect(USER_BRENT)
          .mint(await USER_BRENT.getAddress(), await modl.mintable(await USER_BRENT.getAddress()))
      ).not.reverted;

      expect((await modl.mintable(await USER_BRENT.getAddress())).scaledInt(18)).eq(0);

      await modl
        .connect(USER_CAMMY)
        .mint(await USER_CAMMY.getAddress(), await modl.mintable(await USER_CAMMY.getAddress()));

      expect((await modl.mintable(await USER_CAMMY.getAddress())).scaledInt(18)).eq(0);

      await expect(
        modl
          .connect(USER_BRENT)
          .mint(await USER_BRENT.getAddress(), BigInt(10).toWei())
      ).reverted;
      await expect(
        modl
          .connect(USER_CAMMY)
          .mint(await USER_CAMMY.getAddress(), BigInt(10).toWei())
      ).reverted;

      await advanceAYear();

      await expect(
        modl
          .connect(USER_BRENT)
          .mint(await USER_BRENT.getAddress(), BigInt(990).toWei())
      ).not.reverted;
      // cammy's is expired
      await expect(
        modl
          .connect(USER_CAMMY)
          .mint(await USER_CAMMY.getAddress(), BigInt(990).toWei())
      ).reverted;
      expect(await modl.connect(USER_CAMMY).mintable(await USER_CAMMY.getAddress())).eq(0);
    });

    it('#should not mint after stopping mintAllowance', async () => {
      await advanceAYear();

      expect((await modl.mintable(await USER_BRENT.getAddress())).scaledInt(18)).to.be.eq(
        1010
      );

      await expect(
        modl
          .connect(CREDMARK_CONFIGURER)
          .emergencyStopMintAllowance(await USER_BRENT.getAddress())
      ).to.not.be.reverted;

      expect(await modl.mintable(await USER_BRENT.getAddress())).eq(0);
    });
  });
});
