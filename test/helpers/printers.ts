import {
  cmk,
  liquidityManager,
  modelNft,
  modl,
  modlAllowance,
  rewards,
  rewardsCmk,
  rewardsNft,
  subBasic,
  subCmk,
  subPro,
  subSuper,
  usdc,
} from './contracts';

async function printContractAddresses() {
  console.log(usdc.address, 'usdc (Mock)');
  console.log(cmk.address, 'cmk (Mock)');

  console.log(modl.address, 'modl');

  console.log(modlAllowance.address, 'Modl Allowance');
  console.log(rewards.address, 'Rewards Issuer');
  console.log(rewardsCmk.address, 'cmk Rewards Issuer');
  console.log(liquidityManager.address, 'liquidity Manager');
  console.log(subBasic.address, 'subscription: modl basic');
  console.log(subPro.address, 'subscription: modl pro');
  console.log(subSuper.address, 'subscription: modl super Pro');
  console.log(subCmk.address, 'subscription: cmk');
  console.log(modelNft.address, 'Model NFT');
  console.log(rewardsNft.address, 'Model NFT rewards');
}
