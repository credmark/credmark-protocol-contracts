import { ethers, waffle } from 'hardhat';
import * as chai from 'chai';
chai.use(waffle.solidity);

let expect = chai.expect;

import { setupProtocol, MODLConversion, MODL, DEFAULT_ADMIN_ROLE } from './helpers/contracts';
import { setupUsers, CREDMARK_MANAGER, HACKER_ZACH, USER_ALICE, USER_BRENT, USER_CAMMY, USER_DAVID } from './helpers/users';
import { advanceAnHour, advanceADay, advanceAMonth, advanceAYear} from './helpers/time';
import { ModlVesting } from '../typechain';

function expectClose(value: number, expectedValue: number) {
    expect(value).to.greaterThanOrEqual(expectedValue * 0.98);
    expect(value).to.lessThanOrEqual(expectedValue * 1.02);
}

describe('ModlCmkConversion.sol', () => {

    beforeEach(async () => {
        await setupProtocol();
        await setupUsers();
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
        await expect(MODLConversion.connect(CREDMARK_MANAGER).setModl(MODL.address)).not.to.be.reverted;
        await expect(MODLConversion.connect(CREDMARK_MANAGER).startConversions()).not.to.be.reverted;
        await expect(MODLConversion.connect(CREDMARK_MANAGER).startDeposits()).not.to.be.reverted;
    });
    
})