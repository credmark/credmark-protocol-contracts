import { ethers, waffle } from 'hardhat';
import * as chai from 'chai';
chai.use(waffle.solidity);

let expect = chai.expect;

import { setupProtocol, MODLAllowance, NULL_ADDRESS, VESTING_MANAGER, MODL, deployContracts, grantPermissions } from './helpers/contracts';
import { setupUsers, CREDMARK_MANAGER, HACKER_ZACH,CREDMARK_DEPLOYER, CREDMARK_TREASURY_MULTISIG, CREDMARK_MEMBER_TREASURY, CREDMARK_MODELER_TREASURY, CREDMARK_CONFIGURER, USER_ALICE, USER_BRENT, USER_CAMMY } from './helpers/users';
import { advanceAnHour, advanceADay, advanceAMonth, advanceAYear} from './helpers/time';


function expectClose(value: number, expectedValue: number) {
    expect(value).to.greaterThanOrEqual(expectedValue * 0.98);
    expect(value).to.lessThanOrEqual(expectedValue * 1.02);
}

describe('ModlAllowance.sol', () => {

    beforeEach(async () => {
        await setupUsers();
        await deployContracts();
        await grantPermissions();

    });

    it('Permissions prevent unauthorized calls', async () => {
        await expect(MODLAllowance.connect(HACKER_ZACH).configure({modlAddress:MODL.address, ceiling: "1000000000000000000000000"})).to.be.reverted;
        await expect(MODLAllowance.connect(HACKER_ZACH).update(HACKER_ZACH.address, "1000")).to.be.reverted;
        await expect(MODLAllowance.connect(HACKER_ZACH).emergencyStop(HACKER_ZACH.address)).to.be.reverted;
    });

    it('Permissions allow authorized calls', async () => {
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).configure({modlAddress:MODL.address, ceiling: "1000000000000000000000000"})).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(CREDMARK_TREASURY_MULTISIG.address, "1000")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(CREDMARK_TREASURY_MULTISIG.address, "10000")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).emergencyStop(CREDMARK_TREASURY_MULTISIG.address)).not.to.be.reverted;

    });

    it('Emits Linearly with Time', async () => {
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).configure({modlAddress:MODL.address, ceiling: "1000000000000000000000000"})).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(CREDMARK_TREASURY_MULTISIG.address, "12000")).not.to.be.reverted;

        for(let i = 0; i<24; i++){
            expectClose((await MODLAllowance.claimableAmount(CREDMARK_TREASURY_MULTISIG.address)).toNumber(), i * 1000)
            await advanceAMonth();
        }
    });
    
    it('The ceiling prevents over-allocation', async () => {
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).configure({modlAddress:MODL.address, ceiling: "1000000000000000000000000"})).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(USER_ALICE.address, "1000000000000000000000000")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(USER_BRENT.address, "1")).reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).configure({modlAddress:MODL.address, ceiling: "1000000000000000000000001"})).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(USER_BRENT.address, "1")).not.reverted;
    });

    it('Cannot Claim the same tokens twice', async () => {
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).configure({modlAddress:MODL.address, ceiling: "1000000000000000000000000"})).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(USER_ALICE.address, "12000")).not.to.be.reverted;

        for(let i = 0; i<30; i++){
            await advanceAMonth();
            await MODLAllowance.connect(USER_ALICE).claim(USER_ALICE.address);
        }
        expectClose((await MODLAllowance.claimableAmount(USER_ALICE.address)).toNumber(), 0);
        expectClose((await MODL.balanceOf(USER_ALICE.address)).toNumber(),30000)
    });

    it('it claims updated allowance', async () => {        
        
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).configure({modlAddress:MODL.address, ceiling: "1000000000000000000000000"})).not.to.be.reverted;

        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(USER_ALICE.address, "12000")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(USER_BRENT.address, "12000")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(USER_CAMMY.address, "12000")).not.to.be.reverted;

        await advanceAMonth();

        expectClose((await MODLAllowance.claimableAmount(USER_ALICE.address)).toNumber(),1000);
        expectClose((await MODLAllowance.claimableAmount(USER_BRENT.address)).toNumber(),1000);
        expectClose((await MODLAllowance.claimableAmount(USER_CAMMY.address)).toNumber(),1000);

        expectClose((await MODLAllowance.totalAllowancePerAnnum()).toNumber(),12000 * 3);

        await expect(MODLAllowance.connect(USER_ALICE).claim(USER_ALICE.address)).not.to.be.reverted;
        await expect(MODLAllowance.connect(USER_BRENT).claim(USER_BRENT.address)).not.to.be.reverted;

        expectClose((await MODL.totalSupply()).toNumber(),1000 * 2);
        expectClose((await MODLAllowance.totalAllowancePerAnnum()).toNumber(),12000 * 3);

        await advanceAMonth();

        expectClose((await MODLAllowance.claimableAmount(USER_ALICE.address)).toNumber(),1000);
        expectClose((await MODLAllowance.claimableAmount(USER_BRENT.address)).toNumber(),1000);
        expectClose((await MODLAllowance.claimableAmount(USER_CAMMY.address)).toNumber(),2000);

        expectClose((await MODL.totalSupply()).toNumber(), 1000 * 2);

        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).update(USER_ALICE.address, "0")).not.to.be.reverted;
        await expect(MODLAllowance.connect(CREDMARK_CONFIGURER).emergencyStop(USER_BRENT.address)).not.to.be.reverted;

        expectClose((await MODL.totalSupply()).toNumber(),3000);
        expectClose((await MODLAllowance.totalAllowancePerAnnum()).toNumber(),12000);

        await advanceAMonth();

        expectClose((await MODLAllowance.claimableAmount(USER_ALICE.address)).toNumber(),0);
        expectClose((await MODLAllowance.claimableAmount(USER_BRENT.address)).toNumber(),0);
        expectClose((await MODLAllowance.claimableAmount(USER_CAMMY.address)).toNumber(),3000);

        expectClose((await MODL.balanceOf(USER_ALICE.address)).toNumber(),2000)
        expectClose((await MODL.balanceOf(USER_BRENT.address)).toNumber(),1000)
        expectClose((await MODL.balanceOf(USER_CAMMY.address)).toNumber(),0)

        expectClose((await MODL.totalSupply()).toNumber(),3000);
    });
    
})