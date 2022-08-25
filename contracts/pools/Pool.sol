// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./accumulators/ShareAccumulator.sol";
import "./accumulators/PriceAccumulator.sol";

import "../libraries/Time.sol";

contract Pool is AccessControl {
    using SafeERC20 for IERC20;

    IERC20 depositToken;

    ShareAccumulator depositAccumulator;
    ShareAccumulator rewardsAccumulator;
    PriceAccumulator priceAccumulator;
    address revenueTreasury;

    mapping(address => uint256) priceAccumulatorOffset;

    uint256 lockup;
    uint256 multiplier;
    bool subscribable;
    uint256 monthlyFee;

    constructor(
        uint256 multiplier_,
        uint256 lockupSeconds_,
        uint256 monthlyFee_,
        bool subscribable_,
        IERC20 depositToken_,
        ShareAccumulator rewardsAccumulator_,
        PriceAccumulator priceAccumulator_
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        lockup = lockupSeconds_;
        multiplier = multiplier_;
        subscribable = subscribable_;
        depositToken = depositToken_;
        monthlyFee = monthlyFee_;

        rewardsAccumulator = rewardsAccumulator_;
        priceAccumulator = priceAccumulator_;

        depositAccumulator = new ShareAccumulator();
        depositAccumulator.grantRole(depositAccumulator.ACCUMULATOR_ROLE(), address(this));

    }

    function depositTokenPrice() public view returns (uint price, uint8 decimals) {
        return (100000000, 8);
    }

    function deposit(uint256 amount) external {
        depositToken.transferFrom(msg.sender, address(this), amount);

        (uint price, uint8 decimals) = depositTokenPrice();

        depositAccumulator.setShares(msg.sender, depositAccumulator.getShares(msg.sender) + amount);
        rewardsAccumulator.setShares(
            address(this), depositToken.balanceOf(address(this)) * price * multiplier / (10**decimals));
        priceAccumulator.setPrice(address(depositToken), price);

        if (priceAccumulatorOffset[msg.sender] == 0){
            priceAccumulatorOffset[msg.sender] = priceAccumulator.getOffset(address(depositToken));
        }
    }

    function exit() external {
        require(depositAccumulator.getShares(msg.sender) > 0, "CMERR: no deposit");
        (uint price, uint8 decimals) = depositTokenPrice();
        if (getFee(msg.sender) < depositAccumulator.getShares(msg.sender)) {
            depositToken.transfer(
                msg.sender,
                depositAccumulator.getShares(msg.sender) - getFee(msg.sender)
            );
        }

        depositAccumulator.setShares(msg.sender, 0);
        rewardsAccumulator.setShares(
            address(this), depositToken.balanceOf(address(this)) * price * multiplier / (10**decimals));
    }


    function getDeposit(address addr) public view returns (uint) {
        return depositAccumulator.shares(addr);
    }

    function getFee(address addr) public view returns (uint256) {
        return (priceAccumulator.getOffset(address(depositToken)) - priceAccumulatorOffset[addr]) * monthlyFee / (30 * 24 * 60 * 60);
    }

    function getRewards(address addr) public view returns (uint256) {
        return (
            rewardsAccumulator.accumulation(address(this)) /
            rewardsAccumulator.totalAccumulation()
        );
    }

}
