import { expect } from 'chai';
import { ethers } from 'hardhat';
import './helpers/bigNumber';

import {
  cmk,
  modl,
  modlOracle,
  revenueTreasury,
  rewards,
  setupProtocol,
  subBasic,
  subCmk,
  subPro,
  subSuper,
} from './helpers/contracts';
import { advanceAMonth, advanceAYear } from './helpers/time';
import {
  CREDMARK_CONFIGURER,
  CREDMARK_MANAGER,
  HACKER_ZACH,
  TEST_GODMODE,
  USER_ALICE,
  USER_BRENT,
  USER_CAMMY,
  USER_DAVID,
} from './helpers/users';

describe('Subscription.sol', () => {
  let abal: Number;
  let bbal: Number;
  let cbal: Number;
  let abRewards: Number;
  let bbRewards: Number;
  let cbRewards: Number;
  let apRewards: Number;
  let bpRewards: Number;
  let cpRewards: Number;
  let aspRewards: Number;
  let bspRewards: Number;
  let cspRewards: Number;
  let bTotalDep: Number;
  let bTotalRewards: Number;
  let pTotalDep: Number;
  let pTotalRewards: Number;
  let spTotalDep: Number;
  let spTotalRewards: Number;

  async function balances(print = false) {
    function roundNearest100(num: Number) {
      return Math.round(Number(num) / 100) * 100;
    }
    abal = roundNearest100(
      (await modl.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)
    );
    bbal = roundNearest100(
      (await modl.balanceOf(await USER_BRENT.getAddress())).scaledInt(18)
    );
    cbal = roundNearest100(
      (await modl.balanceOf(await USER_CAMMY.getAddress())).scaledInt(18)
    );

    abRewards = roundNearest100(
      (await subBasic.rewards(await USER_ALICE.getAddress())).scaledInt(18)
    );
    bbRewards = roundNearest100(
      (await subBasic.rewards(await USER_BRENT.getAddress())).scaledInt(18)
    );
    cbRewards = roundNearest100(
      (await subBasic.rewards(await USER_CAMMY.getAddress())).scaledInt(18)
    );
    apRewards = roundNearest100(
      (await subPro.rewards(await USER_ALICE.getAddress())).scaledInt(18)
    );
    bpRewards = roundNearest100(
      (await subPro.rewards(await USER_BRENT.getAddress())).scaledInt(18)
    );
    cpRewards = roundNearest100(
      (await subPro.rewards(await USER_CAMMY.getAddress())).scaledInt(18)
    );
    aspRewards = roundNearest100(
      (await subSuper.rewards(await USER_ALICE.getAddress())).scaledInt(18)
    );
    bspRewards = roundNearest100(
      (await subSuper.rewards(await USER_BRENT.getAddress())).scaledInt(18)
    );
    cspRewards = roundNearest100(
      (await subSuper.rewards(await USER_CAMMY.getAddress())).scaledInt(18)
    );
    bTotalDep = roundNearest100((await subBasic.totalDeposits()).scaledInt(18));
    pTotalDep = roundNearest100((await subPro.totalDeposits()).scaledInt(18));
    spTotalDep = roundNearest100(
      (await subSuper.totalDeposits()).scaledInt(18)
    );
    if (print) {
      console.log(
        new Date((await ethers.provider.getBlock('latest')).timestamp * 1000)
      );
      console.log('modl', abal, bbal, cbal);
      console.log(
        'basic',
        bTotalDep,
        'rewards:',
        abRewards,
        bbRewards,
        cbRewards
      );
      console.log(
        'pro',
        pTotalDep,
        'rewards:',
        apRewards,
        bpRewards,
        cpRewards
      );
      console.log(
        'superpro',
        spTotalDep,
        'rewards:',
        aspRewards,
        bspRewards,
        cspRewards
      );
      console.log();
    }
  }

  before(async () => {});

  beforeEach(async () => {
    await setupProtocol();

    await modl.mint(await USER_ALICE.getAddress(), (10_000).toBN18());
    await modl.mint(await USER_BRENT.getAddress(), (10_000).toBN18());
    await modl.mint(await USER_CAMMY.getAddress(), (10_000).toBN18());
    await modl.mint(await USER_DAVID.getAddress(), (10_000).toBN18());

    await modl.connect(USER_ALICE).approve(await subBasic.getAddress(), (10_000).toBN18());
    await modl.connect(USER_ALICE).approve(await subPro.getAddress(), (10_000).toBN18());
    await modl.connect(USER_ALICE).approve(await subSuper.getAddress(), (10_000).toBN18());

    await modl.connect(USER_BRENT).approve(await subBasic.getAddress(), (10_000).toBN18());
    await modl.connect(USER_BRENT).approve(await subPro.getAddress(), (10_000).toBN18());
    await modl.connect(USER_BRENT).approve(await subSuper.getAddress(), (10_000).toBN18());

    await modl.connect(USER_CAMMY).approve(await subBasic.getAddress(), (10_000).toBN18());
    await modl.connect(USER_CAMMY).approve(await subPro.getAddress(), (10_000).toBN18());
    await modl.connect(USER_CAMMY).approve(await subSuper.getAddress(), (10_000).toBN18());

    await modl.connect(USER_DAVID).approve(await subBasic.getAddress(), (10_000).toBN18());
    await modl.connect(USER_DAVID).approve(await subPro.getAddress(), (10_000).toBN18());
    await modl.connect(USER_DAVID).approve(await subSuper.getAddress(), (10_000).toBN18());
  });

  it('Subscription: Can Deposit', async () => {
    await expect(subBasic.connect(USER_ALICE).deposit((100).toBN18())).not
      .reverted;
  });

  it('Subscription: Deposit Math Works', async () => {
    await subBasic.connect(USER_ALICE).deposit((100).toBN18());

    expect(await subBasic.deposits(await USER_ALICE.getAddress())).to.equal((100).toBN18());
    expect((await subBasic.deposits(await USER_BRENT.getAddress())).toString()).to.equal('0');
    expect((await subBasic.deposits(await USER_CAMMY.getAddress())).toString()).to.equal('0');

    await subBasic.connect(USER_BRENT).deposit((50).toBN18());

    expect(await subBasic.deposits(await USER_ALICE.getAddress())).to.equal((100).toBN18());
    expect(await subBasic.deposits(await USER_BRENT.getAddress())).to.equal((50).toBN18());
    expect((await subBasic.deposits(await USER_CAMMY.getAddress())).toString()).to.equal('0');

    await subBasic.connect(USER_BRENT).deposit((50).toBN18());

    expect((await subBasic.deposits(await USER_ALICE.getAddress())).toString()).to.equal(
      (100).toBN18()
    );
    expect((await subBasic.deposits(await USER_BRENT.getAddress())).toString()).to.equal(
      (100).toBN18()
    );
    expect((await subBasic.deposits(await USER_CAMMY.getAddress())).toString()).to.equal('0');
  });

  it('Subscription: Fee Math Works', async () => {
    await subPro.connect(USER_ALICE).deposit((10_000).toBN18());

    await advanceAMonth();

    expect((await subPro.fees(await USER_ALICE.getAddress())).scaledInt(18)).eq(500);

    await advanceAMonth();

    expect((await subPro.fees(await USER_ALICE.getAddress())).scaledInt(18)).eq(1000);

    await modlOracle.connect(CREDMARK_MANAGER).setPrice('200000000');
    await subPro.snapshot();

    await advanceAMonth();

    expect((await subPro.fees(await USER_ALICE.getAddress())).scaledInt(18)).eq(1250);

    await modlOracle.connect(CREDMARK_MANAGER).setPrice('400000000');
    await subPro.snapshot();

    await advanceAMonth();

    expect((await subPro.fees(await USER_ALICE.getAddress())).scaledInt(18)).eq(1375);

    await modlOracle.connect(CREDMARK_MANAGER).setPrice('100000000');
    await subPro.snapshot();

    await advanceAMonth();

    expect((await subPro.fees(await USER_ALICE.getAddress())).scaledInt(18)).eq(1875);

    await modlOracle.connect(CREDMARK_MANAGER).setPrice('25000000');
    await subPro.snapshot();

    await advanceAMonth();

    expect((await subPro.fees(await USER_ALICE.getAddress())).scaledInt(18)).eq(2375);
  });

  it('Subscription: Can Exit', async () => {
    await expect(subBasic.connect(USER_ALICE).deposit((10_000).toBN18())).not
      .reverted;
    await expect(subBasic.connect(USER_ALICE).exit()).reverted;
    await advanceAMonth();

    await expect(subBasic.connect(HACKER_ZACH).exit()).reverted;
    expect((await modl.balanceOf(await USER_ALICE.getAddress())).toString()).to.equal('0');
    await subBasic.connect(USER_ALICE).exit();
    expect((await modl.balanceOf(await USER_ALICE.getAddress())).toString()).to.equal(
      (10_000).toBN18()
    );
    await expect(subBasic.connect(USER_ALICE).exit()).reverted;
  });

  it('Subscription: Can Liquidate', async () => {
    subPro.connect(USER_ALICE).deposit((100).toBN18());
    subPro.connect(USER_BRENT).deposit((10_000).toBN18());

    await expect(subPro.liquidate(await USER_ALICE.getAddress())).to.be.reverted;
    await advanceAMonth();
    await expect(subPro.liquidate(await USER_ALICE.getAddress())).to.not.be.reverted;
    expect((await modl.balanceOf(await USER_ALICE.getAddress())).toString()).to.equal(
      (9_900).toBN18()
    );
  });

  it('Subscription: Collects Fees', async () => {
    await expect(subPro.connect(USER_ALICE).deposit((10_000).toBN18())).not
      .reverted;
    await advanceAMonth();
    await advanceAMonth();
    await expect(subPro.connect(USER_ALICE).exit()).not.reverted;
    expect((await modl.balanceOf(await revenueTreasury.getAddress())).toString()).not.equal(
      '0'
    );
  });

  it('Subscription: Claims Rewards', async () => {
    expect((await rewards.getShares(await subPro.getAddress())).scaledInt(18)).to.equal(0);
    await expect(subPro.connect(USER_ALICE).deposit((10_000).toBN18())).not
      .reverted;

    await advanceAYear();

    expect((await rewards.getShares(await subPro.getAddress())).scaledInt(18)).to.equal(
      2_000_000
    );
    await expect(subPro.connect(USER_ALICE).claim()).not.reverted;

    expect((await modl.balanceOf(await rewards.getAddress())).scaledInt(18)).eq(0);
    expect((await modl.balanceOf(await subPro.getAddress())).scaledInt(18)).eq(10_000);
    expect(
      (await modl.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)
    ).to.be.closeTo(250_000, 10);
  });

  it('Subscription: Rewards Dilution Works', async () => {
    await balances();

    await expect(subPro.connect(USER_ALICE).deposit((10_000).toBN18())).not
      .reverted;
    await expect(subPro.connect(USER_BRENT).deposit((10_000).toBN18())).not
      .reverted;
    await expect(subSuper.connect(USER_CAMMY).deposit((10_000).toBN18())).not
      .reverted;

    await balances();
    await advanceAYear();
    await balances();

    await subPro.connect(USER_ALICE).claim();
    await subPro.connect(USER_BRENT).claim();
    await subSuper.connect(USER_CAMMY).claim();
    await balances();

    expect(abal).eq(bbal);
    expect(Number(abal) * 2).eq(cbal);

    await advanceAYear();
    await balances();
    await subPro.connect(USER_ALICE).claim();
    await subPro.connect(USER_BRENT).claim();
    await subSuper.connect(USER_CAMMY).claim();

    await balances();
    expect(abal).eq(bbal);
    expect(Number(abal) * 2).eq(cbal);

    await subPro.connect(USER_ALICE).exit();
    await expect(subPro.connect(USER_ALICE).claim()).not.reverted;
    await balances();

    await advanceAYear();
    await balances();
    await expect(subPro.connect(USER_ALICE).claim()).reverted;
    await subPro.connect(USER_BRENT).claim();
    await subSuper.connect(USER_CAMMY).claim();
    await balances();
  });

  it('Subscription: Complex dilution', async () => {
    await expect(subBasic.connect(USER_ALICE).deposit((10_000).toBN18())).not
      .reverted;
    await expect(subSuper.connect(USER_BRENT).deposit((10_000).toBN18())).not
      .reverted;
    await advanceAYear();
    await balances();
    await expect(subBasic.connect(USER_CAMMY).deposit((10_000).toBN18())).not
      .reverted;
    await subSuper.connect(USER_BRENT).exit();
    await balances();
    await advanceAYear();
    await expect(subBasic.connect(USER_ALICE).claim()).not.reverted;
    await expect(subBasic.connect(USER_CAMMY).claim()).not.reverted;

    await balances();

    expect(abal).eq(175_000);
    expect(cbal).eq(125_000);
  });

  it('Subscription: Rebalance Works', async () => {
    await subPro.connect(USER_ALICE).deposit((10_000).toBN18());

    await advanceAMonth();
    expect(
      (await subPro.rewards(await USER_ALICE.getAddress())).scaledInt(18)
    ).to.be.closeTo(20_500, 100);

    expect((await subPro.totalDeposits()).scaledInt(18)).to.equal(10_000);
    expect((await subPro.deposits(await USER_ALICE.getAddress())).scaledInt(18)).to.equal(
      10_000
    );

    await subPro.connect(USER_ALICE).rebalance();

    expect((await subPro.rewards(await USER_ALICE.getAddress())).scaledInt(18)).to.equal(0);
    expect((await subPro.totalDeposits()).scaledInt(18)).to.be.closeTo(
      30_500,
      100
    );
    expect(
      (await subPro.deposits(await USER_ALICE.getAddress())).scaledInt(18)
    ).to.be.closeTo(30_500, 100);
  });

  it('Subscription: oracle changing works', async () => {
    const newOracleFactory = await ethers.getContractFactory(
      'ManagedPriceOracle'
    );

    const newOracle = await newOracleFactory.deploy({
      tokenAddress: await modl.getAddress(),
      initialPrice: 200_000_000,
    });

    await expect(subPro.setOracle(await newOracle.getAddress())).to.be.reverted;

    await expect(
      subPro.connect(CREDMARK_CONFIGURER).setOracle(await newOracle.getAddress())
    ).not.to.be.reverted;
  });

  describe('CMKSubscription.sol', () => {
    beforeEach(async () => {
      await cmk
        .connect(TEST_GODMODE)
        .transfer(await USER_ALICE.getAddress(), (10_000).toBN18());
      await cmk.connect(USER_ALICE).approve(await subCmk.getAddress(), (10_000).toBN18());
    });

    it('CMK Subscription: can deposit', async () => {
      await subCmk.connect(USER_ALICE).deposit((10_000).toBN18());

      expect((await cmk.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)).to.equal(0);
      expect((await subCmk.deposits(await USER_ALICE.getAddress())).scaledInt(18)).to.equal(
        10_000
      );
    });

    it('CMK Subscription: fee math works', async () => {
      await subCmk.connect(USER_ALICE).deposit((10_000).toBN18());

      await advanceAMonth();

      expect((await subCmk.deposits(await USER_ALICE.getAddress())).scaledInt(18)).to.equal(
        10_000
      );
      expect(
        (await subCmk.rewards(await USER_ALICE.getAddress())).scaledInt(18)
      ).to.be.closeTo(20_550, 10);
      expect(
        (await subCmk.fees(await USER_ALICE.getAddress())).scaledInt(18)
      ).to.be.closeTo(350, 10);
    });

    it('CMK Subscription: can exit', async () => {
      await subCmk.connect(USER_ALICE).deposit((10_000).toBN18());

      await advanceAYear();

      await subCmk.connect(USER_ALICE).exit();

      expect((await subCmk.deposits(await USER_ALICE.getAddress())).scaledInt(18)).to.equal(
        0
      );
      expect(
        (await subCmk.rewards(await USER_ALICE.getAddress())).scaledInt(18)
      ).to.be.closeTo(250_000, 10);

      expect(
        (await cmk.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)
      ).to.closeTo(5650, 10);
    });

    it('CMK Subscription: can liquidate', async () => {
      await subCmk.connect(USER_ALICE).deposit((100).toBN18());

      await advanceAMonth();

      await subCmk.liquidate(await USER_ALICE.getAddress());

      expect((await subCmk.deposits(await USER_ALICE.getAddress())).scaledInt(18)).to.equal(
        0
      );
      expect(
        (await subCmk.rewards(await USER_ALICE.getAddress())).scaledInt(18)
      ).to.be.closeTo(20_550, 10);

      expect((await cmk.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)).to.equal(
        9900
      );
    });

    it('CMK Subscription: claim rewards', async () => {
      await subCmk.connect(USER_ALICE).deposit((10_000).toBN18());

      await advanceAYear();

      expect(
        (await modl.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)
      ).to.be.closeTo(10_000, 10);

      await subCmk.connect(USER_ALICE).claim();

      expect(
        (await modl.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)
      ).to.be.closeTo(260_000, 10);
    });
  });
});
