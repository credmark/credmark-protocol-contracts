import { ethers, waffle } from 'hardhat';
import { expect, use } from "chai";

use(waffle.solidity);

import { setupProtocol, MODL, poolBasic, poolPro } from './helpers/contracts';
import { HACKER_ZACH, MOCK_GODMODE, setupUsers, USER_ALICE, USER_BRENT, USER_CAMMY, USER_DAVID } from './helpers/users';
import { advanceAMonth } from './helpers/time';

describe('Pool.sol', () => {
    
    before(async () => {
        await setupProtocol();
        await setupUsers();
    });
    
    beforeEach(async () => {
        await setupProtocol();
        await setupUsers();
        await MODL.connect(MOCK_GODMODE).mint(USER_ALICE.address, "10000000000000000000000");
        await MODL.connect(USER_ALICE).approve(poolBasic.address, "10000000000000000000000");
        await MODL.connect(USER_ALICE).approve(poolPro.address,   "10000000000000000000000");
        await MODL.connect(MOCK_GODMODE).mint(USER_BRENT.address, "10000000000000000000000");
        await MODL.connect(USER_BRENT).approve(poolBasic.address, "10000000000000000000000");
        await MODL.connect(MOCK_GODMODE).mint(USER_CAMMY.address, "10000000000000000000000");
        await MODL.connect(USER_CAMMY).approve(poolBasic.address, "10000000000000000000000");
        await MODL.connect(MOCK_GODMODE).mint(USER_DAVID.address, "10000000000000000000000");
        await MODL.connect(USER_DAVID).approve(poolBasic.address, "10000000000000000000000");
    });

    it('POOL: Can Deposit', async () => {
        await expect((poolBasic.connect(USER_ALICE).deposit("100000000000000000000"))).not.reverted;
        await expect((poolBasic.connect(HACKER_ZACH).deposit("100000000000000000000"))).reverted;
    });

    it('POOL: Deposit Math Works', async () => {
        await poolBasic.connect(USER_ALICE).deposit("100000000000000000000");

        expect((await poolBasic.getDeposit(USER_ALICE.address)).toString()).to.eq("100000000000000000000");
        expect((await poolBasic.getDeposit(USER_BRENT.address)).toString()).to.eq("0");
        expect((await poolBasic.getDeposit(USER_CAMMY.address)).toString()).to.eq("0");

        await poolBasic.connect(USER_BRENT).deposit("50000000000000000000");

        expect((await poolBasic.getDeposit(USER_ALICE.address)).toString()).to.eq("100000000000000000000");
        expect((await poolBasic.getDeposit(USER_BRENT.address)).toString()).to.eq("50000000000000000000");
        expect((await poolBasic.getDeposit(USER_CAMMY.address)).toString()).to.eq("0");

        await poolBasic.connect(USER_BRENT).deposit("50000000000000000000");

        expect((await poolBasic.getDeposit(USER_ALICE.address)).toString()).to.eq("100000000000000000000");
        expect((await poolBasic.getDeposit(USER_BRENT.address)).toString()).to.eq("100000000000000000000");
        expect((await poolBasic.getDeposit(USER_CAMMY.address)).toString()).to.eq("0");
    });

    it('POOL: Can Exit', async () => {
        await expect((poolBasic.connect(USER_ALICE).deposit("100000000000000000000"))).not.reverted;
        expect((await MODL.balanceOf(USER_ALICE.address)).toString()).to.eq("9900000000000000000000");
        await expect((poolBasic.connect(USER_ALICE).exit())).not.reverted;
        expect((await MODL.balanceOf(USER_ALICE.address)).toString()).to.eq("10000000000000000000000");
        await expect((poolBasic.connect(HACKER_ZACH).exit())).reverted;
    });

    it('POOL: Fee Math Works', async () => {
        await expect((poolPro.connect(USER_ALICE).deposit("100000000000000000000"))).not.reverted;
        expect((await MODL.balanceOf(USER_ALICE.address)).toString()).to.eq("9900000000000000000000");

        console.log(await poolPro.getFee(USER_ALICE.address))
        await advanceAMonth();
        console.log(await poolPro.getFee(USER_ALICE.address))

        await expect((poolPro.connect(USER_ALICE).exit())).not.reverted;

        console.log((await MODL.balanceOf(USER_ALICE.address)).toString() )


    });
})