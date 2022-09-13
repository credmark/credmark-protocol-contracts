import { expect } from 'chai';
import { ethers } from 'hardhat';
import './helpers/bigNumber';

import {
  mockModlPriceOracle,
  MODL,
  revenueTreasury,
  rewardsIssuer,
  setupProtocol,
  subscriptionBasic,
  subscriptionPro,
  subscriptionSuperPro,
} from './helpers/contracts';
import { advanceAMonth, advanceAYear } from './helpers/time';
import {
  CREDMARK_CONFIGURER,
  CREDMARK_MANAGER,
  HACKER_ZACH,
  MOCK_GODMODE,
  setupUsers,
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
      (await MODL.balanceOf(USER_ALICE.address)).scaledInt(18)
    );
    bbal = roundNearest100(
      (await MODL.balanceOf(USER_BRENT.address)).scaledInt(18)
    );
    cbal = roundNearest100(
      (await MODL.balanceOf(USER_CAMMY.address)).scaledInt(18)
    );

    abRewards = roundNearest100(
      (await subscriptionBasic.rewards(USER_ALICE.address)).scaledInt(18)
    );
    bbRewards = roundNearest100(
      (await subscriptionBasic.rewards(USER_BRENT.address)).scaledInt(18)
    );
    cbRewards = roundNearest100(
      (await subscriptionBasic.rewards(USER_CAMMY.address)).scaledInt(18)
    );
    apRewards = roundNearest100(
      (await subscriptionPro.rewards(USER_ALICE.address)).scaledInt(18)
    );
    bpRewards = roundNearest100(
      (await subscriptionPro.rewards(USER_BRENT.address)).scaledInt(18)
    );
    cpRewards = roundNearest100(
      (await subscriptionPro.rewards(USER_CAMMY.address)).scaledInt(18)
    );
    aspRewards = roundNearest100(
      (await subscriptionSuperPro.rewards(USER_ALICE.address)).scaledInt(18)
    );
    bspRewards = roundNearest100(
      (await subscriptionSuperPro.rewards(USER_BRENT.address)).scaledInt(18)
    );
    cspRewards = roundNearest100(
      (await subscriptionSuperPro.rewards(USER_CAMMY.address)).scaledInt(18)
    );
    bTotalDep = roundNearest100(
      (await subscriptionBasic.totalDeposits()).scaledInt(18)
    );
    pTotalDep = roundNearest100(
      (await subscriptionPro.totalDeposits()).scaledInt(18)
    );
    spTotalDep = roundNearest100(
      (await subscriptionSuperPro.totalDeposits()).scaledInt(18)
    );
    if(print){
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
          console.log('pro', pTotalDep, 'rewards:', apRewards, bpRewards, cpRewards);
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
    await setupUsers();
    await MODL.connect(MOCK_GODMODE).mint(
      USER_ALICE.address,
      (10_000).toBN18()
    );
    await MODL.connect(MOCK_GODMODE).mint(
      USER_BRENT.address,
      (10_000).toBN18()
    );
    await MODL.connect(MOCK_GODMODE).mint(
      USER_CAMMY.address,
      (10_000).toBN18()
    );
    await MODL.connect(MOCK_GODMODE).mint(
      USER_DAVID.address,
      (10_000).toBN18()
    );

    await MODL.connect(USER_ALICE).approve(
      subscriptionBasic.address,
      (10_000).toBN18()
    );
    await MODL.connect(USER_ALICE).approve(
      subscriptionPro.address,
      (10_000).toBN18()
    );
    await MODL.connect(USER_ALICE).approve(
      subscriptionSuperPro.address,
      (10_000).toBN18()
    );

    await MODL.connect(USER_BRENT).approve(
      subscriptionBasic.address,
      (10_000).toBN18()
    );
    await MODL.connect(USER_BRENT).approve(
      subscriptionPro.address,
      (10_000).toBN18()
    );
    await MODL.connect(USER_BRENT).approve(
      subscriptionSuperPro.address,
      (10_000).toBN18()
    );

    await MODL.connect(USER_CAMMY).approve(
      subscriptionBasic.address,
      (10_000).toBN18()
    );
    await MODL.connect(USER_CAMMY).approve(
      subscriptionPro.address,
      (10_000).toBN18()
    );
    await MODL.connect(USER_CAMMY).approve(
      subscriptionSuperPro.address,
      (10_000).toBN18()
    );

    await MODL.connect(USER_DAVID).approve(
      subscriptionBasic.address,
      (10_000).toBN18()
    );
    await MODL.connect(USER_DAVID).approve(
      subscriptionPro.address,
      (10_000).toBN18()
    );
    await MODL.connect(USER_DAVID).approve(
      subscriptionSuperPro.address,
      (10_000).toBN18()
    );
  });

  it('Subscription: Can Deposit', async () => {
    await expect(
      subscriptionBasic
        .connect(USER_ALICE)
        .deposit((100).toBN18())
    ).not.reverted;
  });

  it('Subscription: Deposit Math Works', async () => {
    await subscriptionBasic
      .connect(USER_ALICE)
      .deposit((100).toBN18());

    expect(await subscriptionBasic.deposits(USER_ALICE.address)).to.eq(
      (100).toBN18()
    );
    expect(
      (await subscriptionBasic.deposits(USER_BRENT.address)).toString()
    ).to.eq('0');
    expect(
      (await subscriptionBasic.deposits(USER_CAMMY.address)).toString()
    ).to.eq('0');

    await subscriptionBasic
      .connect(USER_BRENT)
      .deposit((50).toBN18());

    expect(await subscriptionBasic.deposits(USER_ALICE.address)).to.eq(
      (100).toBN18()
    );
    expect(await subscriptionBasic.deposits(USER_BRENT.address)).to.eq(
      (50).toBN18()
    );
    expect(
      (await subscriptionBasic.deposits(USER_CAMMY.address)).toString()
    ).to.eq('0');

    await subscriptionBasic
      .connect(USER_BRENT)
      .deposit((50).toBN18());

    expect(
      (await subscriptionBasic.deposits(USER_ALICE.address)).toString()
    ).to.eq((100).toBN18());
    expect(
      (await subscriptionBasic.deposits(USER_BRENT.address)).toString()
    ).to.eq((100).toBN18());
    expect(
      (await subscriptionBasic.deposits(USER_CAMMY.address)).toString()
    ).to.eq('0');
  });

  it('Subscription: Fee Math Works', async () => {
    await subscriptionPro
      .connect(USER_ALICE)
      .deposit((10_000).toBN18());

    await advanceAMonth();

    expect((await subscriptionPro.fees(USER_ALICE.address)).scaledInt(18)).eq((500));

    await advanceAMonth();

    expect((await subscriptionPro.fees(USER_ALICE.address)).scaledInt(18)).eq((1000));

    await mockModlPriceOracle
      .connect(CREDMARK_MANAGER)
      .setPrice('200000000');
    await subscriptionPro.snapshot();

    await advanceAMonth();

    expect((await subscriptionPro.fees(USER_ALICE.address)).scaledInt(18)).eq((1250));

    await mockModlPriceOracle
      .connect(CREDMARK_MANAGER)
      .setPrice('400000000');
    await subscriptionPro.snapshot();

    await advanceAMonth();

    expect((await subscriptionPro.fees(USER_ALICE.address)).scaledInt(18)).eq((1375));

    await mockModlPriceOracle
      .connect(CREDMARK_MANAGER)
      .setPrice('100000000');
    await subscriptionPro.snapshot();

    await advanceAMonth();

    expect((await subscriptionPro.fees(USER_ALICE.address)).scaledInt(18)).eq((1875));

    await mockModlPriceOracle
      .connect(CREDMARK_MANAGER)
      .setPrice('25000000');
    await subscriptionPro.snapshot();

    await advanceAMonth();

    expect((await subscriptionPro.fees(USER_ALICE.address)).scaledInt(18)).eq((2375));
  });

  it('Subscription: Can Exit', async () => {
    await expect(
      subscriptionBasic
        .connect(USER_ALICE)
        .deposit((10_000).toBN18())
    ).not.reverted;
    await expect(subscriptionBasic.connect(USER_ALICE).exit())
      .reverted;
    await advanceAMonth();

    await expect(
      subscriptionBasic.connect(HACKER_ZACH).exit()
    ).reverted;
    expect((await MODL.balanceOf(USER_ALICE.address)).toString()).to.eq('0');
    await subscriptionBasic.connect(USER_ALICE).exit();
    expect((await MODL.balanceOf(USER_ALICE.address)).toString()).to.eq(
      (10_000).toBN18()
    );
    await expect(subscriptionBasic.connect(USER_ALICE).exit())
      .reverted;
  });

  it('Subscription: Collects Fees', async () => {
    await expect(
      subscriptionPro
        .connect(USER_ALICE)
        .deposit((10_000).toBN18())
    ).not.reverted;
    await advanceAMonth();
    await advanceAMonth();
    await expect(subscriptionPro.connect(USER_ALICE).exit())
      .not.reverted;
    expect((await MODL.balanceOf(revenueTreasury.address)).toString()).not.eq(
      '0'
    );
  });

  it('Subscription: Claims Rewards', async () => {
    await expect(
      subscriptionPro
        .connect(USER_ALICE)
        .deposit((10_000).toBN18())
    ).not.reverted;
    await advanceAYear();
    await expect(subscriptionPro.connect(USER_ALICE).claim())
      .not.reverted;

    expect((await MODL.balanceOf(rewardsIssuer.address)).scaledInt(18)).eq(0);
    expect((await MODL.balanceOf(subscriptionPro.address)).scaledInt(18)).eq(
      10_000
    );
    expect((await MODL.balanceOf(USER_ALICE.address)).scaledInt(18)).eq(
      249_999
    );
  });

  it('Subscription: Rewards Dilution Works', async () => {
    await balances();

    await expect(
      subscriptionPro
        .connect(USER_ALICE)
        .deposit((10_000).toBN18())
    ).not.reverted;
    await expect(
      subscriptionPro
        .connect(USER_BRENT)
        .deposit((10_000).toBN18())
    ).not.reverted;
    await expect(
      subscriptionSuperPro
        .connect(USER_CAMMY)
        .deposit( (10_000).toBN18())
    ).not.reverted;

    await balances();
    await advanceAYear();
    await balances();

    await subscriptionPro.connect(USER_ALICE).claim();
    await subscriptionPro.connect(USER_BRENT).claim();
    await subscriptionSuperPro.connect(USER_CAMMY).claim();
    await balances();

    expect(abal).eq(bbal);
    expect(Number(abal) * 2).eq(cbal);

    await advanceAYear();
    await balances();
    await subscriptionPro.connect(USER_ALICE).claim();
    await subscriptionPro.connect(USER_BRENT).claim();
    await subscriptionSuperPro.connect(USER_CAMMY).claim();

    await balances();
    expect(abal).eq(bbal);
    expect(Number(abal) * 2).eq(cbal);

    await subscriptionPro.connect(USER_ALICE).exit();
    await expect(subscriptionPro.connect(USER_ALICE).claim())
      .not.reverted;
    await balances();

    await advanceAYear();
    await balances();
    await expect(subscriptionPro.connect(USER_ALICE).claim())
      .reverted;
    await subscriptionPro.connect(USER_BRENT).claim();
    await subscriptionSuperPro.connect(USER_CAMMY).claim();
    await balances();
  });

  it('Subscription: Complex dilution', async () => {
    await expect(
      subscriptionBasic
        .connect(USER_ALICE)
        .deposit((10_000).toBN18())
    ).not.reverted;
    await expect(
      subscriptionSuperPro
        .connect(USER_BRENT)
        .deposit((10_000).toBN18())
    ).not.reverted;
    await advanceAYear();
    await balances();
    await expect(
      subscriptionBasic
        .connect(USER_CAMMY)
        .deposit((10_000).toBN18())
    ).not.reverted;
    await subscriptionSuperPro.connect(USER_BRENT).exit();
    await balances();
    await advanceAYear();
    await expect(
      subscriptionBasic.connect(USER_ALICE).claim()
    ).not.reverted;
    await expect(
      subscriptionBasic.connect(USER_CAMMY).claim()
    ).not.reverted;

    await balances();

    expect(abal).eq(175_000);
    expect(cbal).eq(125_000);
  });
});
