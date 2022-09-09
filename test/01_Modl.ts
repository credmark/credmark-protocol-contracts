import { ethers, waffle } from "hardhat";
import { expect, use } from "chai";

use(waffle.solidity);

import { setupProtocol, MODL } from "./helpers/contracts";
import { setupUsers } from "./helpers/users";

describe("Modl.sol", () => {
  before(async () => {
    await setupProtocol();
    await setupUsers();
  });

  it("Modl: totalSupply should initialize to 0", async () => {
    let totalSupply = await MODL.functions.totalSupply();
    expect(totalSupply.toString()).to.equal("0");
  });
});
