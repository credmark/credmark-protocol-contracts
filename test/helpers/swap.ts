import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber, BigNumberish } from 'ethers';
import { ethers } from 'hardhat';
import { modl, swapRouter, usdc } from './contracts';

export async function sellModl(
  account: SignerWithAddress,
  amount: BigNumberish
) {
  await modl.connect(account).approve(swapRouter.address, amount);
  return await swapRouter.connect(account).exactInputSingle({
    tokenIn: modl.address,
    tokenOut: usdc.address,
    recipient: account.address,
    fee: 10000,
    deadline: 20000000000,
    amountIn: amount,
    sqrtPriceLimitX96: 0,
    amountOutMinimum: 0,
  });
}

export async function buyModl(
  account: SignerWithAddress,
  amount: BigNumberish
) {
  await usdc.connect(account).approve(swapRouter.address, amount);
  return await swapRouter.connect(account).exactInputSingle({
    tokenIn: usdc.address,
    tokenOut: modl.address,
    recipient: account.address,
    fee: 10000,
    deadline: 20000000000,
    amountIn: amount,
    sqrtPriceLimitX96: 0,
    amountOutMinimum: 0,
  });
}

export async function poolPrice(address: string) {
  let pool = await ethers.getContractAt('IUniswapV3Pool', address);
  const sqrtPriceX96 = (await pool.slot0()).sqrtPriceX96;
  let decimalDiff = BigNumber.from(1e12);
  let x96 = BigNumber.from('0x1000000000000000000000000');
  let price = 0;
  if (x96.gt(sqrtPriceX96)) {
    // confirmed correct when modl == token0
    price =
      sqrtPriceX96.mul(decimalDiff).div(x96).pow(2).toNumber() /
      decimalDiff.toNumber();
  } else {
    // confirmed correct when modl == token1
    price = decimalDiff.toNumber() / sqrtPriceX96.div(x96).pow(2).toNumber();
  }
  return price;
}
