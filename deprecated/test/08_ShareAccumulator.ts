import { ethers, waffle } from 'hardhat';
import { expect, use } from "chai";

use(waffle.solidity);

import { setupProtocol, MODL, NULL_ADDRESS, lTime, deployContracts, ACCUMULATOR_ROLE } from './helpers/contracts';
import { CREDMARK_DEPLOYER, setupUsers, USER_ALICE, USER_BRENT, USER_CAMMY } from './helpers/users';
import { ShareAccumulator, ShareAccumulator__factory } from '../typechain';
import { advance1000Seconds, advanceADay, advanceAMonth, advanceAnHour } from './helpers/time';
import { test } from 'mocha';


describe('ShareAccumulator.sol', () => {
    
    let testShareAccumulator: ShareAccumulator;
    let shareAccumulatorFactory: ShareAccumulator__factory;
    before(async () => {
        await setupUsers();
        await deployContracts();
        shareAccumulatorFactory = await ethers.getContractFactory('ShareAccumulator', {libraries: {Time: lTime.address,}});
        
    });
    
    beforeEach(async () => {
        testShareAccumulator = await shareAccumulatorFactory.deploy();
        await testShareAccumulator.grantRole("0xfed5467d1ffffef58992591affe25fd505c7c87525d56768b890b827b47dd266", CREDMARK_DEPLOYER.address)
    });

    let displayProportions = async()=>{
        let total = parseFloat((await testShareAccumulator.totalAccumulation()).toString());
        let a = parseFloat((await testShareAccumulator.accumulation(USER_ALICE.address)).toString());
        let b = parseFloat((await testShareAccumulator.accumulation(USER_BRENT.address)).toString());
        let c = parseFloat((await testShareAccumulator.accumulation(USER_CAMMY.address)).toString());
        console.log()
        console.log("alice","    ","brent","    ","cammy");
        console.log(
            (a * 100/total).toFixed(2), 
            "%   ",
            (b * 100/total).toFixed(2), 
            "%   ",
            (c * 100/total).toFixed(2), 
            "%   "
        );
        console.log(
            a / (10**18 ), 
            "    ",
            b/ (10**18), 
            "    ",
            c / (10**18), 
            "    ",
            total/ (10**18)
        );
    }

    it('ShareAccumulator.sol', async () => {
        
        await testShareAccumulator.setShares(USER_ALICE.address, "100");
        await advance1000Seconds();
        await displayProportions();
        await testShareAccumulator.setShares(USER_BRENT.address, "100");
        await advance1000Seconds();
        await displayProportions();
        await testShareAccumulator.setShares(USER_BRENT.address, "0");
        await advance1000Seconds();
        await displayProportions();
        await testShareAccumulator.setShares(USER_ALICE.address, "300");
        await testShareAccumulator.setShares(USER_CAMMY.address, "100");
        await advance1000Seconds();
        await displayProportions();
        await advance1000Seconds();
        await displayProportions();
        await testShareAccumulator.removeAccumulation(USER_ALICE.address).toString();
        await displayProportions();
        await advance1000Seconds();
        await testShareAccumulator.setShares(USER_ALICE.address, "0");
        await advance1000Seconds();
        await displayProportions();
        await testShareAccumulator.setShares(USER_CAMMY.address, "0");
        await advanceAMonth();
        await displayProportions();
        await testShareAccumulator.setShares(USER_ALICE.address, "1000000");
        await advance1000Seconds();
        await displayProportions();
    });
})