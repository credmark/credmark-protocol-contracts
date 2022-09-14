import { BigNumberish } from 'ethers';

export interface LiquidityManagerConfig {
  launchLiquidity: BigNumberish;
  lockup: BigNumberish;
}

export interface SubscriptionConfig {
  name: string;
  lockup: BigNumberish;
  fee: BigNumberish;
  multiplier: BigNumberish;
  token_name: string;
  treasury_name: string;
}

export interface VariableSubscriptionConfig extends SubscriptionConfig {
  oracle_name: string;
  floorPrice: BigNumberish;
}

export interface StableSubscriptionConfig extends SubscriptionConfig {
  tokenDecimals: Number;
}

export interface RewardsIssuerConfig {
  amountPerAnnum: BigNumberish;
  variableSubscriptions: Array<VariableSubscriptionConfig>;
  stableSubscriptions: Array<StableSubscriptionConfig>;
}

export interface RevenueTreasuryConfig {
  daoAddress: string;
  modlPercentToDao: BigNumberish;
}

export interface AllowanceConfig {
  account: string;
  amountPerAnnum: BigNumberish;
}

export interface ModlAllowanceConfig {
  ceiling: BigNumberish;
  allowances: Array<AllowanceConfig>;
}

export interface ProtocolConfig {
  liquidityManagers: LiquidityManagerConfig;
  rewardsIssuerConfig: Array<RewardsIssuerConfig>;
  modlAllowance: ModlAllowanceConfig;
}

export interface UniswapV3Config {
  swapRouter: string;
  nonFungiblePositionManager: string;
  cmkUsdcPool: string;
}

export interface ChainlinkOracleConfig {
  oracle: string;
  token: string;
}

export interface ExternalConfig {
  uniswap: UniswapV3Config;
  chainlink: Array<ChainlinkOracleConfig>;
}
