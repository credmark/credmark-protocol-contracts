import { BigNumberish } from "ethers";

export interface LiquidityManagerConfig {
  launchLiquidity: BigNumberish;
  lockup: BigNumberish;
}

export interface SubscriptionConfig {
  name: string;
  token: string;
  oracle: string;
  treasury: string;
  lockup: BigNumberish;
  fee: BigNumberish;
  multiplier: BigNumberish;
  subscribable: boolean;
  floorPrice: BigNumberish;
  ceilingPrice: BigNumberish;
}

export interface RewardsIssuerConfig {
  amountPerAnnum: BigNumberish;
  subscriptions: Array<SubscriptionConfig>;
}

export interface RevenueTreasuryConfig {
  daoAddress: string;
  modlPercentToDao: BigNumberish;
}

export interface AllowanceConfig {
  account:string;
  amountPerAnnum: BigNumberish;
}

export interface ModlAllowanceConfig {
  ceiling: BigNumberish;
  allowances: Array<AllowanceConfig>;
}

export interface ProtocolConfig {
  liquidityManager: LiquidityManagerConfig;
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
