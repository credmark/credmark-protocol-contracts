import { ethers, waffle } from 'hardhat';
import { expect, use } from "chai";

use(waffle.solidity);

import { setupProtocol, MODL, subscriptionBasic, subscriptionPro, rewardsIssuer, subscriptionSuperPro, mockModlPriceOracle, revenueTreasury } from './helpers/contracts';
import { CREDMARK_DEPLOYER, HACKER_ZACH, MOCK_GODMODE, setupUsers, USER_ALICE, USER_BRENT, USER_CAMMY, USER_DAVID } from './helpers/users';
import { advanceAMonth, advanceAYear } from './helpers/time';
import { PriceAccumulator, ShareAccumulator } from '../typechain';

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
describe('Subscription.sol', () => {
    let subscriptionProDepAcc: ShareAccumulator;
    let rewardsAccumulator: ShareAccumulator;
    let abal: Number;
    let bbal: Number;
    let cbal: Number;
    let abRewards: Number;
    let bbRewards: Number; 
    let cbRewards: Number; 
    let apRewards: Number;
    let bpRewards: Number; 
    let cpRewards: Number; 
    let aspRewards: Number;
    let bspRewards: Number; 
    let cspRewards: Number; 
    let bTotalDep: Number;
    let bTotalRewards: Number;
    let pTotalDep: Number;
    let pTotalRewards: Number;
    let spTotalDep: Number;
    let spTotalRewards: Number;

    async function balances() {
        function roundNearest100(num:Number) {
            return Math.round(Number(num) / 100) * 100;
          }
        abal = roundNearest100((await (await (MODL.balanceOf(USER_ALICE.address))).toString()).TokValInt());
        bbal = roundNearest100((await (await (MODL.balanceOf(USER_BRENT.address))).toString()).TokValInt());
        cbal = roundNearest100((await (await (MODL.balanceOf(USER_CAMMY.address))).toString()).TokValInt());


        abRewards = roundNearest100(await (await subscriptionBasic.rewards(USER_ALICE.address)).toString().TokValInt());
        bbRewards = roundNearest100(await (await subscriptionBasic.rewards(USER_BRENT.address)).toString().TokValInt());
        cbRewards = roundNearest100(await (await subscriptionBasic.rewards(USER_CAMMY.address)).toString().TokValInt());
        apRewards = roundNearest100(await (await subscriptionPro.rewards(USER_ALICE.address)).toString().TokValInt());
        bpRewards = roundNearest100(await (await subscriptionPro.rewards(USER_BRENT.address)).toString().TokValInt());
        cpRewards = roundNearest100(await (await subscriptionPro.rewards(USER_CAMMY.address)).toString().TokValInt());
        aspRewards = roundNearest100(await (await subscriptionSuperPro.rewards(USER_ALICE.address)).toString().TokValInt());
        bspRewards = roundNearest100(await (await subscriptionSuperPro.rewards(USER_BRENT.address)).toString().TokValInt());
        cspRewards = roundNearest100(await (await subscriptionSuperPro.rewards(USER_CAMMY.address)).toString().TokValInt());
        bTotalDep = roundNearest100(await (await subscriptionBasic.totalDeposits()).toString().TokValInt());
        pTotalDep = roundNearest100(await (await subscriptionPro.totalDeposits()).toString().TokValInt());
        spTotalDep = roundNearest100(await (await subscriptionSuperPro.totalDeposits()).toString().TokValInt());
        bTotalRewards = roundNearest100(await (await subscriptionBasic.totalRewards()).toString().TokValInt());
        pTotalRewards = roundNearest100(await (await subscriptionPro.totalRewards()).toString().TokValInt());
        spTotalRewards = roundNearest100(await (await subscriptionSuperPro.totalRewards()).toString().TokValInt());
        console.log(new Date((await ethers.provider.getBlock('latest')).timestamp * 1000));
        console.log("modl", abal, bbal, cbal);
        console.log("basic", bTotalDep, bTotalRewards, "rewards:", abRewards, bbRewards, cbRewards);
        console.log("pro", pTotalDep, pTotalRewards, "rewards:",apRewards, bpRewards, cpRewards);
        console.log("superpro", spTotalDep, spTotalRewards, "rewards:",aspRewards, bspRewards, cspRewards);
        console.log();
    }

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

    });
    it('Subscription: Complex dilution', async () => {
        
        await expect(subscriptionBasic.connect(USER_ALICE).deposit(USER_ALICE.address, "10000000000000000000000")).not.reverted;
        await expect(subscriptionSuperPro.connect(USER_BRENT).deposit(USER_BRENT.address, "10000000000000000000000")).not.reverted;
        await advanceAYear();
        await balances()
        await expect(subscriptionBasic.connect(USER_CAMMY).deposit(USER_CAMMY.address, "10000000000000000000000")).not.reverted;
        await subscriptionSuperPro.connect(USER_BRENT).exit(USER_BRENT.address);
        await balances();
        await advanceAYear();
        await expect(subscriptionBasic.connect(USER_ALICE).claim(USER_ALICE.address)).not.reverted;
        await expect(subscriptionBasic.connect(USER_CAMMY).claim(USER_CAMMY.address)).not.reverted;

        await balances();

        expect(abal).eq(175000)
        expect(cbal).eq(125000)
    });
    it('Subscription: Can Deposit', async () => {
        await expect((subscriptionBasic.connect(USER_ALICE).deposit(USER_ALICE.address, "100000000000000000000"))).not.reverted;
        await expect((subscriptionBasic.connect(HACKER_ZACH).deposit(HACKER_ZACH.address, "100000000000000000000"))).reverted;
    });

    it('Subscription: Deposit Math Works', async () => {
        await subscriptionBasic.connect(USER_ALICE).deposit(USER_ALICE.address, "100000000000000000000");

        expect((await subscriptionBasic.deposits(USER_ALICE.address)).toString()).to.eq("100000000000000000000");
        expect((await subscriptionBasic.deposits(USER_BRENT.address)).toString()).to.eq("0");
        expect((await subscriptionBasic.deposits(USER_CAMMY.address)).toString()).to.eq("0");

        await subscriptionBasic.connect(USER_BRENT).deposit(USER_BRENT.address, "50000000000000000000");

        expect((await subscriptionBasic.deposits(USER_ALICE.address)).toString()).to.eq("100000000000000000000");
        expect((await subscriptionBasic.deposits(USER_BRENT.address)).toString()).to.eq("50000000000000000000");
        expect((await subscriptionBasic.deposits(USER_CAMMY.address)).toString()).to.eq("0");

        await subscriptionBasic.connect(USER_BRENT).deposit(USER_BRENT.address, "50000000000000000000");

        expect((await subscriptionBasic.deposits(USER_ALICE.address)).toString()).to.eq("100000000000000000000");
        expect((await subscriptionBasic.deposits(USER_BRENT.address)).toString()).to.eq("100000000000000000000");
        expect((await subscriptionBasic.deposits(USER_CAMMY.address)).toString()).to.eq("0");
    });

    it('Subscription: Fee Math Works', async () => {
        await subscriptionPro.connect(USER_ALICE).deposit(USER_ALICE.address, "10000000000000000000000");

        await advanceAMonth();

        expect(await (await subscriptionPro.fees(USER_ALICE.address)).toString()).eq("500000000000000000000");

        await advanceAMonth();
        
        expect(await (await subscriptionPro.fees(USER_ALICE.address)).toString()).eq("1000000000000000000000");

        await mockModlPriceOracle.set("200000000", "8");
        await subscriptionPro.snapshot();

        await advanceAMonth();

        expect(await (await subscriptionPro.fees(USER_ALICE.address)).toString().substring(0, 4)).eq("1250");

        await mockModlPriceOracle.set("400000000", "8");
        await subscriptionPro.snapshot();

        await advanceAMonth();

        expect(await (await subscriptionPro.fees(USER_ALICE.address)).toString().substring(0, 4)).eq("1375");

        await mockModlPriceOracle.set("100000000", "8");
        await subscriptionPro.snapshot();

        await advanceAMonth();

        expect(await (await subscriptionPro.fees(USER_ALICE.address)).toString().substring(0, 4)).eq("1875");

        await mockModlPriceOracle.set("50000000", "8");
        await subscriptionPro.snapshot();

        await advanceAMonth();

        expect(await (await subscriptionPro.fees(USER_ALICE.address)).toString().substring(0, 4)).eq("2375");
    });

    it('Subscription: Can Exit', async () => {
        await expect((subscriptionBasic.connect(USER_ALICE).deposit(USER_ALICE.address, "10000000000000000000000"))).not.reverted;
        await expect((subscriptionBasic.connect(USER_ALICE).exit(USER_ALICE.address))).reverted;
        await advanceAMonth();
        await advanceAMonth();

        await expect((subscriptionBasic.connect(HACKER_ZACH).exit(USER_ALICE.address))).reverted;
        expect((await MODL.balanceOf(USER_ALICE.address)).toString()).to.eq("0");
        await ((subscriptionBasic.connect(USER_ALICE).exit(USER_ALICE.address)));
        expect((await MODL.balanceOf(USER_ALICE.address)).toString()).to.eq("10000000000000000000000");

    });

    it('Subscription: Collects Fees', async () => {
        await expect((subscriptionPro.connect(USER_ALICE).deposit(USER_ALICE.address, "10000000000000000000000"))).not.reverted;
        await advanceAMonth();
        await advanceAMonth();
        await expect((subscriptionPro.connect(USER_ALICE).exit(USER_ALICE.address))).not.reverted;
        expect((await MODL.balanceOf(revenueTreasury.address)).toString()).not.eq("0");
    });

    it('Subscription: Claims Rewards', async () => {
        await expect((subscriptionPro.connect(USER_ALICE).deposit(USER_ALICE.address, "10000000000000000000000"))).not.reverted;
        await advanceAYear();
        await expect((subscriptionPro.connect(USER_ALICE).claim(USER_ALICE.address))).not.reverted;

        expect((await MODL.balanceOf(rewardsIssuer.address)).toString().TokValInt()).eq(0);
        expect((await MODL.balanceOf(subscriptionPro.address)).toString().TokValInt()).eq(10000);
        expect((await MODL.balanceOf(USER_ALICE.address)).toString().TokValInt()).eq(249999);
    });

    it('Subscription: Rewards Dilution Works', async () => {

        await balances();

        await expect(subscriptionPro.connect(USER_ALICE).deposit(USER_ALICE.address, "10000000000000000000000")).not.reverted;
        await expect(subscriptionPro.connect(USER_BRENT).deposit(USER_BRENT.address, "10000000000000000000000")).not.reverted;
        await expect(subscriptionSuperPro.connect(USER_CAMMY).deposit(USER_CAMMY.address, "10000000000000000000000")).not.reverted;


        await balances();
        await advanceAYear();
        await balances();

        await (subscriptionPro.connect(USER_ALICE).claim(USER_ALICE.address));
        await (subscriptionPro.connect(USER_BRENT).claim(USER_BRENT.address));
        await (subscriptionSuperPro.connect(USER_CAMMY).claim(USER_CAMMY.address));
        await balances();

        expect(abal).eq(bbal);
        expect(Number(abal)*2).eq(cbal);

        await advanceAYear();
        await balances();
        await (subscriptionPro.connect(USER_ALICE).claim(USER_ALICE.address));
        await (subscriptionPro.connect(USER_BRENT).claim(USER_BRENT.address));
        await (subscriptionSuperPro.connect(USER_CAMMY).claim(USER_CAMMY.address));

        await balances();
        expect(abal).eq(bbal);
        expect(Number(abal)*2).eq(cbal);

        await (subscriptionPro.connect(USER_ALICE).exit(USER_ALICE.address));
        
        await balances();

        await advanceAYear();
        await balances();
        await expect(subscriptionPro.connect(USER_ALICE).claim(USER_ALICE.address)).reverted;
        await (subscriptionPro.connect(USER_BRENT).claim(USER_BRENT.address));
        await (subscriptionSuperPro.connect(USER_CAMMY).claim(USER_CAMMY.address));
        await balances();
    });



})