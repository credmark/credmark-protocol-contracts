import { ethers, waffle } from 'hardhat';
import * as chai from 'chai';
chai.use(waffle.solidity);

let expect = chai.expect;

import { setupProtocol, MODLConversion, MODL, DEFAULT_ADMIN_ROLE, CMK, USDC, liquidityManager, MINTER_ROLE, NULL_ADDRESS } from './helpers/contracts';
import { setupUsers, CREDMARK_MANAGER, HACKER_ZACH, USER_ALICE, USER_BRENT, USER_CAMMY, USER_DAVID, CREDMARK_TREASURY_MULTISIG, CREDMARK_DEPLOYER, MOCK_GODMODE } from './helpers/users';
import { advanceAnHour, advanceADay, advanceAMonth, advanceAYear} from './helpers/time';
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

describe('LiquidityManager.sol : setup', () => {

    beforeEach(async () => {
        await setupUsers();
    });

    it('test ability to start with both random orientations', async () => {
        let token0tested = false;
        let token1tested = false;

        while (!token0tested || !token1tested)
        {
            await setupProtocol();
            await MODL.connect(CREDMARK_DEPLOYER).mint(liquidityManager.address, (10000000).BNTokStr());
            await expect(liquidityManager.start()).not.reverted;

            expect(await liquidityManager.started().valueOf()).to.be.true;
            let uniswapV3Pool = (await ethers.getContractAt(
                "contracts/external/uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol:IUniswapV3Pool",
                (await liquidityManager.pool()).toString()
              )) as IUniswapV3Pool;
            if (MODL.address == await uniswapV3Pool.token0()){
                token0tested = true;
            }
            if (MODL.address == await uniswapV3Pool.token1()){
                token1tested = true;
            } 
        }
        expect(await liquidityManager.started().valueOf()).to.be.true;
    });

    it('Check Setup reversion states', async () => {
        await setupProtocol();
        await expect(liquidityManager.start()).reverted;
        expect(await liquidityManager.started().valueOf()).false;
        await expect(liquidityManager.clean()).reverted;
        
        await MODL.connect(CREDMARK_DEPLOYER).mint(liquidityManager.address, (10000000).BNTokStr());
        await expect(liquidityManager.start()).not.reverted;
        expect(await liquidityManager.started().valueOf()).true;
        expect(await liquidityManager.started().valueOf()).not.eq(NULL_ADDRESS);
        await expect(liquidityManager.start()).reverted;
        await expect(liquidityManager.clean()).reverted;
        await USDC.connect(CREDMARK_MANAGER).transfer(liquidityManager.address, "10000000000");
        console.log(await liquidityManager.clean());

    });
    
});