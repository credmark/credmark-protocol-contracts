import { ethers, waffle } from 'hardhat';
import * as chai from 'chai';
chai.use(waffle.solidity);

let expect = chai.expect;

import { setupProtocol, MODLConversion, MODL, DEFAULT_ADMIN_ROLE, CMK } from './helpers/contracts';
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

describe('ModlCmkConversion.sol', () => {


    beforeEach(async () => {
        await setupProtocol();
        await setupUsers();

        await CMK.connect(CREDMARK_MANAGER).transfer(USER_ALICE.address, (10000).BNTokStr());
        await CMK.connect(CREDMARK_MANAGER).transfer(USER_BRENT.address, (10000).BNTokStr());
        await CMK.connect(CREDMARK_MANAGER).transfer(USER_CAMMY.address, (10000).BNTokStr());

        await CMK.connect(USER_ALICE).approve(MODLConversion.address, (10000).BNTokStr());
        await CMK.connect(USER_BRENT).approve(MODLConversion.address, (10000).BNTokStr());
        await CMK.connect(USER_CAMMY).approve(MODLConversion.address, (10000).BNTokStr());

        depositDiv = (await MODLConversion.depositDiv()).toNumber();
        conversionMul = (await MODLConversion.conversionMul()).toNumber();
    });

    it('Permissions prevent unauthorized changes', async () => {
        await expect(MODLConversion.connect(HACKER_ZACH).setModl(MODL.address)).to.be.reverted;
        await expect(MODLConversion.connect(HACKER_ZACH).startConversions()).to.be.reverted;
        await expect(MODLConversion.connect(HACKER_ZACH).startDeposits()).to.be.reverted;
    });

    it('Permissions allow authorized changes', async () => {
        await expect(MODLConversion.connect(CREDMARK_MANAGER).setModl(MODL.address)).not.to.be.reverted;
        await expect(MODLConversion.connect(CREDMARK_MANAGER).startConversions()).not.to.be.reverted;
        await expect(MODLConversion.connect(CREDMARK_MANAGER).startDeposits()).not.to.be.reverted;
    });

    it('CMK Can be deposited right away', async () => {
        await MODLConversion.connect(USER_ALICE).deposit((10000).BNTokStr());

        expect(await CMK.balanceOf(USER_ALICE.address)).eq(0);
        expect(await MODLConversion.balanceOf(USER_ALICE.address)).eq((10000 / Number(depositDiv)).BNTokStr());
    });
    
    it('CMK deposits work as expected.', async () => {
        await MODLConversion.connect(CREDMARK_MANAGER).startDeposits();
        await advanceAMonth();

        await MODLConversion.connect(USER_ALICE).deposit((10000).BNTokStr());
        expect((await MODLConversion.balanceOf(USER_ALICE.address)).toString().TokValInt()).lessThan(10000 / Number(depositDiv));

        await advanceAYear();

        await MODLConversion.connect(USER_BRENT).deposit((10000).BNTokStr());
        expect((await MODLConversion.balanceOf(USER_BRENT.address)).toString().TokValInt()).equal(0);
    });

    it('CMK conversions work as expected.', async () => {

        await MODLConversion.connect(USER_ALICE).deposit((10000).BNTokStr());
        await MODLConversion.connect(USER_BRENT).deposit((10000).BNTokStr());
        await MODLConversion.connect(CREDMARK_MANAGER).startDeposits();

        await advanceAMonth();

        await MODLConversion.connect(USER_CAMMY).deposit((10000).BNTokStr());

        await advanceAMonth();

        let cmkModlAmount = await MODLConversion.balanceOf(USER_ALICE.address);

        await expect(MODLConversion.connect(USER_ALICE).convert(cmkModlAmount)).to.be.reverted;

        await MODLConversion.connect(CREDMARK_MANAGER).startConversions();

        await expect( MODLConversion.connect(USER_ALICE).convert(cmkModlAmount)).not.to.be.reverted;
        await expect( MODLConversion.connect(USER_ALICE).convert(cmkModlAmount)).to.be.reverted;

        await advanceAMonth();

        await expect( MODLConversion.connect(USER_BRENT).convert(
            (await MODLConversion.balanceOf(USER_BRENT.address))
            )).not.to.be.reverted;

        let a = (await MODL.balanceOf(USER_ALICE.address)).toString().TokValInt()
        let b = (await MODL.balanceOf(USER_BRENT.address)).toString().TokValInt()

        expect(a).lessThan(b);

        await advanceAMonth();
        await advanceAMonth();
        await advanceAMonth();

        await expect( MODLConversion.connect(USER_CAMMY).convert(
            (await MODLConversion.balanceOf(USER_CAMMY.address))
            )).not.to.be.reverted;

        let c = (await MODL.balanceOf(USER_CAMMY.address)).toString().TokValInt()

        expect(b).lessThan(c);
    });
})