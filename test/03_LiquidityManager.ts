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
import { IUniswapV3Pool } from '../typechain-types';
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
        await liquidityManager.getAddress(),
        BigInt(7_500_000).toWei()
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
      expect(poolAddress).not.equal(NULL_ADDRESS);
      const pool = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
      const token0 = await pool.token0();
      const token1 = await pool.token1();
      expect(await modl.getAddress() === token0 || await modl.getAddress() === token1).true;
      expect(await usdc.getAddress() === token0 || await usdc.getAddress() === token1).true;
    });

    it('Can pull liquidity after 2 years.', async () => {
      const nfpm = await ethers.getContractAt(
        'INonfungiblePositionManager',
        univ3Addresses.unisv3NonFungiblePositionManager
      );
      expect((await nfpm.balanceOf(await revenueTreasury.getAddress())).toNumber()).eq(0);
      await expect(
        liquidityManager.connect(CREDMARK_CONFIGURER).transferPosition()
      ).revertedWith('TL');

      await advanceAYear();
      await advanceAYear();
      await advanceAMonth();

      await expect(
        liquidityManager.connect(CREDMARK_CONFIGURER).transferPosition()
      ).not.reverted;

      expect((await nfpm.balanceOf(await revenueTreasury.getAddress())).toNumber()).eq(1);
    });
  });

  describe('liquidity pool has multiple orientations', async () => {
    before(async () => {
      await setupUsers();
    });
    it('can start in token 0 orientation', async () => {
      await setupProtocol();
      while (await modl.getAddress() < await usdc.getAddress()) {
        await setupProtocol();
      }
      await modl.mint(
        await liquidityManager.getAddress(),
        BigInt(7_500_000).toWei()
      );
      await liquidityManager.connect(CREDMARK_MANAGER).start();
      expect((await liquidityManager.started()).toNumber()).gt(1650000000);

      const poolAddress = await liquidityManager.pool();
      const pool = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
      expectClose(await poolPrice(await pool.getAddress()), 1);
    });
    it('can start in token 1 orientation', async () => {
      await setupProtocol();
      while (await modl.getAddress() > await usdc.getAddress()) {
        await setupProtocol();
      }

      await modl.mint(
        await liquidityManager.getAddress(),
        BigInt(7_500_000).toWei()
      );
      await liquidityManager.connect(CREDMARK_MANAGER).start();
      expect((await liquidityManager.started()).toNumber()).gt(1650000000);

      const poolAddress = await liquidityManager.pool();
      const pool = await ethers.getContractAt('IUniswapV3Pool', poolAddress);
      expectClose(await poolPrice(await pool.getAddress()), 1);
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
      .mint(await USER_ALICE.getAddress(), BigInt(1_000_000).toWei(6));
    await usdc
      .connect(TEST_GODMODE)
      .mint(await USER_BRENT.getAddress(), BigInt(1_000_000).toWei(6));
    await usdc
      .connect(TEST_GODMODE)
      .mint(await USER_CAMMY.getAddress(), BigInt(1_000_000).toWei(6));
    await usdc
      .connect(TEST_GODMODE)
      .mint(await USER_DAVID.getAddress(), BigInt(1_000_000).toWei(6));
    await modl.mint(
      await liquidityManager.getAddress(),
      BigInt(5_000_000).toWei()
    );
    await liquidityManager.connect(CREDMARK_MANAGER).start();

    uniswapV3Pool = (await ethers.getContractAt(
      'IUniswapV3Pool',
      (await liquidityManager.pool()).toString()
    )) as IUniswapV3Pool;
  });

  it('Swaps for correct amount of MODL', async () => {
    let price = await poolPrice(await uniswapV3Pool.getAddress());

    await buyModl(USER_ALICE, BigInt(1_000_000).toWei(6));

    expect(await poolPrice(await uniswapV3Pool.getAddress())).gt(price);
    price = await poolPrice(await uniswapV3Pool.getAddress());

    await buyModl(USER_BRENT, BigInt(1_000_000).toWei(6));

    expect(await poolPrice(await uniswapV3Pool.getAddress())).gt(price);
    price = await poolPrice(await uniswapV3Pool.getAddress());

    await buyModl(USER_CAMMY, BigInt(1_000_000).toWei(6));

    expect(await poolPrice(await uniswapV3Pool.getAddress())).gt(price);
    price = await poolPrice(await uniswapV3Pool.getAddress());

    await buyModl(USER_DAVID, BigInt(1_000_000).toWei(6));

    expect(await poolPrice(await uniswapV3Pool.getAddress())).gt(price);
    price = await poolPrice(await uniswapV3Pool.getAddress());

    expect((await modl.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)).eq(817858);
    expect((await modl.balanceOf(await USER_BRENT.getAddress())).scaledInt(18)).eq(587914);
    expect((await modl.balanceOf(await USER_CAMMY.getAddress())).scaledInt(18)).eq(442992);
    expect((await modl.balanceOf(await USER_DAVID.getAddress())).scaledInt(18)).eq(345776);

    expect((await modl.balanceOf(await USER_ALICE.getAddress())).scaledInt(18)).gt(
      (await modl.balanceOf(await USER_BRENT.getAddress())).scaledInt(18)
    );
    expect((await modl.balanceOf(await USER_BRENT.getAddress())).scaledInt(18)).gt(
      (await modl.balanceOf(await USER_CAMMY.getAddress())).scaledInt(18)
    );

    await sellModl(
      USER_ALICE,
      (await modl.balanceOf(await USER_ALICE.getAddress())).toString()
    );
    await sellModl(
      USER_BRENT,
      (await modl.balanceOf(await USER_BRENT.getAddress())).toString()
    );
    await sellModl(
      USER_CAMMY,
      (await modl.balanceOf(await USER_CAMMY.getAddress())).toString()
    );
    await sellModl(
      USER_DAVID,
      (await modl.balanceOf(await USER_DAVID.getAddress())).toString()
    );

    expect(await poolPrice(await uniswapV3Pool.getAddress())).lt(price);
  });
  it('Cleaning fails if it is front run', async () => {
    const price = await poolPrice(await uniswapV3Pool.getAddress());
    const slot0 = await uniswapV3Pool.slot0();

    await buyModl(USER_ALICE, BigInt(10000).toWei(6));

    expect(
      liquidityManager
        .connect(CREDMARK_MANAGER)
        .clean(slot0.sqrtPriceX96.toString())
    ).reverted;

    expect(await poolPrice(await uniswapV3Pool.getAddress())).gt(price);
  });
  it('Cleaning bumps the price up', async () => {
    const price = await poolPrice(await uniswapV3Pool.getAddress());
    const slot0 = await uniswapV3Pool.slot0();
    await liquidityManager
      .connect(CREDMARK_MANAGER)
      .clean(slot0.sqrtPriceX96.toString());

    expect(await poolPrice(await uniswapV3Pool.getAddress())).gt(price);
  });
  it('Cleaning funds the revenue treasury', async () => {
    expect((await modl.balanceOf(await revenueTreasury.getAddress())).scaledInt(18)).gt(0);
    expect((await usdc.balanceOf(await revenueTreasury.getAddress())).scaledInt(18)).eq(0);
  });
});
