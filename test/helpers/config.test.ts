// // import { ProtocolConfig } from './config.schema';

// export const testconfig: ProtocolConfig = {
//   liquidityManager: {
//     launchLiquidity: (BigInt(7500000) * BigInt(10) ** BigInt(18)),
//     lockup: 2 * 365 * 86400,
//   },
//   rewardsIssuerConfig: [
//     {
//       amountPerAnnum: (BigInt(250000) * BigInt(10) ** BigInt(18)),
//       variableSubscriptions: [
//         {
//           name: 'basic',
//           lockup: 86400,
//           fee: 0,
//           multiplier: 100,
//           floorPrice: BigInt(0),
//           treasury_name: 'treasury',
//           oracle_name: 'modl',
//           token_name: 'modl',
//         },
//         {
//           name: 'pro',
//           lockup: 30 * 86400,
//           fee: (BigInt(250) * BigInt(10) ** BigInt(18)),
//           multiplier: 200,
//           floorPrice: BigInt(1e8),
//           treasury_name: 'treasury',
//           oracle_name: 'modl',
//           token_name: 'modl',
//         },
//         {
//           name: 'superpro',
//           lockup: 3 * 30 * 86400,
//           fee: (BigInt(1500) * BigInt(10) ** BigInt(18)),
//           multiplier: 400,
//           floorPrice: BigInt(1e8),
//           treasury_name: 'treasury',
//           oracle_name: 'modl',
//           token_name: 'modl',
//         },
//         {
//           name: 'weth',
//           lockup: 3 * 30 * 86400,
//           fee: (BigInt(250) * BigInt(10) ** BigInt(18)),
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
//       amountPerAnnum: (BigInt(250000) * BigInt(10) ** BigInt(18)),
//       subscriptions: [
//         {
//           name: 'cmk',
//           lockup: 0,
//           fee: (BigInt(250) * BigInt(10) ** BigInt(18)),
//           multiplier: BigInt(5e7),
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
//   modlMintAllowance: {
//     mintAllowances: [
//       {
//         account: 'CREDMARK_MULTISIG_TREASURY',
//         amountPerAnnum: (BigInt(250000) * BigInt(10) ** BigInt(18)),
//       },
//       {
//         account: 'ModlNftRewards',
//         amountPerAnnum: (BigInt(250000) * BigInt(10) ** BigInt(18)),
//       },
//     ],
//     ceiling: (BigInt(500000) * BigInt(10) ** BigInt(18)),
//   },
// };
