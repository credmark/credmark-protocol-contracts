import { ethers, waffle } from 'hardhat';
import * as chai from 'chai';
chai.use(waffle.solidity);

let expect = chai.expect;

import { setupProtocol, MODLVesting, NULL_ADDRESS, VESTING_MANAGER, MODL } from './helpers/contracts';
import { setupUsers, CREDMARK_MANAGER, USER_ALICE, HACKER_ZACH, USER_BRENT, USER_CAMMY, USER_DAVID, CREDMARK_DEPLOYER } from './helpers/users';
import { advanceAnHour} from './helpers/time';
import { ModlVesting } from '../typechain';

function expectClose(value: number, expectedValue: number) {
    expect(value).to.greaterThanOrEqual(expectedValue * 0.98);
    expect(value).to.lessThanOrEqual(expectedValue * 1.02);
}

describe('ModlVesting.sol', () => {

    beforeEach(async () => {
        await setupProtocol();
        await setupUsers();
    });

    it('Permissions prevent unauthorized changes', async () => {
        await expect(MODLVesting.connect(HACKER_ZACH).update(USER_ALICE.address, "86400", "2400")).to.be.reverted;
        await expect(MODLVesting.connect(HACKER_ZACH).setCeiling("8000000000000000000000000")).to.be.reverted;
        await expect(MODLVesting.connect(HACKER_ZACH).emergencyStop(USER_ALICE.address)).to.be.reverted;

        await expect(MODLVesting.connect(CREDMARK_MANAGER).setCeiling("8000000000000000000000000")).to.be.reverted;
    });

    it('Permissions allow authorized changes', async () => {
        await expect(MODLVesting.connect(CREDMARK_MANAGER).update(USER_ALICE.address, "86400", "2400")).not.to.be.reverted;
        await expect(MODLVesting.connect(CREDMARK_MANAGER).emergencyStop(USER_ALICE.address)).not.to.be.reverted;

        await expect(MODLVesting.connect(CREDMARK_DEPLOYER).setCeiling("8000000000000000000000000")).not.to.be.reverted;
    });

    it('The ceiling prevents over-allocation', async () => {
        //TODO
    });

    it('Vests Linearly with Time', async () => {
        await expect(MODLVesting.connect(CREDMARK_MANAGER).update(USER_CAMMY.address, "86400", "24000")).not.to.be.reverted;

        for(let i = 0; i<24; i++){
            expectClose((await MODLVesting.claimableAmount(USER_CAMMY.address)).toNumber(), i * 1000)
            await advanceAnHour();
        }
    });

    it('Vesting stops after expiration', async () => {
        await expect(MODLVesting.connect(CREDMARK_MANAGER).update(USER_ALICE.address, "86400", "24000")).not.to.be.reverted;

        for(let i = 0; i<30; i++){
            await advanceAnHour();
        }
        expectClose((await MODLVesting.claimableAmount(USER_ALICE.address)).toNumber(), 24000);

        await MODLVesting.connect(USER_ALICE).claim(USER_ALICE.address);
        expectClose((await MODL.balanceOf(USER_ALICE.address)).toNumber(),24000)
    });

    it('Cannot Claim the same tokens twice', async () => {
        await expect(MODLVesting.connect(CREDMARK_MANAGER).update(USER_ALICE.address, "86400", "24000")).not.to.be.reverted;

        for(let i = 0; i<30; i++){
            await advanceAnHour();
            await MODLVesting.connect(USER_ALICE).claim(USER_ALICE.address);
        }
        expectClose((await MODLVesting.claimableAmount(USER_ALICE.address)).toNumber(), 0);
        expectClose((await MODL.balanceOf(USER_ALICE.address)).toNumber(),24000)
    });

    it('it claims updated vesting', async () => {
        await expect(MODLVesting.connect(CREDMARK_MANAGER).update(USER_ALICE.address, "86400", "24000")).not.to.be.reverted;
        await expect(MODLVesting.connect(CREDMARK_MANAGER).update(USER_BRENT.address, "86400", "24000")).not.to.be.reverted;
        await expect(MODLVesting.connect(CREDMARK_MANAGER).update(USER_CAMMY.address, "86400", "24000")).not.to.be.reverted;

        await advanceAnHour();

        expectClose((await MODLVesting.claimableAmount(USER_ALICE.address)).toNumber(),1000);
        expectClose((await MODLVesting.claimableAmount(USER_BRENT.address)).toNumber(),1000);
        expectClose((await MODLVesting.claimableAmount(USER_CAMMY.address)).toNumber(),1000);

        expectClose((await MODLVesting.totalAllocated()).toNumber(),24000 * 3);

        await expect(MODLVesting.connect(USER_ALICE).claim(USER_ALICE.address)).not.to.be.reverted;
        await expect(MODLVesting.connect(USER_BRENT).claim(USER_BRENT.address)).not.to.be.reverted;

        expectClose((await MODL.totalSupply()).toNumber(),1000 * 2);
        expectClose((await MODLVesting.totalAllocated()).toNumber(),24000 * 3);

        await advanceAnHour();

        expectClose((await MODLVesting.claimableAmount(USER_ALICE.address)).toNumber(),1000);
        expectClose((await MODLVesting.claimableAmount(USER_BRENT.address)).toNumber(),1000);
        expectClose((await MODLVesting.claimableAmount(USER_CAMMY.address)).toNumber(),2000);

        expectClose((await MODL.totalSupply()).toNumber(),1000 * 2);

        await expect(MODLVesting.connect(CREDMARK_MANAGER).update(USER_ALICE.address, "1", "0")).not.to.be.reverted;
        await expect(MODLVesting.connect(CREDMARK_MANAGER).emergencyStop(USER_BRENT.address)).not.to.be.reverted;

        expectClose((await MODL.totalSupply()).toNumber(),3000);
        expectClose((await MODLVesting.totalAllocated()).toNumber(),2000 + 1000 + 24000);

        await advanceAnHour();

        expectClose((await MODLVesting.claimableAmount(USER_ALICE.address)).toNumber(),0);
        expectClose((await MODLVesting.claimableAmount(USER_BRENT.address)).toNumber(),0);
        expectClose((await MODLVesting.claimableAmount(USER_CAMMY.address)).toNumber(),3000);

        expectClose((await MODL.balanceOf(USER_ALICE.address)).toNumber(),2000)
        expectClose((await MODL.balanceOf(USER_BRENT.address)).toNumber(),1000)
        expectClose((await MODL.balanceOf(USER_CAMMY.address)).toNumber(),0)

        expectClose((await MODL.totalSupply()).toNumber(),3000);
        expectClose((await MODLVesting.totalAllocated()).toNumber(),2000 + 1000 + 24000);
    });
    
})