import { ethers, waffle } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

let CREDMARK_DEPLOYER: SignerWithAddress;
let CREDMARK_MANAGER: SignerWithAddress;
let CREDMARK_TREASURY_MULTISIG: SignerWithAddress;
let CREDMARK_MODELER_TREASURY: SignerWithAddress;
let CREDMARK_MEMBER_TREASURY: SignerWithAddress;

let USER_ALICE: SignerWithAddress;
let USER_BRENT: SignerWithAddress;
let USER_CAMMY: SignerWithAddress;
let USER_DAVID: SignerWithAddress;

let HACKER_ZACH: SignerWithAddress;
let HACKER_YITZACK: SignerWithAddress;
let USERS: Array<SignerWithAddress>;

let MOCK_GODMODE: SignerWithAddress;

async function setupUsers() {
    [
        CREDMARK_DEPLOYER,
        CREDMARK_MANAGER,
        CREDMARK_TREASURY_MULTISIG,
        CREDMARK_MODELER_TREASURY,
        CREDMARK_MEMBER_TREASURY,
        USER_ALICE,
        USER_BRENT,
        USER_CAMMY,
        USER_DAVID,
        HACKER_ZACH,
        HACKER_YITZACK,
        MOCK_GODMODE
    ] = await ethers.getSigners();
    USERS = [USER_ALICE, USER_BRENT, USER_CAMMY, USER_DAVID];
}

export {
    setupUsers,
    CREDMARK_DEPLOYER,
    CREDMARK_MANAGER,
    CREDMARK_TREASURY_MULTISIG,
    CREDMARK_MODELER_TREASURY,
    CREDMARK_MEMBER_TREASURY,
    USER_ALICE,
    USER_BRENT,
    USER_CAMMY,
    USER_DAVID,
    HACKER_ZACH,
    HACKER_YITZACK,
    USERS,
    MOCK_GODMODE
}