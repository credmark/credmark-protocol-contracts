import { ethers, waffle } from 'hardhat';
import { Modl, ModlAllowance, ModlVesting, ModlCmkConversion, MockCmk, MockUsdc, LiquidityManager, ISwapRouter, INonfungiblePositionManager, Time, Pool, ShareAccumulator, PriceAccumulator } from '../../typechain';
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

let poolBasic: Pool;
let poolPro: Pool;
let poolStable: Pool;
let poolSuperPro: Pool;

let rewardsAccumulator: ShareAccumulator;
let priceAccumulator: PriceAccumulator;

let lTime: Time;

let SNAPSHOT_ROLE = "0x5fdbd35e8da83ee755d5e62a539e5ed7f47126abede0b8b10f9ea43dc6eed07f";
let DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
let PAUSER_ROLE = "0x65d7a28e3265b37a6474929f336521b332c1681b933f6cb9f3376673440d862a";
let MINTER_ROLE ="0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6";
let VESTING_MANAGER = "0x842693f29231e6ec9f0d05508dbecff8eee59d0ddd46a9f7ffa553c25f01fed0";
let ALLOWANCE_MANAGER = "0x1be1f65b47d345da6fb2353ebf4f33384fdb9f6a5499f96f23a79a4ace6371e6";
let CONVERSION_MANAGER = "0xc21f237ee74b6e0c78d326877f8934a34b1f8143acff98334cfd55b67af35992";
let CLEANER_ROLE = "0x5382d38cf74de6763f5ea0ee7b8e8f0703db352f6d8878c3e8d64f32527b33c9";
let ACCUMULATOR_ROLE = "0xfed5467d1ffffef58992591affe25fd505c7c87525d56768b890b827b47dd266";
let NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

async function  deployContracts(){

    let TimeFactory = await ethers.getContractFactory('Time');
    lTime = await TimeFactory.deploy() as Time;
    
    let ModlFactory = await ethers.getContractFactory('Modl');
    let PoolFactory = await ethers.getContractFactory('Pool', {libraries: {Time: lTime.address,}});
    let ModlVestingFactory = await ethers.getContractFactory('ModlVesting', {libraries: {Time: lTime.address,}});
    let ModlAllowanceFactory = await ethers.getContractFactory('ModlAllowance', {libraries: {Time: lTime.address,}});
    let ModlCmkConversionFactory = await ethers.getContractFactory('ModlCmkConversion', {libraries: {Time: lTime.address,}});
    let LiquidityManagerFactory = await ethers.getContractFactory('LiquidityManager', CREDMARK_DEPLOYER);
    let MockCmkFactory = await ethers.getContractFactory('MockCmk', CREDMARK_DEPLOYER);
    let MockUsdcFactory = await ethers.getContractFactory('MockUsdc', CREDMARK_DEPLOYER);
    let ShareAccumulatorFactory = await ethers.getContractFactory('ShareAccumulator', {libraries: {Time: lTime.address,}});
    let PriceAccumulatorFactory = await ethers.getContractFactory('PriceAccumulator', {libraries: {Time: lTime.address,}});

    CMK = (await MockCmkFactory.deploy()) as MockCmk;
    USDC = (await MockUsdcFactory.deploy()) as MockUsdc;
    MODL = (await ModlFactory.deploy()) as Modl;
    MODLVesting = (await ModlVestingFactory.deploy(MODL.address)) as ModlVesting;
    MODLAllowance = (await ModlAllowanceFactory.deploy(MODL.address)) as ModlAllowance;
    MODLConversion = (await ModlCmkConversionFactory.deploy("31536000", "100", "31536000", "24", CMK.address)) as ModlCmkConversion;
    liquidityManager = (await LiquidityManagerFactory.deploy(MODL.address, USDC.address)) as LiquidityManager;
    rewardsAccumulator = (await ShareAccumulatorFactory.deploy()) as ShareAccumulator;
    priceAccumulator = (await PriceAccumulatorFactory.deploy()) as PriceAccumulator;

    poolBasic = (await PoolFactory.deploy("100", "0", "0", true, MODL.address, rewardsAccumulator.address, priceAccumulator.address)) as Pool;
    poolPro = (await PoolFactory.deploy("200", "2592000", "500000000000000000000", true, MODL.address, rewardsAccumulator.address, priceAccumulator.address)) as Pool;
    poolStable = (await PoolFactory.deploy("100", "7776000", "750000000000000000000", true, USDC.address, rewardsAccumulator.address, priceAccumulator.address)) as Pool;
    poolSuperPro = (await PoolFactory.deploy("400", "7776000", "1250000000000000000000", true, MODL.address, rewardsAccumulator.address, priceAccumulator.address)) as Pool;
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

    priceAccumulator.grantRole(ACCUMULATOR_ROLE, poolBasic.address);
    rewardsAccumulator.grantRole(ACCUMULATOR_ROLE, poolBasic.address);

    priceAccumulator.grantRole(ACCUMULATOR_ROLE, poolPro.address);
    rewardsAccumulator.grantRole(ACCUMULATOR_ROLE, poolPro.address);

    priceAccumulator.grantRole(ACCUMULATOR_ROLE, poolStable.address);
    rewardsAccumulator.grantRole(ACCUMULATOR_ROLE, poolStable.address);

    priceAccumulator.grantRole(ACCUMULATOR_ROLE, poolSuperPro.address);
    rewardsAccumulator.grantRole(ACCUMULATOR_ROLE, poolSuperPro.address);

}

async function configure() {
    await MODLConversion.connect(CREDMARK_MANAGER).setModl(MODL.address);
}

async function mockTokens() {
    CMK.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
    CMK.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);

    USDC.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
    USDC.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);

    MODL.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
    MODL.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);

    await CMK.connect(MOCK_GODMODE).mint(CREDMARK_MANAGER.address, "50000000000000000000000000");
    await CMK.connect(MOCK_GODMODE).mint(CREDMARK_TREASURY_MULTISIG.address, "50000000000000000000000000");

    await USDC.connect(MOCK_GODMODE).mint(CREDMARK_MANAGER.address, "50000000000000");
}

async function setupProtocol() {

    await setupUsers();
    await setupExternalEnvironment();
    await deployContracts();
    await grantPermissions();
    await configure();
    await mockTokens();

}

export { 
    setupProtocol, 
    deployContracts,

    MODL,
    CMK,
    USDC,
    MODLVesting,
    MODLAllowance,
    MODLConversion,
    liquidityManager,
    swapRouter,
    nonFungiblePositionManager,
    lTime,
    rewardsAccumulator,
    priceAccumulator,
    poolBasic,
    poolPro,
    poolStable,
    poolSuperPro,
    
    MINTER_ROLE,
    DEFAULT_ADMIN_ROLE,
    PAUSER_ROLE,
    SNAPSHOT_ROLE,
    NULL_ADDRESS,
    VESTING_MANAGER,
    ACCUMULATOR_ROLE}