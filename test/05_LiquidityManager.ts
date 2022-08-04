import { ethers, waffle } from 'hardhat';
import * as chai from 'chai';
chai.use(waffle.solidity);

let expect = chai.expect;

import { setupProtocol, MODLConversion, MODL, DEFAULT_ADMIN_ROLE, CMK, USDC, liquidityManager } from './helpers/contracts';
import { setupUsers, CREDMARK_MANAGER, HACKER_ZACH, USER_ALICE, USER_BRENT, USER_CAMMY, USER_DAVID } from './helpers/users';
import { advanceAnHour, advanceADay, advanceAMonth, advanceAYear} from './helpers/time';


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

describe('LiquidityManager.sol', () => {

    beforeEach(async () => {
        await setupProtocol();
        await setupUsers();

        await CMK.connect(CREDMARK_MANAGER).transfer(USER_ALICE.address, (10000).BNTokStr());
        await CMK.connect(CREDMARK_MANAGER).transfer(USER_BRENT.address, (10000).BNTokStr());
        await CMK.connect(CREDMARK_MANAGER).transfer(USER_CAMMY.address, (10000).BNTokStr());
        await USDC.connect(CREDMARK_MANAGER).transfer(USER_ALICE.address, "10000000000");
        await USDC.connect(CREDMARK_MANAGER).transfer(USER_BRENT.address, "10000000000");
        await USDC.connect(CREDMARK_MANAGER).transfer(USER_CAMMY.address, "10000000000");

    });

    it('Cant be started empty', async () => {
        await expect(liquidityManager.start()).to.be.reverted;
    });

})