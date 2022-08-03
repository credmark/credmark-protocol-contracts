import { ethers, waffle } from 'hardhat';
import * as chai from 'chai';
chai.use(waffle.solidity);

let expect = chai.expect;

import { setupProtocol, MODLAllowance, NULL_ADDRESS, VESTING_MANAGER, MODL } from './helpers/contracts';
import { setupUsers, CREDMARK_MANAGER, HACKER_ZACH,CREDMARK_DEPLOYER, CREDMARK_TREASURY_MULTISIG, CREDMARK_MEMBER_TREASURY, CREDMARK_MODELER_TREASURY } from './helpers/users';
import { advanceAnHour, advanceADay, advanceAMonth, advanceAYear} from './helpers/time';
import { ModlVesting } from '../typechain';

function expectClose(value: number, expectedValue: number) {
    expect(value).to.greaterThanOrEqual(expectedValue * 0.98);
    expect(value).to.lessThanOrEqual(expectedValue * 1.02);
}

describe('ModlAllowance.sol', () => {

    beforeEach(async () => {
        await setupProtocol();
        await setupUsers();
    });

    it('Permissions prevent unauthorized changes', async () => {
        await expect(MODLAllowance.connect(HACKER_ZACH).update(HACKER_ZACH.address, "1000")).to.be.reverted;
        await expect(MODLAllowance.connect(HACKER_ZACH).setCeiling("8000000000000000000000000")).to.be.reverted;
        await expect(MODLAllowance.connect(HACKER_ZACH).emergencyStop(HACKER_ZACH.address)).to.be.reverted;

        await expect(MODLAllowance.connect(CREDMARK_MANAGER).setCeiling("8000000000000000000000000")).to.be.reverted;
    });

    it('Permissions allow authorized changes', async () => {
        await expect(MODLAllowance.connect(CREDMARK_MANAGER).update(CREDMARK_TREASURY_MULTISIG.address, "1000")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_MANAGER).update(CREDMARK_TREASURY_MULTISIG.address, "10000")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_MANAGER).emergencyStop(CREDMARK_TREASURY_MULTISIG.address)).not.to.be.reverted;

        await expect(MODLAllowance.connect(CREDMARK_DEPLOYER).setCeiling("8000000000000000000000000")).not.to.be.reverted;
    });

    it('Emits Linearly with Time', async () => {
        await expect(MODLAllowance.connect(CREDMARK_MANAGER).update(CREDMARK_TREASURY_MULTISIG.address, "12000")).not.to.be.reverted;

        for(let i = 0; i<24; i++){
            expectClose((await MODLAllowance.claimableAmount(CREDMARK_TREASURY_MULTISIG.address)).toNumber(), i * 1000)
            await advanceAMonth();
        }
    });
    
    it('The ceiling prevents over-allocation', async () => {
        //TODO
    });

    it('Cannot Claim the same tokens twice', async () => {
        await expect(MODLAllowance.connect(CREDMARK_MANAGER).update(CREDMARK_TREASURY_MULTISIG.address, "12000")).not.to.be.reverted;

        for(let i = 0; i<30; i++){
            await advanceAMonth();
            await MODLAllowance.connect(CREDMARK_TREASURY_MULTISIG).claim(CREDMARK_TREASURY_MULTISIG.address);
        }
        expectClose((await MODLAllowance.claimableAmount(CREDMARK_TREASURY_MULTISIG.address)).toNumber(), 0);
        expectClose((await MODL.balanceOf(CREDMARK_TREASURY_MULTISIG.address)).toNumber(),30000)
    });

    it('it claims updated allowance', async () => {
        await expect(MODLAllowance.connect(CREDMARK_MANAGER).update(CREDMARK_TREASURY_MULTISIG.address, "12000")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_MANAGER).update(CREDMARK_MEMBER_TREASURY.address, "12000")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_MANAGER).update(CREDMARK_MODELER_TREASURY.address, "12000")).not.to.be.reverted;

        await advanceAMonth();

        expectClose((await MODLAllowance.claimableAmount(CREDMARK_TREASURY_MULTISIG.address)).toNumber(),1000);
        expectClose((await MODLAllowance.claimableAmount(CREDMARK_MEMBER_TREASURY.address)).toNumber(),1000);
        expectClose((await MODLAllowance.claimableAmount(CREDMARK_MODELER_TREASURY.address)).toNumber(),1000);

        expectClose((await MODLAllowance.totalAllowancePerAnnum()).toNumber(),12000 * 3);

        await expect(MODLAllowance.connect(CREDMARK_TREASURY_MULTISIG).claim(CREDMARK_TREASURY_MULTISIG.address)).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_MEMBER_TREASURY).claim(CREDMARK_MEMBER_TREASURY.address)).not.to.be.reverted;

        expectClose((await MODL.totalSupply()).toNumber(),1000 * 2);
        expectClose((await MODLAllowance.totalAllowancePerAnnum()).toNumber(),12000 * 3);

        await advanceAMonth();

        expectClose((await MODLAllowance.claimableAmount(CREDMARK_TREASURY_MULTISIG.address)).toNumber(),1000);
        expectClose((await MODLAllowance.claimableAmount(CREDMARK_MEMBER_TREASURY.address)).toNumber(),1000);
        expectClose((await MODLAllowance.claimableAmount(CREDMARK_MODELER_TREASURY.address)).toNumber(),2000);

        expectClose((await MODL.totalSupply()).toNumber(), 1000 * 2);

        await expect(MODLAllowance.connect(CREDMARK_MANAGER).update(CREDMARK_TREASURY_MULTISIG.address, "0")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_MANAGER).emergencyStop(CREDMARK_MEMBER_TREASURY.address)).not.to.be.reverted;

        expectClose((await MODL.totalSupply()).toNumber(),3000);
        expectClose((await MODLAllowance.totalAllowancePerAnnum()).toNumber(),12000);

        await advanceAMonth();

        expectClose((await MODLAllowance.claimableAmount(CREDMARK_TREASURY_MULTISIG.address)).toNumber(),0);
        expectClose((await MODLAllowance.claimableAmount(CREDMARK_MEMBER_TREASURY.address)).toNumber(),0);
        expectClose((await MODLAllowance.claimableAmount(CREDMARK_MODELER_TREASURY.address)).toNumber(),3000);

        expectClose((await MODL.balanceOf(CREDMARK_TREASURY_MULTISIG.address)).toNumber(),2000)
        expectClose((await MODL.balanceOf(CREDMARK_MEMBER_TREASURY.address)).toNumber(),1000)
        expectClose((await MODL.balanceOf(CREDMARK_MODELER_TREASURY.address)).toNumber(),0)

        expectClose((await MODL.totalSupply()).toNumber(),3000);
    });
    
})