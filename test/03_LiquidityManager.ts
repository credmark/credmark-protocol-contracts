import { ethers } from 'hardhat';
import './helpers/bigNumber';

import {
  liquidityManager,
  modl,
  revenueTreasury,
  usdc,
  setupProtocol,
} from './helpers/contracts';
import {
  advance1000Seconds,
  advanceAMonth,
  advanceAYear,
} from './helpers/time';
import {
  CREDMARK_CONFIGURER,
  CREDMARK_MANAGER,
  HACKER_ZACH,
  setupUsers,
  TEST_GODMODE,
  USER_ALICE,
  USER_BRENT,
  USER_CAMMY,
  USER_DAVID,
} from './helpers/users';

import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { IUniswapV3Pool } from '../typechain';
import { NULL_ADDRESS, univ3Addresses } from './helpers/constants';
import { buyModl, poolPrice, sellModl } from './helpers/swap';

function expectClose(value: number, expectedValue: number) {
  expect(value).to.greaterThanOrEqual(expectedValue * 0.98);
  expect(value).to.lessThanOrEqual(expectedValue * 1.02);
}

const priceDiff = function (oldPrice: number, newPrice: number) {
  return ((newPrice - oldPrice) / oldPrice) * 100;
};

describe('LiquidityManager.sol', () => {
  before(async () => {
    await setupUsers();
  });

  describe('Liquidity Manager : Starting', () => {
    before(async () => {
      await advance1000Seconds();
      await setupProtocol();
    });

    it('Cannot be cleaned before start', async () => {
      await expect(
        liquidityManager.connect(CREDMARK_MANAGER).clean(0)
      ).revertedWith('NS');
    });

    it('Cannot be started unfunded', async () => {
      await expect(
        liquidityManager.connect(CREDMARK_MANAGER).start()
      ).revertedWith('ZB');
    });

    it('Cannot be started except by manager', async () => {
      await modl.mint(
        liquidityManager.address,
        BigNumber.from(7_500_000).toWei()
      );
      await expect(liquidityManager.connect(HACKER_ZACH).start()).reverted;
    });

    it('Can be started by manager once funded', async () => {
      await expect(liquidityManager.connect(CREDMARK_MANAGER).start()).not
        .reverted;
    });

    it('Tracks start time', async () => {
      expect((await liquidityManager.started()).toNumber()).gt(1650000000);
    });

    it('Sets Up a pool', async () => {
      const poolAddress = await liquidityManager.pool();
      expect(poolAddress).not.eq(NULL_ADDRESS);
      const pool = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
      const token0 = await pool.token0();
      const token1 = await pool.token1();
      expect(modl.address === token0 || modl.address === token1).true;
      expect(usdc.address === token0 || usdc.address === token1).true;
    });

    it('Can pull liquidity after 2 years.', async () => {
      const nfpm = await ethers.getContractAt(
        'INonfungiblePositionManager',
        univ3Addresses.unisv3NonFungiblePositionManager
      );
      expect((await nfpm.balanceOf(revenueTreasury.address)).toNumber()).eq(0);
      await expect(
        liquidityManager.connect(CREDMARK_CONFIGURER).transferPosition()
      ).revertedWith('TL');

      await advanceAYear();
      await advanceAYear();
      await advanceAMonth();

      await expect(
        liquidityManager.connect(CREDMARK_CONFIGURER).transferPosition()
      ).not.reverted;

      expect((await nfpm.balanceOf(revenueTreasury.address)).toNumber()).eq(1);
    });
  });

  describe('liquidity pool has multiple orientations', async () => {
    before(async () => {
      await setupUsers();
    });
    it('can start in token 0 orientation', async () => {
      await setupProtocol();
      while (modl.address < usdc.address) {
        await setupProtocol();
      }
      await modl.mint(
        liquidityManager.address,
        BigNumber.from(7_500_000).toWei()
      );
      await liquidityManager.connect(CREDMARK_MANAGER).start();
      expect((await liquidityManager.started()).toNumber()).gt(1650000000);

      const poolAddress = await liquidityManager.pool();
      const pool = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
      expectClose(await poolPrice(pool.address), 1);
    });
    it('can start in token 1 orientation', async () => {
      await setupProtocol();
      while (modl.address > usdc.address) {
        await setupProtocol();
      }

      await modl.mint(
        liquidityManager.address,
        BigNumber.from(7_500_000).toWei()
      );
      await liquidityManager.connect(CREDMARK_MANAGER).start();
      expect((await liquidityManager.started()).toNumber()).gt(1650000000);

      const poolAddress = await liquidityManager.pool();
      const pool = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
      expectClose(await poolPrice(pool.address), 1);
    });
  });
});

describe('LiquidityManager.sol operations', () => {
  let uniswapV3Pool: IUniswapV3Pool;
  before(async function () {
    await setupUsers();
    await setupProtocol();

    await usdc
      .connect(TEST_GODMODE)
      .mint(USER_ALICE.address, BigNumber.from(1_000_000).toWei(6));
    await usdc
      .connect(TEST_GODMODE)
      .mint(USER_BRENT.address, BigNumber.from(1_000_000).toWei(6));
    await usdc
      .connect(TEST_GODMODE)
      .mint(USER_CAMMY.address, BigNumber.from(1_000_000).toWei(6));
    await usdc
      .connect(TEST_GODMODE)
      .mint(USER_DAVID.address, BigNumber.from(1_000_000).toWei(6));
    await modl.mint(
      liquidityManager.address,
      BigNumber.from(5_000_000).toWei()
    );
    await liquidityManager.connect(CREDMARK_MANAGER).start();

    uniswapV3Pool = (await ethers.getContractAt(
      'IUniswapV3Pool',
      (await liquidityManager.pool()).toString()
    )) as IUniswapV3Pool;
  });

  it('Swaps for correct amount of MODL', async () => {
    let price = await poolPrice(uniswapV3Pool.address);

    await buyModl(USER_ALICE, BigNumber.from(1_000_000).toWei(6));

    expect(await poolPrice(uniswapV3Pool.address)).gt(price);
    price = await poolPrice(uniswapV3Pool.address);

    await buyModl(USER_BRENT, BigNumber.from(1_000_000).toWei(6));

    expect(await poolPrice(uniswapV3Pool.address)).gt(price);
    price = await poolPrice(uniswapV3Pool.address);

    await buyModl(USER_CAMMY, BigNumber.from(1_000_000).toWei(6));

    expect(await poolPrice(uniswapV3Pool.address)).gt(price);
    price = await poolPrice(uniswapV3Pool.address);

    await buyModl(USER_DAVID, BigNumber.from(1_000_000).toWei(6));

    expect(await poolPrice(uniswapV3Pool.address)).gt(price);
    price = await poolPrice(uniswapV3Pool.address);

    expect((await modl.balanceOf(USER_ALICE.address)).scaledInt(18)).eq(817858);
    expect((await modl.balanceOf(USER_BRENT.address)).scaledInt(18)).eq(587914);
    expect((await modl.balanceOf(USER_CAMMY.address)).scaledInt(18)).eq(442992);
    expect((await modl.balanceOf(USER_DAVID.address)).scaledInt(18)).eq(345776);

    expect((await modl.balanceOf(USER_ALICE.address)).scaledInt(18)).gt(
      (await modl.balanceOf(USER_BRENT.address)).scaledInt(18)
    );
    expect((await modl.balanceOf(USER_BRENT.address)).scaledInt(18)).gt(
      (await modl.balanceOf(USER_CAMMY.address)).scaledInt(18)
    );

    await sellModl(
      USER_ALICE,
      (await modl.balanceOf(USER_ALICE.address)).toString()
    );
    await sellModl(
      USER_BRENT,
      (await modl.balanceOf(USER_BRENT.address)).toString()
    );
    await sellModl(
      USER_CAMMY,
      (await modl.balanceOf(USER_CAMMY.address)).toString()
    );
    await sellModl(
      USER_DAVID,
      (await modl.balanceOf(USER_DAVID.address)).toString()
    );

    expect(await poolPrice(uniswapV3Pool.address)).lt(price);
  });
  it('Cleaning fails if it is front run', async () => {
    const price = await poolPrice(uniswapV3Pool.address);
    const slot0 = await uniswapV3Pool.slot0();

    await buyModl(USER_ALICE, BigNumber.from(10000).toWei(6));

    expect(
      liquidityManager
        .connect(CREDMARK_MANAGER)
        .clean(slot0.sqrtPriceX96.toString())
    ).reverted;

    expect(await poolPrice(uniswapV3Pool.address)).gt(price);
  });
  it('Cleaning bumps the price up', async () => {
    const price = await poolPrice(uniswapV3Pool.address);
    const slot0 = await uniswapV3Pool.slot0();
    await liquidityManager
      .connect(CREDMARK_MANAGER)
      .clean(slot0.sqrtPriceX96.toString());

    expect(await poolPrice(uniswapV3Pool.address)).gt(price);
  });
  it('Cleaning funds the revenue treasury', async () => {
    expect((await modl.balanceOf(revenueTreasury.address)).scaledInt(18)).gt(0);
    expect((await usdc.balanceOf(revenueTreasury.address)).scaledInt(18)).eq(0);
  });
});
