import { ethers, waffle } from 'hardhat';
import * as chai from 'chai';
chai.use(waffle.solidity);

let expect = chai.expect;

import { setupProtocol, MODLConversion, MODL, DEFAULT_ADMIN_ROLE, CMK, USDC, liquidityManager, MINTER_ROLE, NULL_ADDRESS, swapRouter } from './helpers/contracts';
import { setupUsers, CREDMARK_MANAGER, HACKER_ZACH, USER_ALICE, USER_BRENT, USER_CAMMY, USER_DAVID, CREDMARK_TREASURY_MULTISIG, CREDMARK_DEPLOYER } from './helpers/users';
import { advanceAnHour, advanceADay, advanceAMonth, advanceAYear} from './helpers/time';
import { IUniswapV3Pool } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';


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

Number.prototype.BNTokStr = function() { 
    return '' + this + '000000000000000000'; 
  }

String.prototype.TokValInt = function () {
    if (this == "0") {
        return 0;
    }
    return Number(this.slice(0, -18));
}
let depositDiv: Number;
let conversionMul: Number;

let priceDiff = function(oldPrice: number, newPrice: number) {
  return (((newPrice-oldPrice) / oldPrice)* 100)
}

describe('LiquidityManager.sol operation', () => {
    let uniswapV3Pool: IUniswapV3Pool;
    before(async function () {
        await setupUsers();
        await setupProtocol();


        await USDC.connect(CREDMARK_MANAGER).transfer(USER_ALICE.address, "1000000000000");
        await USDC.connect(CREDMARK_MANAGER).transfer(USER_BRENT.address, "1000000000000");
        await USDC.connect(CREDMARK_MANAGER).transfer(USER_CAMMY.address, "1000000000000");

        await MODL.connect(CREDMARK_DEPLOYER).grantRole(MINTER_ROLE, CREDMARK_TREASURY_MULTISIG.address);
        advanceAnHour()
        await MODL.connect(CREDMARK_TREASURY_MULTISIG).mint(liquidityManager.address, (6700000).BNTokStr());

        await liquidityManager.start();

        uniswapV3Pool = (await ethers.getContractAt(
            "contracts/external/uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool",
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
        let slot0 = await uniswapV3Pool.slot0();
        if (BigNumber.from("0x1000000000000000000000000").gt(slot0.sqrtPriceX96)){
          let x = BigNumber.from("0x1000000000000000000000000").div(slot0.sqrtPriceX96).toNumber();
          let price = ((1/(x*x)) * (1000000) * (1000000)) ;
          return price;
        }
        let x = slot0.sqrtPriceX96.div(BigNumber.from("0x1000000000000000000000000")).toNumber();
        let price = ((x*x) / (1000000) / (1000000)) ;
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
        })
      }
    
    it('Can swap', async () => {
      console.log(await price())
      await swapUSDC(USER_ALICE, '1');
      let p0 = await price();
        console.log(await price())
        await swapUSDC(USER_ALICE, '999999000000');
        await swapUSDC(USER_BRENT, '1000000000000');
        await swapUSDC(USER_CAMMY, '1000000000000');
      let p1 = await price();
      console.log(priceDiff(p0, p1) + '%');
        console.log(await price())
        console.log((await MODL.balanceOf(USER_ALICE.address)).toString().TokValInt())
        expect((await MODL.balanceOf(USER_ALICE.address))).to.not.eq(0);

        await swapModl(USER_ALICE, (await MODL.balanceOf(USER_ALICE.address)).toString())
        await swapModl(USER_BRENT, (await MODL.balanceOf(USER_BRENT.address)).toString())
        await swapModl(USER_CAMMY, (await MODL.balanceOf(USER_CAMMY.address)).toString())

        console.log(await price());
        let slot0 = await uniswapV3Pool.slot0();
        await liquidityManager.connect(CREDMARK_MANAGER).clean(slot0.sqrtPriceX96.toString());
        console.log(await price());
        console.log((await USDC.balanceOf(uniswapV3Pool.address)).toString())
    });
});