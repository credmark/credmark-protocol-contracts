import { ethers, waffle } from 'hardhat';
import { expect, use } from "chai";

use(waffle.solidity);

import { setupProtocol, MODL, subscriptionBasic, subscriptionPro, rewardsIssuer, POOL_ROLE, subscriptionSuperPro, priceAccumulator, ACCUMULATOR_ROLE } from './helpers/contracts';
import { CREDMARK_DEPLOYER, HACKER_ZACH, MOCK_GODMODE, setupUsers, USER_ALICE, USER_BRENT, USER_CAMMY, USER_DAVID } from './helpers/users';
import { advanceAMonth, advanceAYear } from './helpers/time';
import { ShareAccumulator } from '../typechain';
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
describe('Pool.sol', () => {
    let subscriptionProDepAcc: ShareAccumulator;
    let rewardsAccumulator: ShareAccumulator;
    before(async () => {

    });
    
    beforeEach(async () => {
        await setupProtocol();
        await setupUsers();
        await MODL.connect(MOCK_GODMODE).mint(USER_ALICE.address, "10000000000000000000000");
        await MODL.connect(MOCK_GODMODE).mint(USER_BRENT.address, "10000000000000000000000");
        await MODL.connect(MOCK_GODMODE).mint(USER_CAMMY.address, "10000000000000000000000");
        await MODL.connect(MOCK_GODMODE).mint(USER_DAVID.address, "10000000000000000000000");

        await MODL.connect(USER_ALICE).approve(subscriptionBasic.address, "10000000000000000000000");
        await MODL.connect(USER_ALICE).approve(subscriptionPro.address,   "10000000000000000000000");
        await MODL.connect(USER_ALICE).approve(subscriptionSuperPro.address,   "10000000000000000000000");

        await MODL.connect(USER_BRENT).approve(subscriptionBasic.address, "10000000000000000000000");
        await MODL.connect(USER_BRENT).approve(subscriptionPro.address,   "10000000000000000000000");
        await MODL.connect(USER_BRENT).approve(subscriptionSuperPro.address,   "10000000000000000000000");

        await MODL.connect(USER_CAMMY).approve(subscriptionBasic.address, "10000000000000000000000");
        await MODL.connect(USER_CAMMY).approve(subscriptionPro.address,   "10000000000000000000000");
        await MODL.connect(USER_CAMMY).approve(subscriptionSuperPro.address,   "10000000000000000000000");

        await MODL.connect(USER_DAVID).approve(subscriptionBasic.address, "10000000000000000000000");
        await MODL.connect(USER_DAVID).approve(subscriptionPro.address,   "10000000000000000000000");
        await MODL.connect(USER_DAVID).approve(subscriptionSuperPro.address,   "10000000000000000000000");

        subscriptionProDepAcc = (await ethers.getContractAt(
            "ShareAccumulator",
            (await subscriptionPro.depositAccumulator()).toString()
          )) as ShareAccumulator;

        rewardsAccumulator = (await ethers.getContractAt(
            "ShareAccumulator",
            (await rewardsIssuer.accumulator()).toString()
          )) as ShareAccumulator;
    });

    it('POOL: Can Deposit', async () => {
        await expect((subscriptionBasic.connect(USER_ALICE).deposit("100000000000000000000"))).not.reverted;
        await expect((subscriptionBasic.connect(HACKER_ZACH).deposit("100000000000000000000"))).reverted;
    });

    it('POOL: Deposit Math Works', async () => {
        await subscriptionBasic.connect(USER_ALICE).deposit("100000000000000000000");

        expect((await subscriptionBasic.getDeposit(USER_ALICE.address)).toString()).to.eq("100000000000000000000");
        expect((await subscriptionBasic.getDeposit(USER_BRENT.address)).toString()).to.eq("0");
        expect((await subscriptionBasic.getDeposit(USER_CAMMY.address)).toString()).to.eq("0");

        await subscriptionBasic.connect(USER_BRENT).deposit("50000000000000000000");

        expect((await subscriptionBasic.getDeposit(USER_ALICE.address)).toString()).to.eq("100000000000000000000");
        expect((await subscriptionBasic.getDeposit(USER_BRENT.address)).toString()).to.eq("50000000000000000000");
        expect((await subscriptionBasic.getDeposit(USER_CAMMY.address)).toString()).to.eq("0");

        await subscriptionBasic.connect(USER_BRENT).deposit("50000000000000000000");

        expect((await subscriptionBasic.getDeposit(USER_ALICE.address)).toString()).to.eq("100000000000000000000");
        expect((await subscriptionBasic.getDeposit(USER_BRENT.address)).toString()).to.eq("100000000000000000000");
        expect((await subscriptionBasic.getDeposit(USER_CAMMY.address)).toString()).to.eq("0");
    });

    it('POOL: Fee Math Works', async () => {
        await priceAccumulator.grantRole(ACCUMULATOR_ROLE, CREDMARK_DEPLOYER.address);
        await subscriptionPro.connect(USER_ALICE).deposit("10000000000000000000000");
        await advanceAMonth();
        expect(await (await subscriptionPro.getFee(USER_ALICE.address)).toString()).eq("500000000000000000000");
        await advanceAMonth();
        expect(await (await subscriptionPro.getFee(USER_ALICE.address)).toString()).eq("1000000000000000000000");
        await priceAccumulator.setPrice(MODL.address, "200000000");
        await advanceAMonth();
        expect(await (await subscriptionPro.getFee(USER_ALICE.address)).toString().substring(0, 4)).eq("1250");
    });

    it('POOL: Can Exit', async () => {
        await expect((subscriptionBasic.connect(USER_ALICE).deposit("100000000000000000000"))).not.reverted;
        await expect((subscriptionBasic.connect(USER_ALICE).exit())).not.reverted;
        expect((await MODL.balanceOf(USER_ALICE.address)).toString()).to.eq("10000000000000000000000");
        await expect((subscriptionBasic.connect(HACKER_ZACH).exit())).reverted;
    });

    it('POOL: Collects Fees', async () => {
        await expect((subscriptionPro.connect(USER_ALICE).deposit("10000000000000000000000"))).not.reverted;
        await advanceAMonth();
        await expect((subscriptionPro.connect(USER_ALICE).exit())).not.reverted;
        expect((await MODL.balanceOf(CREDMARK_DEPLOYER.address)).toString()).not.eq("0");
    });

    it('POOL: Claims Rewards', async () => {
        await expect((subscriptionPro.connect(USER_ALICE).deposit("10000000000000000000000"))).not.reverted;
        await advanceAYear();
        await expect((subscriptionPro.connect(USER_ALICE).claim())).not.reverted;
        expect((await MODL.balanceOf(rewardsIssuer.address)).toString().TokValInt()).eq(0);
        expect((await MODL.balanceOf(subscriptionPro.address)).toString().TokValInt()).eq(10000);
        expect((await MODL.balanceOf(USER_ALICE.address)).toString().TokValInt()).eq(249999);
    });

    it('POOL: Rewards Dilution Works', async () => {
        await expect((subscriptionPro.connect(USER_ALICE).deposit("10000000000000000000000"))).not.reverted;
        await expect((subscriptionPro.connect(USER_BRENT).deposit("10000000000000000000000"))).not.reverted;
        await (subscriptionSuperPro.connect(USER_CAMMY).deposit("10000000000000000000000"));
        await advanceAYear();      
        await (subscriptionSuperPro.connect(USER_CAMMY).claim());
        await (subscriptionPro.connect(USER_ALICE).claim());
        await (subscriptionPro.connect(USER_BRENT).claim());
        await advanceAYear();
        await ((subscriptionSuperPro.connect(USER_CAMMY).claim()));
        await (subscriptionPro.connect(USER_ALICE).claim());
        await (subscriptionPro.connect(USER_BRENT).claim());
        await (subscriptionPro.connect(USER_ALICE).exit());
        await advanceAYear();
        await (subscriptionSuperPro.connect(USER_CAMMY).claim());
        await (subscriptionPro.connect(USER_ALICE).claim());
        await (subscriptionPro.connect(USER_BRENT).claim());
        let abal = await (await (MODL.balanceOf(USER_ALICE.address)));
        let bbal = await (MODL.balanceOf(USER_BRENT.address));
        let cbal = await (MODL.balanceOf(USER_CAMMY.address));
        expect(abal.lt(bbal)).true;
        expect(bbal.lt(cbal)).true;
    });
})