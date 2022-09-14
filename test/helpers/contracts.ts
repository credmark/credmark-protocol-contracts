import { ethers } from 'hardhat';
import './bigNumber';
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
  ModelNftRewards,
  ModelNft,
  ManagedPriceOracle,
  RevenueTreasury,
  CmkSubscription,
} from '../../typechain';

import {
  setupUsers,
  CREDMARK_DEPLOYER,
  CREDMARK_MANAGER,
  CREDMARK_TREASURY_MULTISIG,
  CREDMARK_CONFIGURER,
  TEST_GODMODE,
  CREDMARK_ROLE_ASSIGNER,
} from './users';

import {
  CONFIGURER_ROLE,
  MANAGER_ROLE,
  TRUSTED_CONTRACT_ROLE,
  MINTER_ROLE,
  DEFAULT_ADMIN_ROLE,
} from './roles';

import { StableTokenSubscription } from '../../typechain/StableTokenSubscription';
import { VariableTokenSubscription } from '../../typechain/VariableTokenSubscription';
import { BigNumber, BytesLike } from 'ethers';
import { Contract } from 'hardhat/internal/hardhat-network/stack-traces/model';
import { univ3Addresses } from './constants';

let modl: Modl;
let modlAllowance: ModlAllowance;
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
    modlAllowance,
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
  return [modlOracle, modelNft, modl, rewardsNft, liquidityManager];
}

function contracts() {
  return [
    modl,
    modelNft,
    modlAllowance,
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

let timeLibrary: Time;

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
  cmk = (await FCmk.deploy()) as MockCmk;
  usdc = (await FUsdc.deploy()) as MockUsdc;

  /* Grant Mock Permissions */

  await cmk.grantRole(MINTER_ROLE, TEST_GODMODE.address);
  await usdc.grantRole(MINTER_ROLE, TEST_GODMODE.address);

  /* Mint Mock Tokens */

  await cmk
    .connect(TEST_GODMODE)
    .mint(TEST_GODMODE.address, BigNumber.from(10_000_000).toWei());
  await cmk
    .connect(TEST_GODMODE)
    .mint(TEST_GODMODE.address, BigNumber.from(10_000_000).toWei(6));
}

async function deployLibraries() {
  const FTime = await ethers.getContractFactory('Time');
  timeLibrary = (await FTime.deploy()) as Time;
}

async function deployContractsDependency0() {
  const FModl = await ethers.getContractFactory('Modl');
  const FNft = await ethers.getContractFactory('ModelNft');
  modl = (await FModl.deploy()) as Modl;
  modelNft = (await FNft.deploy()) as ModelNft;
}

async function deployContractsDependency1() {
  const FMA = await ethers.getContractFactory('ModlAllowance', {
    libraries: { Time: timeLibrary.address },
  });
  const FRI = await ethers.getContractFactory('SubscriptionRewardsIssuer', {
    libraries: { Time: timeLibrary.address },
  });
  const FLM = await ethers.getContractFactory('LiquidityManager', {
    libraries: { Time: timeLibrary.address },
  });
  const FRT = await ethers.getContractFactory('RevenueTreasury');

  modlAllowance = (await FMA.deploy({
    modlAddress: modl.address,
  })) as ModlAllowance;

  rewards = (await FRI.deploy({
    modlAddress: modl.address,
  })) as SubscriptionRewardsIssuer;

  rewardsCmk = (await FRI.deploy({
    modlAddress: modl.address,
  })) as SubscriptionRewardsIssuer;

  revenueTreasury = (await FRT.deploy({
    modlAddress: modl.address,
  })) as RevenueTreasury;

  liquidityManager = (await FLM.deploy({
    modlAddress: modl.address,
    usdcAddress: usdc.address,
    launchLiquidity: '7500000000000000000000000',
    lockup: (2 * 365 * 86400).toString(),
    revenueTreasury: revenueTreasury.address,
  })) as LiquidityManager;
}

async function deployContractsDependency2() {
  const FNftRew = await ethers.getContractFactory('ModelNftRewards');
  const FManOra = await ethers.getContractFactory('ManagedPriceOracle');

  rewardsNft = await FNftRew.deploy({
    modlAddress: modl.address,
    modlAllowanceAddress: modlAllowance.address,
    modelNftAddress: modelNft.address,
  });

  modlOracle = await FManOra.deploy({
    tokenAddress: modl.address,
    initialPrice: 100000000,
  });
}

async function deployContractsDependency3() {
  const FSubModl = await ethers.getContractFactory('ModlSubscription', {
    libraries: { Time: timeLibrary.address },
  });
  const FSubCmk = await ethers.getContractFactory('CmkSubscription', {
    libraries: { Time: timeLibrary.address },
  });

  subBasic = (await FSubModl.deploy(
    {
      tokenAddress: modl.address,
      rewardsIssuerAddress: rewards.address,
    },
    modlOracle.address
  )) as ModlSubscription;

  subPro = (await FSubModl.deploy(
    {
      tokenAddress: modl.address,
      rewardsIssuerAddress: rewards.address,
    },
    modlOracle.address
  )) as ModlSubscription;

  subSuper = (await FSubModl.deploy(
    {
      tokenAddress: modl.address,
      rewardsIssuerAddress: rewards.address,
    },
    modlOracle.address
  )) as ModlSubscription;

  subCmk = (await FSubCmk.deploy({
    tokenAddress: cmk.address,
    rewardsIssuerAddress: rewardsCmk.address,
  })) as CmkSubscription;
}

async function grantConfigurer() {
  for (const contract of configurableContracts()) {
    await contract.grantRole(CONFIGURER_ROLE, CREDMARK_CONFIGURER.address);
  }
}
async function grantManager() {
  for (const contract of managedContracts()) {
    await contract.grantRole(MANAGER_ROLE, CREDMARK_MANAGER.address);
  }
}
async function grantAdmin() {
  for (const contract of managedContracts()) {
    await contract.grantRole(
      DEFAULT_ADMIN_ROLE,
      CREDMARK_ROLE_ASSIGNER.address
    );
  }
}
async function grantTrustedContract() {
  for (const contract of subscriptions()) {
    await rewards.grantRole(TRUSTED_CONTRACT_ROLE, contract.address);
  }
  await rewardsCmk.grantRole(TRUSTED_CONTRACT_ROLE, subCmk.address);
}

async function grantMinter() {
  await modl.grantRole(MINTER_ROLE, rewards.address);
  await modl.grantRole(MINTER_ROLE, rewardsCmk.address);
  await modl.grantRole(MINTER_ROLE, modlAllowance.address);
  await modl.grantRole(MINTER_ROLE, TEST_GODMODE.address);
}

async function configure() {
  await modlAllowance.connect(CREDMARK_CONFIGURER).configure({
    ceiling: BigNumber.from(500_000).toWei(),
  });

  await modlAllowance
    .connect(CREDMARK_CONFIGURER)
    .update(
      CREDMARK_TREASURY_MULTISIG.address,
      BigNumber.from(250_000).toWei()
    );
  await modlAllowance
    .connect(CREDMARK_CONFIGURER)
    .update(rewardsNft.address, BigNumber.from(250_000).toWei());

  await revenueTreasury.connect(CREDMARK_CONFIGURER).configure({
    daoAddress: CREDMARK_TREASURY_MULTISIG.address,
    modlPercentToDao: '0',
  });

  await rewards.connect(CREDMARK_CONFIGURER).configure({
    amountPerAnnum: BigNumber.from(250_000).toWei(),
  });
  await rewardsCmk.connect(CREDMARK_CONFIGURER).configure({
    amountPerAnnum: BigNumber.from(250_000).toWei(),
  });

  await subBasic.connect(CREDMARK_CONFIGURER).configure({
    lockup: 86400 * 1,
    fee: '0',
    multiplier: '100',
    floorPrice: '100000000',
    treasury: revenueTreasury.address,
  });

  await subPro.connect(CREDMARK_CONFIGURER).configure({
    lockup: 86400 * 30,
    fee: BigNumber.from(500).toWei(),
    multiplier: '200',
    floorPrice: '100000000',
    treasury: revenueTreasury.address,
  });

  await subSuper.connect(CREDMARK_CONFIGURER).configure({
    lockup: 86400 * 30,
    fee: BigNumber.from(5000).toWei(),
    multiplier: '400',
    floorPrice: '100000000',
    treasury: revenueTreasury.address,
  });

  await subCmk.connect(CREDMARK_CONFIGURER).configure({
    lockup: 86400 * 30,
    fee: BigNumber.from(250).toWei(),
    multiplier: '100',
    floorPrice: '100000000',
    treasury: revenueTreasury.address,
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

  await deployLibraries();

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
  modlAllowance,
  liquidityManager,
  swapRouter,
  nonFungiblePositionManager,
  timeLibrary,
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
