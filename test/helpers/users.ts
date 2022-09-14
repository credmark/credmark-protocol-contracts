import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

let CREDMARK_DEPLOYER: SignerWithAddress;
let CREDMARK_CONFIGURER: SignerWithAddress;
let CREDMARK_MANAGER: SignerWithAddress;
let CREDMARK_TREASURY_MULTISIG: SignerWithAddress;
let CREDMARK_ROLE_ASSIGNER: SignerWithAddress;

let USER_ALICE: SignerWithAddress;
let USER_BRENT: SignerWithAddress;
let USER_CAMMY: SignerWithAddress;
let USER_DAVID: SignerWithAddress;

let HACKER_ZACH: SignerWithAddress;
let USERS: Array<SignerWithAddress>;

let TEST_GODMODE: SignerWithAddress;

async function setupUsers() {
  [
    CREDMARK_DEPLOYER,
    CREDMARK_MANAGER,
    CREDMARK_TREASURY_MULTISIG,
    CREDMARK_CONFIGURER,
    USER_ALICE,
    USER_BRENT,
    USER_CAMMY,
    USER_DAVID,
    HACKER_ZACH,
    TEST_GODMODE,
    CREDMARK_ROLE_ASSIGNER,
  ] = await ethers.getSigners();
  USERS = [USER_ALICE, USER_BRENT, USER_CAMMY, USER_DAVID];
}

export {
  setupUsers,
  CREDMARK_DEPLOYER,
  CREDMARK_MANAGER,
  CREDMARK_TREASURY_MULTISIG,
  CREDMARK_CONFIGURER,
  USER_ALICE,
  USER_BRENT,
  USER_CAMMY,
  USER_DAVID,
  HACKER_ZACH,
  USERS,
  TEST_GODMODE,
  CREDMARK_ROLE_ASSIGNER,
};
