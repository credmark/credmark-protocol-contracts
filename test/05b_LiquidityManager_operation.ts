import { ethers, waffle } from 'hardhat';
import * as chai from 'chai';
chai.use(waffle.solidity);

let expect = chai.expect;

import { setupProtocol, MODLConversion, MODL, DEFAULT_ADMIN_ROLE, CMK, USDC, liquidityManager, MINTER_ROLE, NULL_ADDRESS, swapRouter } from './helpers/contracts';
import { setupUsers, CREDMARK_MANAGER, HACKER_ZACH, USER_ALICE, USER_BRENT, USER_CAMMY, USER_DAVID, CREDMARK_TREASURY_MULTISIG, CREDMARK_DEPLOYER } from './helpers/users';
import { advanceAnHour, advanceADay, advanceAMonth, advanceAYear} from './helpers/time';
import { IUniswapV3Pool } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';


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

describe('LiquidityManager.sol operation', () => {
    let uniswapV3Pool: IUniswapV3Pool;
    before(async function () {
        await setupUsers();
        await setupProtocol();


        await USDC.connect(CREDMARK_MANAGER).transfer(USER_ALICE.address, "10000000000");
        await USDC.connect(CREDMARK_MANAGER).transfer(USER_BRENT.address, "10000000000");
        await USDC.connect(CREDMARK_MANAGER).transfer(USER_CAMMY.address, "10000000000");

        await MODL.connect(CREDMARK_DEPLOYER).grantRole(MINTER_ROLE, CREDMARK_TREASURY_MULTISIG.address);
        advanceAnHour()
        await MODL.connect(CREDMARK_TREASURY_MULTISIG).mint(liquidityManager.address, (7500000).BNTokStr());

        await liquidityManager.createPool();
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
        console.log((await uniswapV3Pool.slot0()))
        console.log((await USDC.balanceOf(USER_ALICE.address)).toNumber())
        await swapUSDC(USER_ALICE, '100000000');
        console.log((await USDC.balanceOf(USER_ALICE.address)).toNumber())
        console.log((await MODL.balanceOf(USER_ALICE.address)).toNumber())
        expect((await MODL.balanceOf(USER_ALICE.address)).toNumber()).to.not.eq(0);
    });
});