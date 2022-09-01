// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "./accumulators/ShareAccumulator.sol";
import "./accumulators/PriceAccumulator.sol";
import "./RewardsIssuer.sol";

import "../libraries/Time.sol";

contract Subscription is AccessControl {
    using SafeERC20 for IERC20;

    IERC20 depositToken;

    ShareAccumulator public depositAccumulator;
    PriceAccumulator public priceAccumulator;

    address revenueTreasury;
    RewardsIssuer rewardsIssuer;

    mapping(address => uint256) priceAccumulatorOffset;

    uint256 lockup;
    uint256 multiplier;
    bool subscribable;
    uint256 monthlyFee;
    uint constant MONTH_SEC = (30 * 24 * 60 * 60);

    uint totalDeposits;

    constructor(
        uint256 multiplier_,
        uint256 lockupSeconds_,
        uint256 monthlyFee_,
        bool subscribable_,
        IERC20 depositToken_,
        RewardsIssuer rewardsIssuer_,
        PriceAccumulator priceAccumulator_
    ) {
        lockup = lockupSeconds_;
        multiplier = multiplier_;
        subscribable = subscribable_;
        depositToken = depositToken_;
        monthlyFee = monthlyFee_;
        rewardsIssuer = rewardsIssuer_;

        priceAccumulator = priceAccumulator_;

        depositAccumulator = new ShareAccumulator();
        depositAccumulator.grantRole(depositAccumulator.ACCUMULATOR_ROLE(), address(this));

        //TEMPORARY
        revenueTreasury = msg.sender;
    }

    function deposit(uint256 amount) external {
        _deposit(msg.sender, amount);
    }

    function exit() external {
        _exit(msg.sender);
    }

    function claim() external {
        _claim(msg.sender);
    }

    function rebalance() external {
        _rebalance(msg.sender);
    }

    function liquidate(address account) external {
        _liquidate(account);
    }

    function depositTokenPrice() internal view returns (uint price, uint8 decimals) {
        return (100000000, 8);
    }

    function getDeposit(address account) public view returns (uint) {
        return depositAccumulator.getShares(account);
    }

    function getFee(address account) public view returns (uint256) {
        return (priceAccumulator.getOffset(address(depositToken)) - priceAccumulatorOffset[account]) * monthlyFee / MONTH_SEC;
    }

    function getRewards(address account) public view returns (uint256) {
        return totalRewards() * depositAccumulator.accumulation(account) / depositAccumulator.totalAccumulation();
    }

    function totalRewards() public view returns (uint256) {
        uint rewardsAmount = rewardsIssuer.getUnissuedRewards(address(this)) + IERC20(rewardsIssuer.token()).balanceOf(address(this));
        if (address(rewardsIssuer.token()) == address(depositToken)){
            rewardsAmount -= totalDeposits;
        }
        return rewardsAmount;
    }

    function solvent(address account) public view returns (bool) {
        return getDeposit(account) >= getFee(account);
    }

    function _deposit(address account, uint amount) internal {
        depositToken.transferFrom(account, address(this), amount);
        depositAccumulator.setShares(account, depositAccumulator.getShares(account) + amount);
        totalDeposits += amount;

        (uint price, uint8 decimals) = depositTokenPrice();

        rewardsIssuer.setShares(totalDeposits * price * multiplier / (10**decimals));
        priceAccumulator.setPrice(address(depositToken), price);

        if (priceAccumulatorOffset[account] == 0){
            priceAccumulatorOffset[account] = priceAccumulator.getOffset(address(depositToken));
        }
    }

    function _exit(address account) internal {
        require(depositAccumulator.getShares(account) > 0, "CMERR: no deposit");
        require(revenueTreasury != address(0), "CMERR: No revenue treasury set.");

        if (solvent(account)) {
            depositToken.transfer(
                revenueTreasury,
                getFee(account)
            );
            depositToken.transfer(
                account,
                getDeposit(account) - getFee(account)
            );
        } else {
            depositToken.transfer(
                revenueTreasury,
                getDeposit(account)
            );
        }
        (uint price, uint8 decimals) = depositTokenPrice();

        totalDeposits -= getDeposit(account);

        depositAccumulator.setShares(account, 0);

        rewardsIssuer.setShares(totalDeposits * price * multiplier / (10**decimals));
        priceAccumulatorOffset[account] = 0;
    }

    function _claim(address account) internal {
        rewardsIssuer.issue();

        IERC20(rewardsIssuer.token()).transfer(account, getRewards(account));
        depositAccumulator.removeAccumulation(account);
    }

    function _rebalance(address account) internal {
        rewardsIssuer.issue();

        _deposit(account, getRewards(account));
        depositAccumulator.removeAccumulation(account);
    }

    function _liquidate(address account) internal {
        require(!solvent(account), "CMERR: Cannot liquidate solvent subscriptions.");
        _exit(account);
    }
}
