// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IRevenueTreasury.sol";
import "../configuration/Permissioned.sol";
import "../configuration/CRevenueTreasury.sol";

contract RevenueTreasury is IRevenueTreasury, CRevenueTreasury {
    using SafeERC20 for IERC20;

    constructor(ConstructorParams memory params) CRevenueTreasury(params) {}

    function settle(address tokenAddress) external override manager configured {
        if (tokenAddress == address(modl)) {
            uint256 modlPctToBurn = 100 - config.modlPercentToDao;
            modl.burn((modl.balanceOf(address(this)) * modlPctToBurn) / 100);
        }
        uint256 amount = IERC20(tokenAddress).balanceOf(address(this));
        IERC20(tokenAddress).safeTransfer(config.daoAddress, amount);
        require(amount > 0, "RevenueTreasury:ZERO_BALANCE");
    }

    function settle(address tokenAddress, uint256 tokenId)
        external
        override
        manager
        configured
    {
        IERC721(tokenAddress).safeTransferFrom(
            address(this),
            config.daoAddress,
            tokenId
        );
    }
}
