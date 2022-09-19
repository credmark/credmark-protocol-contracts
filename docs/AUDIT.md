# Credmark Protocol Audits

An english description of the protocol's operation is available here.
https://docs.google.com/document/d/1Fhv6fyjoxCYrnN2H9PoNkmhT8ojtxJGFoOZ3pjsCuMI/edit?usp=sharing


All contracts in:
```
/contracts/v2-core/*
```
Must to be audited.
```
contracts/external/*
contracts/mocks/*
@openzeppelin
```
Can be ignored, since they are from already audited sources or exist only for testing purposes.

## Files to Audit

### Configuration Files

Configuration files are abstract contracts that define Constructor Params and Configuration Schemas for Files.

Constructor Params define immutable variables.

Configuration defines variables that should be defined by governance.

```
contracts/v2-core/util/Configurable.sol

contracts/v2-core/configuration/CLiquidityManager.sol
contracts/v2-core/configuration/CManagedPriceOracle.sol
contracts/v2-core/configuration/CModelNftRewards.sol
contracts/v2-core/configuration/CRevenueTreasury.sol
contracts/v2-core/configuration/CSubscription.sol
contracts/v2-core/configuration/CSubscriptionRewardsIssuer.sol
```

### Interfaces 

Interfaces are contract interfaces for external calls.

```
contracts/v2-core/interfaces/IERC20Allowance.sol
contracts/v2-core/interfaces/ILiquidityManager.sol
contracts/v2-core/interfaces/IModelNftRewards.sol
contracts/v2-core/interfaces/IModl.sol
contracts/v2-core/interfaces/IPriceOracle.sol
contracts/v2-core/interfaces/IRevenueTreasury.sol
contracts/v2-core/interfaces/ISubscription.sol
contracts/v2-core/interfaces/ISubscriptionRewardsIssuer.sol
```

### Liquidity

Liquidity Manager is a contract that manages the launch liquidity in a permissionless way.

Revenue Treasury collects fees and burns and distributes them.

```
contracts/v2-core/liquidity/LiquidityManager.sol
contracts/v2-core/liquidity/RevenueTreasury.sol
```

### Oracles

Oracles create an endpoint for Subscriptions to discover the price of their underlying token. These should be improved upon iteratively.

```
contracts/v2-core/oracles/ChainlinkPriceOracle.sol
contracts/v2-core/oracles/ManagedPriceOracle.sol
```

### Rewards

These contracts issue rewards to subscribers and Model Contributors.

Subscription Rewards issuers have a dilutive structure, where they deliver proportional rewards to a subscription contract at the time of issuance. 

```
contracts/v2-core/rewards/ModelNftRewards.sol
contracts/v2-core/rewards/SubscriptionRewardsIssuer.sol
```

### Subscriptions

Subscriptions Inherit the abstract Subscription.sol. 
The different contracts exist for gas efficiency only.

```
contracts/v2-core/subscriptions/CmkSubscription.sol
contracts/v2-core/subscriptions/ModlSubscription.sol
contracts/v2-core/subscriptions/StableTokenSubscription.sol
contracts/v2-core/subscriptions/Subscription.sol
contracts/v2-core/subscriptions/VariableTokenSubscription.sol
```

### Token

Modl inherits ERC20Allowance to set minting parameters and permissions to mint inflationary abounts.

Model Nfts are owned by the contributor of a Model.

```
contracts/v2-core/token/ERC20Allowance.sol
contracts/v2-core/token/ModelNft.sol
contracts/v2-core/token/Modl.sol
```

### Accumulators

Accumulators calculate fees (via price accumulator) and Shares (via share accumulator) over time.

```
contracts/v2-core/util/accumulators/PriceAccumulator.sol
contracts/v2-core/util/accumulators/ShareAccumulator.sol
```

### Permissions

These set up the roles that are necessary for functioning of the system.

```
contracts/v2-core/util/permissions/Configurer.sol
contracts/v2-core/util/permissions/Manager.sol
contracts/v2-core/util/permissions/Permissioned.sol
contracts/v2-core/util/permissions/TrustedContract.sol
```

# Files to Not Audit

The protocol interacts and inherits from contracts and interfaces from openzeppelin, Uniswap v3, and Chainlink. These files are already audited.

The protocol uses Mocks in Testing, to create Tokens that Mock USDC and CMK.

```
contracts/external/*
contracts/mocks/*
```