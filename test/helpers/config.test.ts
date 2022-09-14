// import { BigNumber } from 'ethers';
// import { ProtocolConfig } from './config.schema';

// export const testconfig: ProtocolConfig = {
//   liquidityManager: {
//     launchLiquidity: BigNumber.from(7500000).mul(BigNumber.from(10).pow(18)),
//     lockup: 2 * 365 * 86400,
//   },
//   rewardsIssuerConfig: [
//     {
//       amountPerAnnum: BigNumber.from(250000).mul(BigNumber.from(10).pow(18)),
//       variableSubscriptions: [
//         {
//           name: 'basic',
//           lockup: 86400,
//           fee: 0,
//           multiplier: 100,
//           floorPrice: BigNumber.from(0),
//           treasury_name: 'treasury',
//           oracle_name: 'modl',
//           token_name: 'modl',
//         },
//         {
//           name: 'pro',
//           lockup: 30 * 86400,
//           fee: BigNumber.from(250).mul(BigNumber.from(10).pow(18)),
//           multiplier: 200,
//           floorPrice: BigNumber.from(1e8),
//           treasury_name: 'treasury',
//           oracle_name: 'modl',
//           token_name: 'modl',
//         },
//         {
//           name: 'superpro',
//           lockup: 3 * 30 * 86400,
//           fee: BigNumber.from(1500).mul(BigNumber.from(10).pow(18)),
//           multiplier: 400,
//           floorPrice: BigNumber.from(1e8),
//           treasury_name: 'treasury',
//           oracle_name: 'modl',
//           token_name: 'modl',
//         },
//         {
//           name: 'weth',
//           lockup: 3 * 30 * 86400,
//           fee: BigNumber.from(250).mul(BigNumber.from(10).pow(18)),
//           multiplier: 100,
//           floorPrice: 0,
//           treasury_name: 'treasury',
//           oracle_name: 'weth',
//           token_name: 'weth',
//         },
//       ],
//       stableSubscriptions: [],
//     },
//     {
//       amountPerAnnum: BigNumber.from(250000).mul(BigNumber.from(10).pow(18)),
//       subscriptions: [
//         {
//           name: 'cmk',
//           lockup: 0,
//           fee: BigNumber.from(250).mul(BigNumber.from(10).pow(18)),
//           multiplier: BigNumber.from(5e7),
//           subscribable: true,
//           floorPrice: 0,
//           ceilingPrice: 0,
//           treasury: 'treasury',
//           oracle: 'cmkoracle',
//           token: 'cmk',
//         },
//       ],
//     },
//   ],
//   modlAllowance: {
//     allowances: [
//       {
//         account: 'CREDMARK_MULTISIG_TREASURY',
//         amountPerAnnum: BigNumber.from(250000).mul(BigNumber.from(10).pow(18)),
//       },
//       {
//         account: 'ModlNftRewards',
//         amountPerAnnum: BigNumber.from(250000).mul(BigNumber.from(10).pow(18)),
//       },
//     ],
//     ceiling: BigNumber.from(500000).mul(BigNumber.from(10).pow(18)),
//   },
// };
