import { ethers, waffle } from "hardhat";
import {
  Modl,
  ModlAllowance,
  MockCmk,
  MockUsdc,
  LiquidityManager,
  ISwapRouter,
  INonfungiblePositionManager,
  RewardsIssuer,
  Time,
  ModlSubscription,
  BaseSubscription,
  ShareAccumulator,
  PriceAccumulator,
  IPriceOracle,
  ModelNftRewards,
  ModelNft,
  MockPriceOracle,
  RevenueTreasury
} from "../../typechain";
import {
  setupUsers,
  CREDMARK_DEPLOYER,
  CREDMARK_MANAGER,
  CREDMARK_TREASURY_MULTISIG,
  MOCK_GODMODE,
  CREDMARK_CONFIGURER,
  USER_ALICE,
  USER_CAMMY,
  USER_BRENT,
  USER_DAVID
} from "./users";

let MODL: Modl;
let MODLAllowance: ModlAllowance;
let CMK: MockCmk;
let USDC: MockCmk;
let liquidityManager: LiquidityManager;
let swapRouter: ISwapRouter;
let nonFungiblePositionManager: INonfungiblePositionManager;
let rewardsIssuer: RewardsIssuer;
let cmkRewardsIssuer: RewardsIssuer;
let mockUsdcPriceOracle: MockPriceOracle;
let mockModlPriceOracle: MockPriceOracle;
let mockCmkPriceOracle: MockPriceOracle;
let modelNft: ModelNft;
let modelNftRewards: ModelNftRewards;
let revenueTreasury: RevenueTreasury;

let subscriptionBasic: ModlSubscription;
let subscriptionPro: ModlSubscription;
let subscriptionStable: BaseSubscription;
let subscriptionSuperPro: ModlSubscription;
let cmkSubscription: BaseSubscription;

let lTime: Time;

let SNAPSHOT_ROLE =
  "0x5fdbd35e8da83ee755d5e62a539e5ed7f47126abede0b8b10f9ea43dc6eed07f";
let DEFAULT_ADMIN_ROLE =
  "0x0000000000000000000000000000000000000000000000000000000000000000";
let PAUSER_ROLE = ethers.utils.id('PAUSER_ROLE');
let MINTER_ROLE = ethers.utils.id('MINTER_ROLE');
let VESTING_MANAGER =
  "0x842693f29231e6ec9f0d05508dbecff8eee59d0ddd46a9f7ffa553c25f01fed0";
let ALLOWANCE_MANAGER =
  "0x1be1f65b47d345da6fb2353ebf4f33384fdb9f6a5499f96f23a79a4ace6371e6";
let CONVERSION_MANAGER =
  "0xc21f237ee74b6e0c78d326877f8934a34b1f8143acff98334cfd55b67af35992";
let CLEANER_ROLE =
  "0x5382d38cf74de6763f5ea0ee7b8e8f0703db352f6d8878c3e8d64f32527b33c9";
let ACCUMULATOR_ROLE =
  "0xfed5467d1ffffef58992591affe25fd505c7c87525d56768b890b827b47dd266";

let TRUSTED_CONTRACT_ROLE = "0xcc22fb83d486b5e47dedd221cc62cda2523064db06726dfe5385fd6ec162c3c2";
let MANAGER_ROLE = "0xaf290d8680820aad922855f39b306097b20e28774d6c1ad35a20325630c3a02c";
let CONFIGURER_ROLE = "0x527e2c92bb6983874717bce74818faf5a9be45b6e85909ee478af653c6d98755";


let NULL_ADDRESS = "0x0000000000000000000000000000000000000000";

async function deployContracts() {
  let TimeFactory = await ethers.getContractFactory("Time");
  lTime = (await TimeFactory.deploy()) as Time;

  let ModlFactory = await ethers.getContractFactory("Modl");
  let ModlSubscriptionFactory = await ethers.getContractFactory(
    "ModlSubscription",
    { libraries: { Time: lTime.address } }
  );
  let BaseSubscriptionFactory = await ethers.getContractFactory(
    "BaseSubscription",
    { libraries: { Time: lTime.address } }
  );
  let ModlAllowanceFactory = await ethers.getContractFactory("ModlAllowance", {
    libraries: { Time: lTime.address },
  });
  let LiquidityManagerFactory = await ethers.getContractFactory(
    "LiquidityManager",
    CREDMARK_DEPLOYER
  );
  let MockCmkFactory = await ethers.getContractFactory(
    "MockCmk",
    CREDMARK_DEPLOYER
  );
  let MockUsdcFactory = await ethers.getContractFactory(
    "MockUsdc",
    CREDMARK_DEPLOYER
  );
  let RewardsIssuerFactory = await ethers.getContractFactory("RewardsIssuer", {
    libraries: { Time: lTime.address },
  });
  let MockPriceOracleFactory = await ethers.getContractFactory(
    "MockPriceOracle"
  );
  let ModelNftRewardsFactory = await ethers.getContractFactory("ModelNftRewards");
  let ModelNftFactory = await ethers.getContractFactory("ModelNft");
  let RevenueTreasuryFactory = await ethers.getContractFactory("RevenueTreasury");

  CMK = (await MockCmkFactory.deploy()) as MockCmk;
  USDC = (await MockUsdcFactory.deploy()) as MockUsdc;
  MODL = (await ModlFactory.deploy()) as Modl;

  MODLAllowance = (await ModlAllowanceFactory.deploy()) as ModlAllowance;


  liquidityManager = (await LiquidityManagerFactory.deploy(
    MODL.address,
    USDC.address
  )) as LiquidityManager;


  rewardsIssuer = (await RewardsIssuerFactory.deploy(
    MODL.address,
    MODLAllowance.address
  )) as RewardsIssuer;

  cmkRewardsIssuer = (await RewardsIssuerFactory.deploy(
    MODL.address,
    MODLAllowance.address
  )) as RewardsIssuer;

  revenueTreasury = (await RevenueTreasuryFactory.deploy(100,CREDMARK_TREASURY_MULTISIG.address,MODL.address));

  modelNft = (await ModelNftFactory.deploy()) as ModelNft;
  modelNftRewards = (await ModelNftRewardsFactory.deploy(MODLAllowance.address,modelNft.address));
  mockUsdcPriceOracle = await MockPriceOracleFactory.deploy();
  mockModlPriceOracle = await MockPriceOracleFactory.deploy();
  mockCmkPriceOracle = await MockPriceOracleFactory.deploy();


  subscriptionBasic = (await ModlSubscriptionFactory.deploy({
    tokenAddress: MODL.address,
    rewardsIssuerAddress: rewardsIssuer.address
  })) as ModlSubscription;

  subscriptionPro = (await ModlSubscriptionFactory.deploy({
    tokenAddress: MODL.address,
    rewardsIssuerAddress: rewardsIssuer.address
  })) as ModlSubscription;

  subscriptionSuperPro = (await ModlSubscriptionFactory.deploy({
    tokenAddress: MODL.address,
    rewardsIssuerAddress: rewardsIssuer.address
  })) as ModlSubscription;

  subscriptionStable = (await BaseSubscriptionFactory.deploy({
    tokenAddress: USDC.address,
    rewardsIssuerAddress: rewardsIssuer.address
  })) as BaseSubscription;

  cmkSubscription = (await BaseSubscriptionFactory.deploy({
    tokenAddress: CMK.address,
    rewardsIssuerAddress: cmkRewardsIssuer.address
  })) as BaseSubscription;
}

async function setupExternalEnvironment() {
  swapRouter = (await ethers.getContractAt(
    "ISwapRouter",
    "0xE592427A0AEce92De3Edee1F18E0157C05861564"
  )) as ISwapRouter;

  nonFungiblePositionManager = (await ethers.getContractAt(
    "INonfungiblePositionManager",
    "0xC36442b4a4522E871399CD717aBDD847Ab11FE88"
  )) as INonfungiblePositionManager;
}

async function grantPermissions(){
    //CONFIGURER
    await MODL.grantRole(
        CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
    await MODLAllowance.grantRole(
        CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
    await liquidityManager.grantRole(
        CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);

    await subscriptionBasic.grantRole(
        CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
    await subscriptionPro.grantRole(
        CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
    await subscriptionSuperPro.grantRole(
        CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
    await subscriptionStable.grantRole(
        CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
    await cmkSubscription.grantRole(
        CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);

    await MODL.grantRole(MINTER_ROLE, MODLAllowance.address);
    await MODL.grantRole(MINTER_ROLE, MOCK_GODMODE.address);

    await liquidityManager.grantRole(MANAGER_ROLE, CREDMARK_MANAGER.address);

    await rewardsIssuer.grantRole(TRUSTED_CONTRACT_ROLE, subscriptionBasic.address);
    await rewardsIssuer.grantRole(TRUSTED_CONTRACT_ROLE, subscriptionPro.address);
    await rewardsIssuer.grantRole(TRUSTED_CONTRACT_ROLE, subscriptionStable.address);
    await rewardsIssuer.grantRole(TRUSTED_CONTRACT_ROLE, subscriptionSuperPro.address);
    await cmkRewardsIssuer.grantRole(TRUSTED_CONTRACT_ROLE, cmkSubscription.address);

    await CMK.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
    await CMK.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);
  
    await USDC.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
    await USDC.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);
  
    await MODL.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
    await MODL.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);

}

async function configure() {
    await MODLAllowance.connect(CREDMARK_CONFIGURER).configure({modlAddress: MODL.address, ceiling:"1000000000000000000000000"});
    // ALLOWANCES
  await MODLAllowance.connect(CREDMARK_CONFIGURER).update(
    rewardsIssuer.address,
    "250000000000000000000000"
  );
  await MODLAllowance.connect(CREDMARK_CONFIGURER).update(
    cmkRewardsIssuer.address,
    "250000000000000000000000"
  );
  await MODLAllowance.connect(CREDMARK_CONFIGURER).update(
    modelNftRewards.address,
    "250000000000000000000000"
  );
  await MODLAllowance.connect(CREDMARK_CONFIGURER).update(
    CREDMARK_TREASURY_MULTISIG.address,
    "250000000000000000000000"
  );

  await subscriptionBasic.connect(CREDMARK_CONFIGURER)
  .configure({
    lockup: "2592000",
    fee: "0",
    multiplier: "100",
    subscribable: true,
    floorPrice: "100000000",
    ceilingPrice: "999999999999999",
    treasury: revenueTreasury.address,
    oracleAddress: mockModlPriceOracle.address
  });

  await subscriptionPro.connect(CREDMARK_CONFIGURER)
  .configure({
    
    lockup: "2592000",
    fee: "500000000000000000000",
    multiplier: "200",
    subscribable: true,
    floorPrice: "100000000",
    ceilingPrice: "999999999999999",
    treasury: revenueTreasury.address,
    oracleAddress: mockModlPriceOracle.address
  });

  await subscriptionStable.connect(CREDMARK_CONFIGURER)
  .configure({
    lockup: "2592000",
    fee: "500000000000000000000",
    multiplier: "100",
    subscribable: true,
    floorPrice: "100000000",
    ceilingPrice: "100000001",
    treasury: revenueTreasury.address,
    oracleAddress: mockUsdcPriceOracle.address
  });

  await subscriptionSuperPro.connect(CREDMARK_CONFIGURER)
  .configure({
    lockup: "2592000",
    fee: "5000000000000000000000",
    multiplier: "400",
    subscribable: true,
    floorPrice: "100000000",
    ceilingPrice: "999999999999999",
    treasury: revenueTreasury.address,
    oracleAddress: mockModlPriceOracle.address
  });

  await cmkSubscription.connect(CREDMARK_CONFIGURER)
  .configure({
    lockup: "2592000",
    fee: "2500000000000000000000",
    multiplier: "100",
    subscribable: true,
    floorPrice: "100000000",
    ceilingPrice: "999999999999999",
    treasury: revenueTreasury.address,
    oracleAddress: mockModlPriceOracle.address
  });
}

async function mockTokens() {


  await CMK.connect(MOCK_GODMODE).mint(
    CREDMARK_MANAGER.address,
    "50000000000000000000000000"
  );
  await CMK.connect(MOCK_GODMODE).mint(
    CREDMARK_TREASURY_MULTISIG.address,
    "50000000000000000000000000"
  );

  await USDC.connect(MOCK_GODMODE).mint(
    CREDMARK_MANAGER.address,
    "50000000000000"
  );
}

async function printProtocol() {
    console.log(MODL.address,"MODL", )

    console.log(MODLAllowance.address, "Modl Allowance")
    console.log( rewardsIssuer.address, "Rewards Issuer",)
    console.log(cmkRewardsIssuer.address, "CMK Rewards Issuer", )
    console.log(liquidityManager.address,"liquidity Manager", )
    console.log( subscriptionBasic.address,"subscription: MODL basic")
    console.log( subscriptionPro.address,"subscription: MODL pro",)
    console.log( subscriptionSuperPro.address,"subscription: MODL super Pro",)
    console.log( subscriptionStable.address,"subscription: stable",)
    console.log( cmkSubscription.address,"subscription: CMK",)
    console.log(modelNft.address,"Model NFT", );
    console.log( modelNftRewards.address,"Model NFT rewards",);

    console.log(CREDMARK_DEPLOYER.address,"deployer", )
    console.log( CREDMARK_CONFIGURER.address,"configurer",)
    console.log( CREDMARK_MANAGER.address,"manager",)
    console.log( USER_ALICE.address,"alice",)
    console.log( USER_BRENT.address,"brent",)
    console.log( USER_CAMMY.address,"cammy",)
    console.log( USER_DAVID.address,"david",)

    console.log( USDC.address,"USDC (Mock)",)
    console.log( CMK.address,"CMK (Mock)",)
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
  grantPermissions,
  configure,
  MODL,
  CMK,
  USDC,
  MODLAllowance,
  liquidityManager,
  swapRouter,
  nonFungiblePositionManager,
  lTime,
  subscriptionBasic,
  subscriptionPro,
  subscriptionStable,
  subscriptionSuperPro,
  rewardsIssuer,
  mockCmkPriceOracle,
  mockModlPriceOracle,
  mockUsdcPriceOracle,
  modelNft,
  modelNftRewards,
  revenueTreasury,
  MINTER_ROLE,
  DEFAULT_ADMIN_ROLE,
  PAUSER_ROLE,
  SNAPSHOT_ROLE,
  NULL_ADDRESS,
  VESTING_MANAGER,
  ACCUMULATOR_ROLE,
};
