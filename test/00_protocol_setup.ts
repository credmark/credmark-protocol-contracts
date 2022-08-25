import { ethers, waffle } from 'hardhat';
import { expect, use } from "chai";

use(waffle.solidity);

import { setupProtocol, MODL, MODLVesting, MODLAllowance, MODLConversion, deployContracts, MINTER_ROLE } from './helpers/contracts';
import { setupUsers } from './helpers/users';

describe('Protocol Setup - Deployment', () => {
    
    before(async () => {
        await deployContracts();
    });

    it('Modl is Deployed', async () => {
        expect(MODL.address).to.not.be.false;
    });

    it('Vesting Modl is Deployed', async () => {
        expect(MODLVesting.address).to.not.be.false;
    });

    it('Modl Converter is Deployed', async () => {
        expect(MODLConversion.address).to.not.be.false;
    });

    it('Modl Allowance is Deployed', async () => {
        expect(MODLAllowance.address).to.not.be.false;
    });
})

describe('Protocol Setup - Pre Initialization', () => {
    before(async () => {
        await deployContracts();
    });

    it("Modl Vesting is not a minter of Modl", async () => {
        expect(await MODL.hasRole(MINTER_ROLE, MODLVesting.address)).to.be.false;
    })

    it("Modl Allowance is not a minter of Modl", async () => {
        expect(await MODL.hasRole(MINTER_ROLE, MODLAllowance.address)).to.be.false;
    })

    it("Modl Conversion is not a minter of Modl", async () => {
        expect(await MODL.hasRole(MINTER_ROLE, MODLConversion.address)).to.be.false;
    })
})

describe('Protocol Setup - Post Setup', () => {
    before(async () => {
        await setupProtocol();
    });

    it("Modl Vesting is a minter of Modl", async () => {
        expect(await MODL.hasRole(MINTER_ROLE, MODLVesting.address)).to.be.true;
    })

    it("Modl Allowance is a minter of Modl", async () => {
        expect(await MODL.hasRole(MINTER_ROLE, MODLAllowance.address)).to.be.true;
    })

    it("Modl Conversion is a minter of Modl", async () => {
        expect(await MODL.hasRole(MINTER_ROLE, MODLConversion.address)).to.be.true;
    })

})