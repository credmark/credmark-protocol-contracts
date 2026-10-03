import {
  cmk,
  liquidityManager,
  modelNft,
  modl,
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
  console.log(await usdc.getAddress(), 'usdc (Mock)');
  console.log(await cmk.getAddress(), 'cmk (Mock)');

  console.log(await modl.getAddress(), 'modl');
  console.log(await rewards.getAddress(), 'Rewards Issuer');
  console.log(await rewardsCmk.getAddress(), 'cmk Rewards Issuer');
  console.log(await liquidityManager.getAddress(), 'liquidity Manager');
  console.log(await subBasic.getAddress(), 'subscription: modl basic');
  console.log(await subPro.getAddress(), 'subscription: modl pro');
  console.log(await subSuper.getAddress(), 'subscription: modl super Pro');
  console.log(await subCmk.getAddress(), 'subscription: cmk');
  console.log(await modelNft.getAddress(), 'Model NFT');
  console.log(await rewardsNft.getAddress(), 'Model NFT rewards');
}
