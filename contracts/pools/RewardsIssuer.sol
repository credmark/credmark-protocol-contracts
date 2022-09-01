// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "../token/IModl.sol";
import "../token/ModlAllowance.sol";
import "./accumulators/ShareAccumulator.sol";
import "../libraries/Time.sol";


contract RewardsIssuer is AccessControl {
    bytes32 public constant POOL_ROLE = keccak256("POOL_ROLE");

    IModl public token;
    ModlAllowance public modlAllowance;
    ShareAccumulator public accumulator;

    constructor(IModl token_, ModlAllowance modlAllowance_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        accumulator = new ShareAccumulator();
        accumulator.grantRole(accumulator.ACCUMULATOR_ROLE(), address(this));

        modlAllowance = modlAllowance_;
        token = token_;
    }

    function setShares(uint newShares) external onlyRole(POOL_ROLE) {
        accumulator.setShares(msg.sender, newShares);
    }

    function issue() external onlyRole(POOL_ROLE){
        uint totalAcc = accumulator.totalAccumulation();
        if (totalAcc == 0) {
            // This means that rewards were already issued in this block.
            // No Need to reissue.
            return;
        }
        modlAllowance.claim(address(this));
        token.transfer(
            msg.sender,
            accumulator.accumulation(msg.sender) * token.balanceOf(address(this)) / totalAcc);
        accumulator.removeAccumulation(msg.sender);
    }

    function getUnissuedRewards(address poolAddress) public view returns (uint amount) {
        uint totalAcc = accumulator.totalAccumulation();
        amount = totalAcc == 0 ? 0 : accumulator.accumulation(poolAddress) *
            (token.balanceOf(address(this)) + modlAllowance.claimableAmount(address(this))) /
            totalAcc;
    }
}