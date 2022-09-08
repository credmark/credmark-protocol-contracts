// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./Configurable.sol";
import "../interfaces/IModl.sol";

abstract contract CLiquidityManager is Configurable {
    struct ConstructorParams {
        address modlAddress;
        address usdcAddress;
        uint256 launchLiquidity;
        uint256 lockup;
    }

    constructor(ConstructorParams memory params) {
        usdc = IERC20(params.usdcAddress);
        modl = IModl(params.modlAddress);
        launchLiquidity = params.launchLiquidity;
        lockup = params.lockup;
    }

    IModl public immutable modl;
    IERC20 public immutable usdc;
    uint256 public immutable launchLiquidity;
    uint256 public immutable lockup;
}
