import { BigNumber } from 'ethers';

declare global {
  export interface Number {
    toBN: (decimals?: number) => BigNumber;
    toBN18: () => BigNumber;
  }
}

declare module 'ethers' {
  export interface BigNumber {
    scaledInt: (decimals?: number) => number;
  }
}

BigNumber.prototype.scaledInt = function (decimals = 0) {
  return Math.floor(this.div(BigNumber.from(10).pow(decimals)).toNumber());
};

// eslint-disable-next-line no-extend-native
Number.prototype.toBN = function (decimals = 18): BigNumber {
  return BigNumber.from(this).mul(BigNumber.from(10).pow(decimals));
};

// eslint-disable-next-line no-extend-native
Number.prototype.toBN18 = function () {
  return this.toBN(18);
};
