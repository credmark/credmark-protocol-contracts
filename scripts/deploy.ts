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

      Deploy Libraries
        Time
        
      Deploy Contracts Dep 0
        Modl
        ModelNft
      
      Deploy Contracts Dep 1
        ModlMintAllowance
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
        Modl
        Modl MintAllowance
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
        Modl
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
          Modl MintAllowance
          Cmk Rewards Issuer
          Deployer

    >>CONFIGURE<<

      Modl MintAllowance
      Revenue Treasury
      Issuers
        Rewards Issuer
        Cmk Rewards Issuer
      Subscriptions
        Basic Subscription
        Pro Subscription
        Super Pro Subscription
        Cmk Subscription
    
    >>CLEANUP<<
    
      Revoke Deployer Credentials
        Admin
          Modl
          ModelNft
          ModlMintAllowance
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
          Modl MintAllowance
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
      Set Modl Oracle price   
      Update Modl MintAllowance for Dao
      Mint Modl for Liquidity Manager
      Start Liquidity Manager

      Optional:

        Deploy Contracts (optional): 
          Chainlink Price Oracle (WETH)
        Deploy Contracts (optional): 
          usdc Subscription, 
          WETH Subscription

        Rewards Issuer - WETH (optional)
        Rewards Issuer - usdc (optional)
*/
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
