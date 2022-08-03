// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../pools/interfaces/IPriceOracle.sol";

contract MockPriceOracle is IPriceOracle {
    uint8 mockDecimals = 8;
    uint256 mockPrice = 100000000;

    function set(uint256 price_, uint8 decimals_) external {
        mockDecimals = decimals_;
        mockPrice = price_;
    }

    function price() external view override returns (uint256) {
        return mockPrice;
    }

    function decimals() external view override returns (uint8) {
        return mockDecimals;
    }
}
