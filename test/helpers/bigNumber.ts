
declare global {
  export interface Number {
    toBN: (decimals?: number) => bigint;
    toBN18: () => bigint;
  }
  export interface BigInt {
    scaledInt: (decimals?: number) => number;
    toWei: (decimals?: number) => bigint;
  }
}

// ethers v6 returns native bigints, so the former BigNumber prototype
// helpers now extend BigInt.prototype.
BigInt.prototype.scaledInt = function (decimals = 0): number {
  const v = this.valueOf();
  if (decimals == 0) {
    return Number(v);
  }
  return Math.round(
    Number(v / 10n ** BigInt(decimals - 1)) / 10
  );
};

BigInt.prototype.toWei = function (decimals = 18): bigint {
  return this.valueOf() * 10n ** BigInt(decimals);
};

// eslint-disable-next-line no-extend-native
Number.prototype.toBN = function (decimals = 18): bigint {
  return BigInt(this) * BigInt(10) ** BigInt(decimals);
};

// eslint-disable-next-line no-extend-native
Number.prototype.toBN18 = function (): bigint {
  return this.toBN(18);
};
