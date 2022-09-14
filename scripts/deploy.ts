import { ethers } from 'hardhat';

async function main() {
  /*  
    >>REQUIRED ADDRESSES<<
      Credmark Multisig Treasury
      Credmark Multisig Manager
      Credmark Multisig Configurer
      Credmark Multisig Role Assigner
      CMK
      
    >>DEPLOY CONTRACTS<<

      Deploy Contracts Dep 0
        Time
        Modl
        ModelNft
      
      Deploy Contracts Dep 1
        ModlAllowance
        RewardsIssuers
        RevenueTreasury
        LiquidityManager

      Deploy Contracts Dep 2
        ModlNftRewards
        ManagedPriceOracle

      Deploy Contracts Dep 3
        Subscriptions
          Basic (ModlSubscription)
          Pro (ModlSubscription)
          Super Pro (ModlSubscription)
          Cmk (CmkSubscription)

    >>GRANT PERMISSIONS<<

      Grant Admin Permissions
        Credmark Multisig Role Assigner

      Grant Configurer Permissions 
        Modl Allowance
        Rewards Issuer
        Cmk Rewards Issuer
        Revenue Treasury
        Basic Sub
        Pro Sub
        Super Pro Sub
        Model Nft

          Deployer 
          Credmark Multisig Configurer
        
      Grant Manager Permissions
        Managed Price Oracle
        Model Nft
        Model Nft Rewards

          Credmark Multisig Manager

        Liquidity Manager
          Credmark Multisig Manager
          Deployer

      Grant Trusted Contract Permissions
        Rewards Issuer
          Basic
          Pro
          SuperPro

        Cmk Rewards issuer
          Cmk

      Grant Minter Permissions:
        MODL 
          Rewards Issuer
          Modl Allowance
          Cmk Rewards Issuer
          Deployer

    >>CONFIGURE<<

      Modl Allowance
      Revenue Treasury
      Issuers
        Rewards Issuer
        Cmk Rewards Issuer
      Subscriptions
        Basic Subscription
        Pro Subscription
        Super Pro Subscription
        Cmk Subscription
    
    >>PREPARE<<

      Mint Modl for Liquidity Manager
      Set Modl Oracle price

    >>CLEANUP<<
    
      Revoke Deployer Credentials
        Admin
          Modl
          ModelNft
          ModlAllowance
          CMK Rewards Issuer
          Rewards Issuer
          Revenue Treasury
          Liquidity Manager
          Modl Nft Rewards
          Managed Price Oracle
          Basic Subscription
          Pro Subscription
          Super Pro Subscription
          Cmk Subscription
        Configurer
          Modl Allowance
          Rewards Issuer
          Cmk Rewards Issuer
          Revenue Treasury
          Basic Sub
          Pro Sub
          Super Pro Sub
          Model Nft
        Manager
          Managed Price Oracle
          Model Nft
          Model Nft Rewards
        Minter
          Modl
    
    >>LAUNCH<<
      Start Liquidity Manager

      Optional:

        Deploy Contracts (optional): 
          Chainlink Price Oracle (WETH)
        Deploy Contracts (optional): 
          USDC Subscription, 
          WETH Subscription

        Rewards Issuer - WETH (optional)
        Rewards Issuer - USDC (optional)
*/
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
