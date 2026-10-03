import { ethers } from 'hardhat';
import {
  CmkSubscription,
  INonfungiblePositionManager,
  ISwapRouter,
  LiquidityManager,
  ManagedPriceOracle,
  MockCmk,
  MockUsdc,
  ModelNft,
  ModelNftRewards,
  Modl,
  ModlSubscription,
  RevenueTreasury,
  StableTokenSubscription,
  SubscriptionRewardsIssuer,
} from '../../typechain-types';
import './bigNumber';

import {
  CREDMARK_CONFIGURER,
  CREDMARK_MANAGER,
  CREDMARK_ROLE_ASSIGNER,
  CREDMARK_TREASURY_MULTISIG,
  setupUsers,
  TEST_GODMODE,
} from './users';

import {
  CONFIGURER_ROLE,
  DEFAULT_ADMIN_ROLE,
  MANAGER_ROLE,
  MINTER_ROLE,
  TRUSTED_CONTRACT_ROLE,
} from './roles';

import { univ3Addresses } from './constants';
import { aYearFromNow } from './time';

let modl: Modl;
let cmk: MockCmk;
let usdc: MockCmk;
let liquidityManager: LiquidityManager;
let swapRouter: ISwapRouter;
let nonFungiblePositionManager: INonfungiblePositionManager;

let rewards: SubscriptionRewardsIssuer;
let rewardsCmk: SubscriptionRewardsIssuer;
let rewardsNft: ModelNftRewards;

let mockUsdcPriceOracle: ManagedPriceOracle;
let modlOracle: ManagedPriceOracle;
let mockCmkPriceOracle: ManagedPriceOracle;
let modelNft: ModelNft;

let revenueTreasury: RevenueTreasury;

let subBasic: ModlSubscription;
let subPro: ModlSubscription;
let subscriptionStable: StableTokenSubscription;
let subSuper: ModlSubscription;
let subCmk: CmkSubscription;

function configurableContracts() {
  return [
    modl,
    modelNft,
    revenueTreasury,
    rewards,
    rewardsCmk,
    subBasic,
    subPro,
    subSuper,
    subCmk,
    liquidityManager,
  ];
}

function managedContracts() {
  return [
    modlOracle,
    modelNft,
    modl,
    rewardsNft,
    liquidityManager,
    revenueTreasury,
  ];
}

function contracts() {
  return [
    modl,
    modelNft,
    revenueTreasury,
    liquidityManager,
    rewards,
    rewardsCmk,
    modlOracle,
    subBasic,
    subPro,
    subSuper,
    subCmk,
  ];
}

function subscriptions() {
  return [subBasic, subPro, subSuper];
}

const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

async function connectExternals() {
  swapRouter = (await ethers.getContractAt(
    'ISwapRouter',
    univ3Addresses.univ3SwapRouter
  )) as ISwapRouter;
}
async function mockTokens() {
  /* Deploy Mock Tokens */

  const FCmk = await ethers.getContractFactory('MockCmk');
  const FUsdc = await ethers.getContractFactory('MockUsdc');
  cmk = (await FCmk.deploy()) as unknown as MockCmk;
  usdc = (await FUsdc.deploy()) as unknown as MockUsdc;

  /* Grant Mock Permissions */

  await cmk.grantRole(MINTER_ROLE, await TEST_GODMODE.getAddress());
  await usdc.grantRole(MINTER_ROLE, await TEST_GODMODE.getAddress());

  /* Mint Mock Tokens */

  await cmk
    .connect(TEST_GODMODE)
    .mint(await TEST_GODMODE.getAddress(), BigInt(10_000_000).toWei());
  await usdc
    .connect(TEST_GODMODE)
    .mint(await TEST_GODMODE.getAddress(), BigInt(10_000_000).toWei(6));
}

async function deployContractsDependency0() {
  const FModl = await ethers.getContractFactory('Modl');
  const FNft = await ethers.getContractFactory('ModelNft');
  modl = (await FModl.deploy(
    BigInt(10_000_000).toWei(),
    BigInt(1_000_000).toWei()
  )) as unknown as Modl;
  modelNft = (await FNft.deploy()) as unknown as ModelNft;
}

async function deployContractsDependency1() {
  const FRI = await ethers.getContractFactory('SubscriptionRewardsIssuer');
  const FLM = await ethers.getContractFactory('LiquidityManager');
  const FRT = await ethers.getContractFactory('RevenueTreasury');

  rewards = (await FRI.deploy({
    modlAddress: await modl.getAddress(),
  })) as SubscriptionRewardsIssuer;

  rewardsCmk = (await FRI.deploy({
    modlAddress: await modl.getAddress(),
  })) as SubscriptionRewardsIssuer;

  revenueTreasury = (await FRT.deploy({
    modlAddress: await modl.getAddress(),
  })) as unknown as RevenueTreasury;

  liquidityManager = (await FLM.deploy({
    modlAddress: await modl.getAddress(),
    usdcAddress: await usdc.getAddress(),
    launchLiquidity: '7500000000000000000000000',
    lockup: (2 * 365 * 86400).toString(),
    revenueTreasury: await revenueTreasury.getAddress(),
  })) as unknown as LiquidityManager;
}

async function deployContractsDependency2() {
  const FNftRew = await ethers.getContractFactory('ModelNftRewards');
  const FManOra = await ethers.getContractFactory('ManagedPriceOracle');

  rewardsNft = await FNftRew.deploy({
    modlAddress: await modl.getAddress(),
    modelNftAddress: await modelNft.getAddress(),
  });

  modlOracle = await FManOra.deploy({
    tokenAddress: await modl.getAddress(),
    initialPrice: 100000000,
  });
}

async function deployContractsDependency3() {
  const FSubModl = await ethers.getContractFactory('ModlSubscription');
  const FSubCmk = await ethers.getContractFactory('CmkSubscription');

  subBasic = (await FSubModl.deploy(
    {
      tokenAddress: await modl.getAddress(),
      rewardsIssuerAddress: await rewards.getAddress(),
    },
    await modlOracle.getAddress()
  )) as ModlSubscription;

  subPro = (await FSubModl.deploy(
    {
      tokenAddress: await modl.getAddress(),
      rewardsIssuerAddress: await rewards.getAddress(),
    },
    await modlOracle.getAddress()
  )) as ModlSubscription;

  subSuper = (await FSubModl.deploy(
    {
      tokenAddress: await modl.getAddress(),
      rewardsIssuerAddress: await rewards.getAddress(),
    },
    await modlOracle.getAddress()
  )) as ModlSubscription;

  subCmk = (await FSubCmk.deploy({
    tokenAddress: await cmk.getAddress(),
    rewardsIssuerAddress: await rewardsCmk.getAddress(),
  })) as CmkSubscription;
}

async function grantConfigurer() {
  for (const contract of configurableContracts()) {
    await contract.grantRole(CONFIGURER_ROLE, await CREDMARK_CONFIGURER.getAddress());
  }
}
async function grantManager() {
  for (const contract of managedContracts()) {
    await contract.grantRole(MANAGER_ROLE, await CREDMARK_MANAGER.getAddress());
  }
}
async function grantAdmin() {
  for (const contract of managedContracts()) {
    await contract.grantRole(
      DEFAULT_ADMIN_ROLE,
      await CREDMARK_ROLE_ASSIGNER.getAddress()
    );
  }
}
async function grantTrustedContract() {
  for (const contract of subscriptions()) {
    await rewards.grantRole(TRUSTED_CONTRACT_ROLE, await contract.getAddress());
  }
  await rewardsCmk.grantRole(TRUSTED_CONTRACT_ROLE, await subCmk.getAddress());
}

async function grantMinter() {
  await modelNft.grantRole(MINTER_ROLE, await CREDMARK_MANAGER.getAddress());
}

async function configure() {
  await modl
    .connect(CREDMARK_CONFIGURER)
    .grantMintAllowance(
      await CREDMARK_TREASURY_MULTISIG.getAddress(),
      BigInt(250_000).toWei()
    );
  await modl
    .connect(CREDMARK_CONFIGURER)
    .grantMintAllowance(await rewardsNft.getAddress(), BigInt(250_000).toWei());
  await modl
    .connect(CREDMARK_CONFIGURER)
    .grantMintAllowance(await rewards.getAddress(), BigInt(250_000).toWei());
  await modl
    .connect(CREDMARK_CONFIGURER)
    .grantVestingMintAllowance(
      await rewardsCmk.getAddress(),
      BigInt(250_000).toWei(),
      await aYearFromNow()
    );
  await revenueTreasury.connect(CREDMARK_CONFIGURER).configure({
    daoAddress: await CREDMARK_TREASURY_MULTISIG.getAddress(),
    modlPercentToDao: '0',
  });

  await subBasic.connect(CREDMARK_CONFIGURER).configure({
    lockup: 86400 * 1,
    fee: '0',
    multiplier: '100',
    floorPrice: '100000000',
    treasury: await revenueTreasury.getAddress(),
  });

  await subPro.connect(CREDMARK_CONFIGURER).configure({
    lockup: 86400 * 30,
    fee: BigInt(500).toWei(),
    multiplier: '200',
    floorPrice: '100000000',
    treasury: await revenueTreasury.getAddress(),
  });

  await subSuper.connect(CREDMARK_CONFIGURER).configure({
    lockup: 86400 * 30,
    fee: BigInt(5000).toWei(),
    multiplier: '400',
    floorPrice: '100000000',
    treasury: await revenueTreasury.getAddress(),
  });

  await subCmk.connect(CREDMARK_CONFIGURER).configure({
    lockup: 86400 * 30,
    fee: BigInt(250).toWei(),
    multiplier: '100',
    floorPrice: '100000000',
    treasury: await revenueTreasury.getAddress(),
  });
}

async function setupProtocol() {
  await setupUsers();

  await connectExternals();

  await deployContracts();

  await grantPermissions();

  await configure();
}

async function deployContracts() {
  await mockTokens();

  await deployContractsDependency0();
  await deployContractsDependency1();
  await deployContractsDependency2();
  await deployContractsDependency3();
}

async function grantPermissions() {
  await grantAdmin();
  await grantConfigurer();
  await grantManager();
  await grantTrustedContract();
  await grantMinter();
}

export {
  setupProtocol,
  deployContracts,
  deployContractsDependency0,
  deployContractsDependency1,
  deployContractsDependency2,
  deployContractsDependency3,
  mockTokens,
  grantPermissions,
  grantAdmin,
  grantConfigurer,
  grantManager,
  grantTrustedContract,
  grantMinter,
  configure,
  modl,
  cmk,
  usdc,
  liquidityManager,
  swapRouter,
  nonFungiblePositionManager,
  subBasic,
  subPro,
  subscriptionStable,
  subSuper,
  rewards,
  mockCmkPriceOracle,
  modlOracle,
  mockUsdcPriceOracle,
  modelNft,
  rewardsNft,
  rewardsCmk,
  subCmk,
  revenueTreasury,
  NULL_ADDRESS,
};
