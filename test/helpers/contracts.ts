import { ethers, waffle } from 'hardhat';
import { Modl, ModlAllowance, ModlVesting, ModlCmkConversion, MockCmk, MockUsdc, LiquidityManager } from '../../typechain';
import { BytesLike, Contract, ContractFactory } from 'ethers';
import { setupUsers, CREDMARK_DEPLOYER, CREDMARK_MANAGER, CREDMARK_TREASURY_MULTISIG } from './users';


let MODL: Modl;
let MODLVesting: ModlVesting;
let MODLAllowance: ModlAllowance;
let MODLConversion: ModlCmkConversion;
let CMK: MockCmk;
let USDC: MockCmk;
let liquidityManager: LiquidityManager;

let MINTER_ROLE: BytesLike;
let DEFAULT_ADMIN_ROLE: BytesLike;
let PAUSER_ROLE: BytesLike;
let SNAPSHOT_ROLE: BytesLike;
let VESTING_MANAGER: BytesLike;
let ALLOWANCE_MANAGER: BytesLike;
let CONVERSION_MANAGER: BytesLike;

let NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

async function  deployContracts(){
    let ModlFactory = await ethers.getContractFactory('Modl', CREDMARK_DEPLOYER);
    let ModlVestingFactory = await ethers.getContractFactory('ModlVesting', CREDMARK_DEPLOYER);
    let ModlAllowanceFactory = await ethers.getContractFactory('ModlAllowance', CREDMARK_DEPLOYER);
    let MockCmkFactory = await ethers.getContractFactory('MockCmk', CREDMARK_DEPLOYER);
    let MockUsdcFactory = await ethers.getContractFactory('MockUsdc', CREDMARK_DEPLOYER);
    let ModlCmkConversionFactory = await ethers.getContractFactory('ModlCmkConversion', CREDMARK_DEPLOYER);
    let LiquidityManagerFactory = await ethers.getContractFactory('LiquidityManager', CREDMARK_DEPLOYER);

    MODL = (await ModlFactory.deploy()) as Modl;
    MODLVesting = (await ModlVestingFactory.deploy(MODL.address)) as ModlVesting;
    MODLAllowance = (await ModlAllowanceFactory.deploy(MODL.address)) as ModlAllowance;
    CMK = (await MockCmkFactory.deploy()) as MockCmk;
    USDC = (await MockUsdcFactory.deploy()) as MockUsdc;
    MODLConversion = (await ModlCmkConversionFactory.deploy("31536000", "100", "31536000", "24", CMK.address)) as ModlCmkConversion;
    liquidityManager = (await LiquidityManagerFactory.deploy(MODL.address, USDC.address)) as LiquidityManager;
}

async function grantPermissions(): Promise<void> {
    
    await setupUsers();

    MODL.grantRole(MINTER_ROLE, MODLVesting.address);
    MODL.grantRole(MINTER_ROLE, MODLAllowance.address);
    MODL.grantRole(MINTER_ROLE, MODLConversion.address);

    MODLVesting.grantRole(VESTING_MANAGER, CREDMARK_MANAGER.address);
    MODLAllowance.grantRole(ALLOWANCE_MANAGER, CREDMARK_MANAGER.address);
    MODLConversion.grantRole(CONVERSION_MANAGER, CREDMARK_MANAGER.address);
    CMK.grantRole(MINTER_ROLE, CREDMARK_MANAGER.address);
    USDC.grantRole(MINTER_ROLE, CREDMARK_MANAGER.address);
}

async function populateVariables() {

    SNAPSHOT_ROLE = (await MODL.SNAPSHOT_ROLE()) as BytesLike;
    DEFAULT_ADMIN_ROLE = (await MODL.DEFAULT_ADMIN_ROLE()) as BytesLike;
    PAUSER_ROLE = (await MODL.PAUSER_ROLE()) as BytesLike;
    MINTER_ROLE = (await MODL.MINTER_ROLE()) as BytesLike;
    VESTING_MANAGER = (await MODLVesting.VESTING_MANAGER()) as BytesLike;
    ALLOWANCE_MANAGER = (await MODLAllowance.ALLOWANCE_MANAGER()) as BytesLike;
    CONVERSION_MANAGER = (await MODLConversion.CONVERSION_MANAGER()) as BytesLike;

}

async function configure() {
    await MODLConversion.connect(CREDMARK_MANAGER).setModl(MODL.address);

    await CMK.connect(CREDMARK_MANAGER).mint(CREDMARK_MANAGER.address, "50000000000000000000000000");
    await CMK.connect(CREDMARK_MANAGER).mint(CREDMARK_TREASURY_MULTISIG.address, "50000000000000000000000000");

    await USDC.connect(CREDMARK_MANAGER).mint(CREDMARK_MANAGER.address, "50000000000000");
}

async function setupProtocol() {

    await deployContracts();
    await populateVariables();
    await grantPermissions();
    await configure();

}

export { 
    setupProtocol, 
    deployContracts,
    populateVariables,

    MODL,
    CMK,
    USDC,
    MODLVesting,
    MODLAllowance,
    MODLConversion,
    liquidityManager,
    
    MINTER_ROLE,
    DEFAULT_ADMIN_ROLE,
    PAUSER_ROLE,
    SNAPSHOT_ROLE,
    NULL_ADDRESS,
    VESTING_MANAGER}