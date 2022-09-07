// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IModl.sol";
import "../configuration/CRevenueTreasury.sol";

contract RevenueTreasury is CRevenueTreasury {
    using SafeERC20 for IERC20;

    IModl public modl;

    constructor(ConstructorParams memory params) {
        modl = IModl(params.modlAddress);
    }

    function settle(address tokenAddress) external manager configured {
        if (tokenAddress == address(modl)) {
            uint256 modlPctToBurn = 100 - config.modlPercentToDao;
            modl.burn((modl.balanceOf(address(this)) * modlPctToBurn) / 100);
        }
        uint256 amount = IERC20(tokenAddress).balanceOf(address(this));
        IERC20(tokenAddress).safeTransfer(config.daoAddress, amount);
    }
}
