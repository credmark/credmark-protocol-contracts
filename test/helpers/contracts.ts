import { ethers, waffle } from 'hardhat';
import { Modl, ModlAllowance, ModlVesting, ModlCmkConversion, MockCmk, MockUsdc, LiquidityManager, ISwapRouter, INonfungiblePositionManager } from '../../typechain';
import { BytesLike, Contract, ContractFactory } from 'ethers';
import { setupUsers, CREDMARK_DEPLOYER, CREDMARK_MANAGER, CREDMARK_TREASURY_MULTISIG, USER_ALICE, USER_BRENT, USER_CAMMY, MOCK_GODMODE } from './users';


let MODL: Modl;
let MODLVesting: ModlVesting;
let MODLAllowance: ModlAllowance;
let MODLConversion: ModlCmkConversion;
let CMK: MockCmk;
let USDC: MockCmk;
let liquidityManager: LiquidityManager;
let swapRouter: ISwapRouter;
let nonFungiblePositionManager: INonfungiblePositionManager;

let MINTER_ROLE: BytesLike;
let DEFAULT_ADMIN_ROLE: BytesLike;
let PAUSER_ROLE: BytesLike;
let SNAPSHOT_ROLE: BytesLike;
let CLEANER_ROLE:BytesLike;
let VESTING_MANAGER: BytesLike;
let ALLOWANCE_MANAGER: BytesLike;
let CONVERSION_MANAGER: BytesLike;

let NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

async function  deployContracts(){
    let ModlFactory = await ethers.getContractFactory('Modl', CREDMARK_DEPLOYER);
    let ModlVestingFactory = await ethers.getContractFactory('ModlVesting', CREDMARK_DEPLOYER);
    let ModlAllowanceFactory = await ethers.getContractFactory('ModlAllowance', CREDMARK_DEPLOYER);
    let ModlCmkConversionFactory = await ethers.getContractFactory('ModlCmkConversion', CREDMARK_DEPLOYER);
    let LiquidityManagerFactory = await ethers.getContractFactory('LiquidityManager', CREDMARK_DEPLOYER);
    let MockCmkFactory = await ethers.getContractFactory('MockCmk', CREDMARK_DEPLOYER);
    let MockUsdcFactory = await ethers.getContractFactory('MockUsdc', CREDMARK_DEPLOYER);

    CMK = (await MockCmkFactory.deploy()) as MockCmk;
    USDC = (await MockUsdcFactory.deploy()) as MockUsdc;
    MODL = (await ModlFactory.deploy()) as Modl;
    MODLVesting = (await ModlVestingFactory.deploy(MODL.address)) as ModlVesting;
    MODLAllowance = (await ModlAllowanceFactory.deploy(MODL.address)) as ModlAllowance;
    MODLConversion = (await ModlCmkConversionFactory.deploy("31536000", "100", "31536000", "24", CMK.address)) as ModlCmkConversion;
    liquidityManager = (await LiquidityManagerFactory.deploy(MODL.address, USDC.address)) as LiquidityManager;

}

async function setupExternalEnvironment(){

    swapRouter = (await ethers.getContractAt(
        "ISwapRouter",
        "0xE592427A0AEce92De3Edee1F18E0157C05861564"
      )) as ISwapRouter;

    nonFungiblePositionManager = (await ethers.getContractAt(
        "INonfungiblePositionManager",
        "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
      )) as INonfungiblePositionManager;




}

async function grantPermissions(): Promise<void> {

    MODL.grantRole(MINTER_ROLE, MODLVesting.address);
    MODL.grantRole(MINTER_ROLE, MODLAllowance.address);
    MODL.grantRole(MINTER_ROLE, MODLConversion.address);
    MODL.grantRole(MINTER_ROLE, CREDMARK_DEPLOYER.address);

    MODLVesting.grantRole(VESTING_MANAGER, CREDMARK_MANAGER.address);
    MODLAllowance.grantRole(ALLOWANCE_MANAGER, CREDMARK_MANAGER.address);
    MODLConversion.grantRole(CONVERSION_MANAGER, CREDMARK_MANAGER.address);
    liquidityManager.grantRole(CLEANER_ROLE, CREDMARK_MANAGER.address);
}

async function populateVariables() {

    SNAPSHOT_ROLE = (await MODL.SNAPSHOT_ROLE()) as BytesLike;
    DEFAULT_ADMIN_ROLE = (await MODL.DEFAULT_ADMIN_ROLE()) as BytesLike;
    PAUSER_ROLE = (await MODL.PAUSER_ROLE()) as BytesLike;
    MINTER_ROLE = (await MODL.MINTER_ROLE()) as BytesLike;
    VESTING_MANAGER = (await MODLVesting.VESTING_MANAGER()) as BytesLike;
    ALLOWANCE_MANAGER = (await MODLAllowance.ALLOWANCE_MANAGER()) as BytesLike;
    CONVERSION_MANAGER = (await MODLConversion.CONVERSION_MANAGER()) as BytesLike;
    CLEANER_ROLE = (await liquidityManager.CLEANER_ROLE()) as BytesLike;
    
}

async function configure() {
    await MODLConversion.connect(CREDMARK_MANAGER).setModl(MODL.address);

}

async function mockTokens() {
    CMK.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
    CMK.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);

    USDC.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
    USDC.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);

    await CMK.connect(MOCK_GODMODE).mint(CREDMARK_MANAGER.address, "50000000000000000000000000");
    await CMK.connect(MOCK_GODMODE).mint(CREDMARK_TREASURY_MULTISIG.address, "50000000000000000000000000");

    await USDC.connect(MOCK_GODMODE).mint(CREDMARK_MANAGER.address, "50000000000000");
}

async function setupProtocol() {

    await setupUsers();
    await setupExternalEnvironment();
    await deployContracts();
    await populateVariables();
    await grantPermissions();
    await configure();
    await mockTokens();

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
    swapRouter,
    nonFungiblePositionManager,
    
    MINTER_ROLE,
    DEFAULT_ADMIN_ROLE,
    PAUSER_ROLE,
    SNAPSHOT_ROLE,
    NULL_ADDRESS,
    VESTING_MANAGER}