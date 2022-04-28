import { ethers, waffle } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai from 'chai';
import { MODL } from '../typechain';
import { BigNumber, ContractFactory } from 'ethers';

chai.use(waffle.solidity);

describe('MODL Token', () => {
    let modlContractFactory: ContractFactory;
    let modlContract: MODL;
    beforeEach(async () => {
        modlContractFactory = await ethers.getContractFactory('MODL');
        modlContract = (await modlContractFactory.deploy()) as MODL
    });
    it('MODL: should construct', async () => {
        chai.expect(modlContract.address).to.eq("0xefAB0Beb0A557E452b398035eA964948c750b2Fd");
    });
    it('MODL: totalSupply should initialize to 0', async () => {
        chai.expect( (await modlContract.functions.totalSupply()).toString() ).to.eq("0");
    });
})