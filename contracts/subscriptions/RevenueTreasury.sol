// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IModl.sol";

contract RevenueTreasury is AccessControl {
    using SafeERC20 for IERC20;
    uint256 public percentToBurned;
    address public recipient;
    IERC20 public token;

    constructor(
        uint256 pctToBurn_,
        address recipient_,
        IModl token_
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        configure(pctToBurn_, recipient_, token_);
    }

    function configure(
        uint256 pctToBurn_,
        address recipient_,
        IModl token_
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        percentToBurned = pctToBurn_;
        recipient = recipient_;
        token = token_;
    }

    function distribute() external {
        uint256 toBurn = (token.balanceOf(address(this)) * percentToBurned) /
            100;
        (bool success, ) = payable(address(token)).call(
            abi.encode(keccak256("burn(uint)"), toBurn)
        );
        require(success, "CMERR: burn failed");

        token.safeTransfer(recipient, token.balanceOf(address(this)));
    }
}
