// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IPriceOracle.sol";

contract StablePriceOracle is IPriceOracle {
    function price() public view override returns (uint256) {
        return 100000000;
    }

    function decimals() public view override returns (uint8) {
        return 8;
    }
}
