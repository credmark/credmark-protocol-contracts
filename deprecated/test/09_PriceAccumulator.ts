import { ethers, waffle } from 'hardhat';
import { expect, use } from "chai";

use(waffle.solidity);

import { setupProtocol, MODL, NULL_ADDRESS, lTime, deployContracts, ACCUMULATOR_ROLE } from './helpers/contracts';
import { CREDMARK_DEPLOYER, setupUsers, USER_ALICE, USER_BRENT, USER_CAMMY } from './helpers/users';
import { PriceAccumulator, PriceAccumulator__factory, ShareAccumulator, ShareAccumulator__factory } from '../typechain';
import { advance1000Seconds, advanceADay, advanceAMonth, advanceAnHour } from './helpers/time';
import { test } from 'mocha';


describe('PriceAccumulator.sol', () => {
    
    let priceAccumulator: PriceAccumulator;
    let priceAccumulatorFactory: PriceAccumulator__factory;
    before(async () => {
        await setupUsers();
        await deployContracts();
        priceAccumulatorFactory = await ethers.getContractFactory('PriceAccumulator', {libraries: {Time: lTime.address,}});
        
    });
    
    beforeEach(async () => {
        priceAccumulator = await priceAccumulatorFactory.deploy();
        await priceAccumulator.grantRole("0xfed5467d1ffffef58992591affe25fd505c7c87525d56768b890b827b47dd266", CREDMARK_DEPLOYER.address)
    });

    let displayProportions = async()=>{

    }

    let owed = (rate:number, monthly:number, offset:number, currentOffset:number) => {
        return (currentOffset - offset) * rate / monthly;
    }

    it('Price Accumulation Works', async () => {
        let rate = 500;
        let monthly = 30 * 24 * 60 * 60;
        let currentOffset = 0;
        let offset = 0;
        await priceAccumulator.setPrice( "100000000");
        await advanceAMonth();
        currentOffset = (await priceAccumulator.offset()).toNumber();
        
        console.log(owed(rate, monthly, offset, currentOffset ))
        offset = currentOffset

        await advanceAMonth();
        currentOffset = (await priceAccumulator.offset()).toNumber();
        console.log(owed(rate, monthly, offset, currentOffset ))

        await advanceAMonth();
        currentOffset = (await priceAccumulator.offset()).toNumber();
        console.log(owed(rate, monthly, offset, currentOffset ))

        await priceAccumulator.setPrice("200000000");

        await advanceAMonth();
        currentOffset = (await priceAccumulator.offset()).toNumber();
        console.log(owed(rate, monthly, offset, currentOffset ))

        await advanceAMonth();
        currentOffset = (await priceAccumulator.offset()).toNumber();
        console.log(owed(rate, monthly, offset, currentOffset ))
        
        await priceAccumulator.setPrice("100000000");

        await advanceAMonth();
        currentOffset = (await priceAccumulator.offset()).toNumber();
        console.log(owed(rate, monthly, offset, currentOffset ))



    });
})