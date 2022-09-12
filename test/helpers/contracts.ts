import { ethers } from 'hardhat';
import {
  Modl,
  ModlAllowance,
  MockCmk,
  MockUsdc,
  LiquidityManager,
  ISwapRouter,
  INonfungiblePositionManager,
  SubscriptionRewardsIssuer,
  Time,
  ModlSubscription,
  GenericSubscription,
  ModelNftRewards,
  ModelNft,
  ManagedPriceOracle,
  RevenueTreasury,
} from '../../typechain';

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
  USER_DAVID,
} from './users';

import {
  CONFIGURER_ROLE,
  MANAGER_ROLE,
  TRUSTED_CONTRACT_ROLE,
  MINTER_ROLE,
  PAUSER_ROLE,
  DEFAULT_ADMIN_ROLE,
} from './roles';

let MODL: Modl;
let MODLAllowance: ModlAllowance;
let CMK: MockCmk;
let USDC: MockCmk;
let liquidityManager: LiquidityManager;
let swapRouter: ISwapRouter;
let nonFungiblePositionManager: INonfungiblePositionManager;
let rewardsIssuer: SubscriptionRewardsIssuer;
let cmkSubscriptionRewardsIssuer: SubscriptionRewardsIssuer;
let mockUsdcPriceOracle: ManagedPriceOracle;
let mockModlPriceOracle: ManagedPriceOracle;
let mockCmkPriceOracle: ManagedPriceOracle;
let modelNft: ModelNft;
let modelNftRewards: ModelNftRewards;
let revenueTreasury: RevenueTreasury;

let subscriptionBasic: ModlSubscription;
let subscriptionPro: ModlSubscription;
let subscriptionStable: GenericSubscription;
let subscriptionSuperPro: ModlSubscription;
let cmkSubscription: GenericSubscription;

let lTime: Time;

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

async function deployContracts() {
  const TimeFactory = await ethers.getContractFactory('Time');
  lTime = (await TimeFactory.deploy()) as Time;

  const ModlFactory = await ethers.getContractFactory('Modl');
  const ModlSubscriptionFactory = await ethers.getContractFactory(
    'ModlSubscription',
    { libraries: { Time: lTime.address } }
  );
  const GenericSubscriptionFactory = await ethers.getContractFactory(
    'GenericSubscription',
    { libraries: { Time: lTime.address } }
  );
  const ModlAllowanceFactory = await ethers.getContractFactory(
    'ModlAllowance',
    {
      libraries: { Time: lTime.address },
    }
  );
  const LiquidityManagerFactory = await ethers.getContractFactory(
    'LiquidityManager'
  );
  const MockCmkFactory = await ethers.getContractFactory(
    'MockCmk',
    CREDMARK_DEPLOYER
  );
  const MockUsdcFactory = await ethers.getContractFactory(
    'MockUsdc',
    CREDMARK_DEPLOYER
  );
  const SubscriptionRewardsIssuerFactory = await ethers.getContractFactory(
    'SubscriptionRewardsIssuer',
    {
      libraries: { Time: lTime.address },
    }
  );
  const ManagedPriceOracleFactory = await ethers.getContractFactory(
    'ManagedPriceOracle'
  );
  const ModelNftRewardsFactory = await ethers.getContractFactory(
    'ModelNftRewards'
  );
  const ModelNftFactory = await ethers.getContractFactory('ModelNft');
  const RevenueTreasuryFactory = await ethers.getContractFactory(
    'RevenueTreasury'
  );

  CMK = (await MockCmkFactory.deploy()) as MockCmk;
  USDC = (await MockUsdcFactory.deploy()) as MockUsdc;
  MODL = (await ModlFactory.deploy()) as Modl;

  MODLAllowance = (await ModlAllowanceFactory.deploy({
    modlAddress: MODL.address,
  })) as ModlAllowance;
  revenueTreasury = await RevenueTreasuryFactory.deploy({
    modlAddress: MODL.address,
  });

  liquidityManager = (await LiquidityManagerFactory.deploy({
    modlAddress: MODL.address,
    usdcAddress: USDC.address,
    launchLiquidity: '7500000000000000000000000',
    lockup: (2 * 365 * 86400).toString(),
    revenueTreasury: revenueTreasury.address,
  })) as LiquidityManager;

  rewardsIssuer = (await SubscriptionRewardsIssuerFactory.deploy({
    modlAddress: MODL.address,
  })) as SubscriptionRewardsIssuer;

  cmkSubscriptionRewardsIssuer = (await SubscriptionRewardsIssuerFactory.deploy(
    {
      modlAddress: MODL.address,
    }
  )) as SubscriptionRewardsIssuer;

  modelNft = (await ModelNftFactory.deploy()) as ModelNft;
  modelNftRewards = await ModelNftRewardsFactory.deploy({
    modlAddress: MODL.address,
    modlAllowanceAddress: MODLAllowance.address,
    modelNftAddress: modelNft.address,
  });
  mockUsdcPriceOracle = await ManagedPriceOracleFactory.deploy({
    tokenAddress: USDC.address,
    initialDecimals: 8,
    initialPrice: 100000000,
  });
  mockModlPriceOracle = await ManagedPriceOracleFactory.deploy({
    tokenAddress: MODL.address,
    initialDecimals: 8,
    initialPrice: 100000000,
  });
  mockCmkPriceOracle = await ManagedPriceOracleFactory.deploy({
    tokenAddress: CMK.address,
    initialDecimals: 8,
    initialPrice: 50000000,
  });

  subscriptionBasic = (await ModlSubscriptionFactory.deploy({
    tokenAddress: MODL.address,
    rewardsIssuerAddress: rewardsIssuer.address,
  })) as ModlSubscription;

  subscriptionPro = (await ModlSubscriptionFactory.deploy({
    tokenAddress: MODL.address,
    rewardsIssuerAddress: rewardsIssuer.address,
  })) as ModlSubscription;

  subscriptionSuperPro = (await ModlSubscriptionFactory.deploy({
    tokenAddress: MODL.address,
    rewardsIssuerAddress: rewardsIssuer.address,
  })) as ModlSubscription;

  subscriptionStable = (await GenericSubscriptionFactory.deploy({
    tokenAddress: USDC.address,
    rewardsIssuerAddress: rewardsIssuer.address,
  })) as GenericSubscription;

  cmkSubscription = (await GenericSubscriptionFactory.deploy({
    tokenAddress: CMK.address,
    rewardsIssuerAddress: cmkSubscriptionRewardsIssuer.address,
  })) as GenericSubscription;
}

async function setupExternalEnvironment() {
  swapRouter = (await ethers.getContractAt(
    'ISwapRouter',
    '0xE592427A0AEce92De3Edee1F18E0157C05861564'
  )) as ISwapRouter;

  nonFungiblePositionManager = (await ethers.getContractAt(
    'INonfungiblePositionManager',
    '0xC36442b4a4522E871399CD717aBDD847Ab11FE88'
  )) as INonfungiblePositionManager;
}

async function grantPermissions() {
  // CONFIGURER
  await MODL.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
  await MODLAllowance.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
  await liquidityManager.grantRole(
    CONFIGURER_ROLE,
    CREDMARK_CONFIGURER.address
  );
  await subscriptionBasic.grantRole(
    CONFIGURER_ROLE,
    CREDMARK_CONFIGURER.address
  );
  await subscriptionPro.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
  await subscriptionSuperPro.grantRole(
    CONFIGURER_ROLE,
    CREDMARK_CONFIGURER.address
  );
  await subscriptionStable.grantRole(
    CONFIGURER_ROLE,
    CREDMARK_CONFIGURER.address
  );
  await cmkSubscription.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
  await rewardsIssuer.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
  await cmkSubscriptionRewardsIssuer.grantRole(
    CONFIGURER_ROLE,
    CREDMARK_CONFIGURER.address
  );
  await revenueTreasury.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
  await mockModlPriceOracle.grantRole(
    CONFIGURER_ROLE,
    CREDMARK_CONFIGURER.address
  );
  await mockCmkPriceOracle.grantRole(
    CONFIGURER_ROLE,
    CREDMARK_CONFIGURER.address
  );
  await mockUsdcPriceOracle.grantRole(
    CONFIGURER_ROLE,
    CREDMARK_CONFIGURER.address
  );
  await modelNft.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
  await liquidityManager.grantRole(MANAGER_ROLE, CREDMARK_MANAGER.address);

  await modelNft.grantRole(MANAGER_ROLE, CREDMARK_MANAGER.address);

  await MODL.grantRole(MINTER_ROLE, MODLAllowance.address);
  await MODL.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
  await MODL.grantRole(MINTER_ROLE, rewardsIssuer.address);
  await MODL.grantRole(MINTER_ROLE, liquidityManager.address);

  await rewardsIssuer.grantRole(
    TRUSTED_CONTRACT_ROLE,
    subscriptionBasic.address
  );
  await rewardsIssuer.grantRole(TRUSTED_CONTRACT_ROLE, subscriptionPro.address);
  await rewardsIssuer.grantRole(
    TRUSTED_CONTRACT_ROLE,
    subscriptionStable.address
  );
  await rewardsIssuer.grantRole(
    TRUSTED_CONTRACT_ROLE,
    subscriptionSuperPro.address
  );
  await cmkSubscriptionRewardsIssuer.grantRole(
    TRUSTED_CONTRACT_ROLE,
    cmkSubscription.address
  );

  await CMK.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
  await CMK.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);

  await USDC.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
  await USDC.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);

  await MODL.grantRole(MINTER_ROLE, MOCK_GODMODE.address);
  await MODL.grantRole(DEFAULT_ADMIN_ROLE, MOCK_GODMODE.address);

  await modelNftRewards.grantRole(MANAGER_ROLE, CREDMARK_MANAGER.address);
}

async function configure() {
  await MODLAllowance.connect(CREDMARK_CONFIGURER).configure({
    ceiling: '1000000000000000000000000',
  });
  // ALLOWANCES
  await rewardsIssuer
    .connect(CREDMARK_CONFIGURER)
    .configure({ amountPerAnnum: '250000000000000000000000' });
  await cmkSubscriptionRewardsIssuer
    .connect(CREDMARK_CONFIGURER)
    .configure({ amountPerAnnum: '250000000000000000000000' });
  await revenueTreasury.connect(CREDMARK_CONFIGURER).configure({
    daoAddress: CREDMARK_TREASURY_MULTISIG.address,
    modlPercentToDao: '0',
  });

  await MODLAllowance.connect(CREDMARK_CONFIGURER).update(
    modelNftRewards.address,
    '250000000000000000000000'
  );
  await MODLAllowance.connect(CREDMARK_CONFIGURER).update(
    CREDMARK_TREASURY_MULTISIG.address,
    '250000000000000000000000'
  );

  await subscriptionBasic.connect(CREDMARK_CONFIGURER).configure({
    lockup: '86400',
    fee: '0',
    multiplier: '100',
    subscribable: true,
    floorPrice: '100000000',
    ceilingPrice: '999999999999999',
    treasury: revenueTreasury.address,
    oracleAddress: mockModlPriceOracle.address,
  });

  await subscriptionPro.connect(CREDMARK_CONFIGURER).configure({
    lockup: '2592000',
    fee: '500000000000000000000',
    multiplier: '200',
    subscribable: true,
    floorPrice: '100000000',
    ceilingPrice: '999999999999999',
    treasury: revenueTreasury.address,
    oracleAddress: mockModlPriceOracle.address,
  });

  await subscriptionStable.connect(CREDMARK_CONFIGURER).configure({
    lockup: '2592000',
    fee: '500000000000000000000',
    multiplier: '100',
    subscribable: true,
    floorPrice: '100000000',
    ceilingPrice: '100000001',
    treasury: revenueTreasury.address,
    oracleAddress: mockUsdcPriceOracle.address,
  });

  await subscriptionSuperPro.connect(CREDMARK_CONFIGURER).configure({
    lockup: '2592000',
    fee: '5000000000000000000000',
    multiplier: '400',
    subscribable: true,
    floorPrice: '100000000',
    ceilingPrice: '999999999999999',
    treasury: revenueTreasury.address,
    oracleAddress: mockModlPriceOracle.address,
  });

  await cmkSubscription.connect(CREDMARK_CONFIGURER).configure({
    lockup: '2592000',
    fee: '2500000000000000000000',
    multiplier: '100',
    subscribable: true,
    floorPrice: '100000000',
    ceilingPrice: '999999999999999',
    treasury: revenueTreasury.address,
    oracleAddress: mockModlPriceOracle.address,
  });
}

async function mockTokens() {
  await CMK.connect(MOCK_GODMODE).mint(
    CREDMARK_MANAGER.address,
    '50000000000000000000000000'
  );
  await CMK.connect(MOCK_GODMODE).mint(
    CREDMARK_TREASURY_MULTISIG.address,
    '50000000000000000000000000'
  );

  await USDC.connect(MOCK_GODMODE).mint(
    CREDMARK_MANAGER.address,
    '50000000000000'
  );
}

async function printProtocol() {
  console.log(MODL.address, 'MODL');

  console.log(MODLAllowance.address, 'Modl Allowance');
  console.log(rewardsIssuer.address, 'Rewards Issuer');
  console.log(cmkSubscriptionRewardsIssuer.address, 'CMK Rewards Issuer');
  console.log(liquidityManager.address, 'liquidity Manager');
  console.log(subscriptionBasic.address, 'subscription: MODL basic');
  console.log(subscriptionPro.address, 'subscription: MODL pro');
  console.log(subscriptionSuperPro.address, 'subscription: MODL super Pro');
  console.log(subscriptionStable.address, 'subscription: stable');
  console.log(cmkSubscription.address, 'subscription: CMK');
  console.log(modelNft.address, 'Model NFT');
  console.log(modelNftRewards.address, 'Model NFT rewards');

  console.log(CREDMARK_DEPLOYER.address, 'deployer');
  console.log(CREDMARK_CONFIGURER.address, 'configurer');
  console.log(CREDMARK_MANAGER.address, 'manager');
  console.log(USER_ALICE.address, 'alice');
  console.log(USER_BRENT.address, 'brent');
  console.log(USER_CAMMY.address, 'cammy');
  console.log(USER_DAVID.address, 'david');

  console.log(USDC.address, 'USDC (Mock)');
  console.log(CMK.address, 'CMK (Mock)');
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
  NULL_ADDRESS,
};
