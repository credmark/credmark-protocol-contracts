import { ethers, waffle } from 'hardhat';
import { expect, use } from "chai";

use(waffle.solidity);

import { setupProtocol, MODL, NULL_ADDRESS } from './helpers/contracts';
import { CREDMARK_DEPLOYER, setupUsers, USER_ALICE, USER_BRENT, USER_CAMMY } from './helpers/users';
import { ShareAccumulator, ShareAccumulator__factory } from '../typechain';
import { advance1000Seconds, advanceADay, advanceAnHour } from './helpers/time';
import { test } from 'mocha';

describe('ShareAccumulator.sol', () => {
    
    let testShareAccumulator: ShareAccumulator;
    let shareAccumulatorFactory: ShareAccumulator__factory;

    before(async () => {
        await setupUsers();
        shareAccumulatorFactory = await ethers.getContractFactory('ShareAccumulator', CREDMARK_DEPLOYER);
        
    });
    
    beforeEach(async () => {
        testShareAccumulator = await shareAccumulatorFactory.deploy();
    });

    let displayProportions = async()=>{
        let total = await testShareAccumulator.totalAccumulation()
        
        console.log("alice: ", 100 * (await testShareAccumulator.accumulation(USER_ALICE.address)).toNumber() / total.toNumber(), "percent")
        console.log("brent: ", 100 * (await testShareAccumulator.accumulation(USER_BRENT.address)).toNumber() / total.toNumber(), "percent")
        console.log("cammy: ", 100 * (await testShareAccumulator.accumulation(USER_CAMMY.address)).toNumber() / total.toNumber(), "percent")
    }

    it('ShareAccumulator.sol', async () => {

        await testShareAccumulator.updateShares(USER_ALICE.address, "10");

        await advance1000Seconds();

        await displayProportions();

        await testShareAccumulator.updateShares(USER_BRENT.address, "20");

        await advance1000Seconds();

        await displayProportions();

        await testShareAccumulator.updateShares(USER_CAMMY.address, "30");

        await advance1000Seconds();
        await displayProportions();
        await advance1000Seconds();
        await displayProportions();
        await advance1000Seconds();
        await displayProportions();
        await advance1000Seconds();
        await displayProportions();

        await testShareAccumulator.updateShares(USER_CAMMY.address, "0");

        await advance1000Seconds();
        await displayProportions();
        await advance1000Seconds();
        await displayProportions();
        await advance1000Seconds();
        await displayProportions();
        await advance1000Seconds();
        await displayProportions();

        
        console.log(await testShareAccumulator.totalAccumulation())
    });
})