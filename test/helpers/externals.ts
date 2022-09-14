import { ethers } from 'hardhat';
import {
  IERC20,
  INonfungiblePositionManager,
  ISwapRouter,
} from '../../typechain';
import { tokenAddresses, univ3Addresses } from './constants';

export let swapRouter: ISwapRouter;
export let nonFungiblePositionManager: INonfungiblePositionManager;

export let usdc: IERC20;
export let cmk: IERC20;
export let weth: IERC20;

export async function externalsInit() {
  swapRouter = (await ethers.getContractAt(
    'ISwapRouter',
    univ3Addresses.univ3SwapRouter
  )) as ISwapRouter;

  nonFungiblePositionManager = (await ethers.getContractAt(
    'INonfungiblePositionManager',
    univ3Addresses.unisv3NonFungiblePositionManager
  )) as INonfungiblePositionManager;

  usdc = (await ethers.getContractAt('IERC20', tokenAddresses.usdc)) as IERC20;
  cmk = (await ethers.getContractAt('IERC20', tokenAddresses.cmk)) as IERC20;
  weth = (await ethers.getContractAt('IERC20', tokenAddresses.weth)) as IERC20;
}
