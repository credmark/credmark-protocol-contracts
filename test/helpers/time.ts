import { ethers } from 'hardhat';

let prevTs = 0;

async function advanceX(seconds: number) {
  const currentBlockTimestamp = (await ethers.provider.getBlock('latest'))
    .timestamp;
  if (prevTs === 0 || prevTs > currentBlockTimestamp) {
    prevTs = currentBlockTimestamp;
  }

  const advance = seconds - (currentBlockTimestamp - prevTs);
  await ethers.provider.send('evm_increaseTime', [advance]);
  await ethers.provider.send('evm_mine', []);
  prevTs = prevTs + seconds;
}
async function aYearFromNow() {
  const currentBlockTimestamp = (await ethers.provider.getBlock('latest'))
    .timestamp;
  return currentBlockTimestamp + 86400 * 365;
}
async function advanceAnHour() {
  return await advanceX(3600);
}

async function advanceADay() {
  return await advanceX(86400);
}

async function advanceAMonth() {
  return await advanceX(86400 * 30);
}

async function advanceAYear() {
  return await advanceX(86400 * 365);
}

async function advance1000Seconds() {
  return await advanceX(1000);
}

export {
  advanceAnHour,
  advanceADay,
  advanceAMonth,
  advanceAYear,
  advance1000Seconds,
  aYearFromNow,
};
