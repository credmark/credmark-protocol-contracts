import { ethers } from 'hardhat';

import {
  liquidityManager,
  MODL,
  setupProtocol,
  swapRouter,
  USDC,
} from './helpers/contracts';
import { advanceAMonth, advanceAnHour, advanceAYear } from './helpers/time';
import {
  CREDMARK_CONFIGURER,
  CREDMARK_MANAGER,
  setupUsers,
  USER_ALICE,
  USER_BRENT,
  USER_CAMMY,
} from './helpers/users';

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { IUniswapV3Pool } from '../typechain';

function expectClose(value: number, expectedValue: number) {
  expect(value).to.greaterThanOrEqual(expectedValue * 0.98);
  expect(value).to.lessThanOrEqual(expectedValue * 1.02);
}
declare global {
  interface Number {
    BNTokStr: () => string;
  }
  interface String {
    TokValInt: () => Number;
  }
}

Number.prototype.BNTokStr = function () {
  return '' + this + '000000000000000000';
};

String.prototype.TokValInt = function () {
  if (this == '0') {
    return 0;
  }
  return Number(this.slice(0, -18));
};
let depositDiv: Number;
let conversionMul: Number;

const priceDiff = function (oldPrice: number, newPrice: number) {
  return ((newPrice - oldPrice) / oldPrice) * 100;
};

describe('LiquidityManager.sol : setup', () => {
  beforeEach(async () => {
    await setupUsers();
  });

  it('test ability to start with both random orientations', async () => {
    let token0tested = false;
    let token1tested = false;

    while (!token0tested || !token1tested) {
      await setupProtocol();
      await liquidityManager.connect(CREDMARK_MANAGER).mint();
      await liquidityManager.connect(CREDMARK_MANAGER).start();
      expect(await (await liquidityManager.started()).toString()).not.eq('0');
      const uniswapV3Pool = (await ethers.getContractAt(
        'contracts/external/uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool',
        (await liquidityManager.pool()).toString()
      )) as IUniswapV3Pool;
      if (MODL.address == (await uniswapV3Pool.token0())) {
        token0tested = true;
      }
      if (MODL.address == (await uniswapV3Pool.token1())) {
        token1tested = true;
      }
    }
    expect(await (await liquidityManager.started()).toString()).not.eq('0');
  });

  it('Check Setup reversion states', async () => {
    await setupProtocol();
    await liquidityManager.connect(CREDMARK_MANAGER).mint();

    expect(await (await liquidityManager.started()).toString()).eq('0');
    await expect(liquidityManager.connect(CREDMARK_MANAGER).start()).not
      .reverted;
    expect(await (await liquidityManager.started()).toString()).not.eq('0');
    await expect(liquidityManager.start()).reverted;
    await expect(liquidityManager.clean('0')).reverted;
    await USDC.connect(CREDMARK_MANAGER).transfer(
      liquidityManager.address,
      '10000000000'
    );
  });
});

describe('LiquidityManager.sol operation', () => {
  let uniswapV3Pool: IUniswapV3Pool;
  before(async function () {
    await setupUsers();
    await setupProtocol();

    await USDC.connect(CREDMARK_MANAGER).transfer(
      USER_ALICE.address,
      '1000000000000'
    );
    await USDC.connect(CREDMARK_MANAGER).transfer(
      USER_BRENT.address,
      '1000000000000'
    );
    await USDC.connect(CREDMARK_MANAGER).transfer(
      USER_CAMMY.address,
      '1000000000000'
    );

    advanceAnHour();

    await liquidityManager.connect(CREDMARK_MANAGER).mint();
    await liquidityManager.connect(CREDMARK_MANAGER).start();

    uniswapV3Pool = (await ethers.getContractAt(
      'contracts/external/uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool',
      (await liquidityManager.pool()).toString()
    )) as IUniswapV3Pool;
  });

  async function swapModl(account: SignerWithAddress, amount: string) {
    await MODL.connect(account).approve(swapRouter.address, amount);

    await swapRouter.connect(account).exactInputSingle({
      tokenIn: MODL.address,
      tokenOut: USDC.address,
      recipient: account.address,
      fee: 10000,
      deadline: 20000000000,
      amountIn: amount,
      sqrtPriceLimitX96: 0,
      amountOutMinimum: 0,
    });
  }
  async function price() {
    const slot0 = await uniswapV3Pool.slot0();
    if (BigNumber.from('0x1000000000000000000000000').gt(slot0.sqrtPriceX96)) {
      const x = BigNumber.from('0x1000000000000000000000000')
        .div(slot0.sqrtPriceX96)
        .toNumber();
      const price = (1 / (x * x)) * 1000000 * 1000000;
      return price;
    }
    const x = slot0.sqrtPriceX96
      .div(BigNumber.from('0x1000000000000000000000000'))
      .toNumber();
    const price = (x * x) / 1000000 / 1000000;
    return price;
  }

  async function swapUSDC(account: SignerWithAddress, amount: string) {
    await USDC.connect(account).approve(swapRouter.address, amount);

    await swapRouter.connect(account).exactInputSingle({
      tokenIn: USDC.address,
      tokenOut: MODL.address,
      recipient: account.address,
      fee: 10000,
      deadline: 20000000000,
      amountIn: amount,
      sqrtPriceLimitX96: 0,
      amountOutMinimum: 0,
    });
  }

  it('Can swap', async () => {
    await swapUSDC(USER_ALICE, '1');
    const p0 = await price();
    await swapUSDC(USER_ALICE, '999999000000');
    await swapUSDC(USER_BRENT, '1000000000000');
    await swapUSDC(USER_CAMMY, '1000000000000');
    const p1 = await price();
    expect(await MODL.balanceOf(USER_ALICE.address)).to.not.eq(0);

    await swapModl(
      USER_ALICE,
      (await MODL.balanceOf(USER_ALICE.address)).toString()
    );
    await swapModl(
      USER_BRENT,
      (await MODL.balanceOf(USER_BRENT.address)).toString()
    );
    await swapModl(
      USER_CAMMY,
      (await MODL.balanceOf(USER_CAMMY.address)).toString()
    );

    const slot0 = await uniswapV3Pool.slot0();
    await liquidityManager
      .connect(CREDMARK_MANAGER)
      .clean(slot0.sqrtPriceX96.toString());
  });
  it('Can pull liquidity after 2 years.', async () => {
    await expect(
      liquidityManager
        .connect(CREDMARK_CONFIGURER)
        .transferPosition(CREDMARK_CONFIGURER.address)
    ).reverted;
    await advanceAYear();
    await advanceAYear();
    await advanceAMonth();
    await expect(
      liquidityManager
        .connect(CREDMARK_CONFIGURER)
        .transferPosition(CREDMARK_CONFIGURER.address)
    ).not.reverted;
  });
});
