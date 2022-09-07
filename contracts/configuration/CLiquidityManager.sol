// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./Configurable.sol";

contract CLiquidityManager is Configurable {
    struct ConstructorParams {
        address modlAddress;
        address usdcAddress;
        uint256 launchLiquidity;
    }
}
