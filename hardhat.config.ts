import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

dotenv.config();

let accounts;
if (process.env.ACCOUNT_MNEMONIC) {
  accounts = {
    mnemonic: process.env.ACCOUNT_MNEMONIC,
  };
} else if (process.env.ACCOUNT_PRIVATE_KEY) {
  accounts = [process.env.ACCOUNT_PRIVATE_KEY];
}
const CHAIN_IDS = {
  hardhat: 31337, 
};

const config: HardhatUserConfig = {
  solidity: "0.8.7",
  networks: {
    hardhat: {
      chainId: CHAIN_IDS.hardhat,
      forking: {
        enabled: true,
        url: `https://eth-mainnet.alchemyapi.io/v2/LilE1jthU7j0D4X6eBKbTG4Nak7MstUm`,
      }
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
