import { ethers, waffle } from 'hardhat';

async function advanceAnHour() {
    await ethers.provider.send("evm_increaseTime", [3600]);
    await ethers.provider.send("evm_mine", []);
}

async function advanceADay() {
    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);
}

async function advanceAMonth() {
    await ethers.provider.send("evm_increaseTime", [86400 * 30]);
    await ethers.provider.send("evm_mine", []);
}

async function advanceAYear() {
    await ethers.provider.send("evm_increaseTime", [86400 * 365]);
    await ethers.provider.send("evm_mine", []);
}

export {
    advanceAnHour,
    advanceADay,
    advanceAMonth,
    advanceAYear
}