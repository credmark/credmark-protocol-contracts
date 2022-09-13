import { ethers } from "hardhat";
import { Modl, Time } from "../../typechain";
import { testconfig } from "./config.test";

async function buildProtocol() {
    await externalContracts();
    await mockContracts();

    await deployTimeLibrary();
    await contractFactories();

    await deployModl();
    
}

let timeLibrary: Time;
async function deployTimeLibrary() {
    let TimeFactory = await ethers.getContractFactory("Time");
    timeLibrary = (await TimeFactory.deploy()) as Time;
}

let modl: Modl;
async function deployModl() {
    let ModlFactory = await ethers.getContractFactory("Modl");
    modl = await ModlFactory.deploy() as Modl;
}

async function externalContracts() {

}

async function mockContracts() {

}

async function setupContractFactories() {

}



async function contractFactories() {

}