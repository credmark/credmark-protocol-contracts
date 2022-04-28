// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./interfaces/IProduct.sol";
import "./interfaces/IRewards.sol";
import "./interfaces/IPool.sol";
import "./cursors/DepositCursor.sol";

contract Pool is AccessControl, IPool {
    using SafeERC20 for IERC20;

    IProduct product;
    IRewards reward;

    IERC20 depositToken;

    DepositCursor cursor;

    uint256 lockup;
    bool subscribable;
    mapping(address => uint256) feeCursor;

    constructor(
        uint256 multiplier_,
        uint256 lockupSeconds_,
        bool subscribable_,
        IERC20 depositToken_,
        IProduct product_,
        IRewards rewards_
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        lockup = lockupSeconds_;
        subscribable = subscribable_;
        depositToken = depositToken_;
        reward = rewards_;
        product = product_;

        cursor = new DepositCursor();
    }

    function deposit(uint256 amount) external override {
        depositToken.transferFrom(msg.sender, address(this), amount);

        uint256 previousDeposit = cursor.getDeposit(msg.sender);

        if (previousDeposit == 0) {
            product.updatePrice(address(depositToken));
            feeCursor[msg.sender] = product.getFee(address(depositToken));
        }
        cursor.updateDeposit(msg.sender, previousDeposit + amount);
        reward.updateShares(cursor.totalDeposits(), address(depositToken));
    }

    function exit() external override {
        if (getFee(msg.sender) < getDeposit(msg.sender)) {
            depositToken.transfer(
                msg.sender,
                getDeposit(msg.sender) - getFee(msg.sender)
            );
        }

        cursor.updateDeposit(msg.sender, 0);
        reward.updateShares(cursor.totalDeposits(), address(depositToken));
    }

    function claim() external override {
        reward.issueRewards(msg.sender, getRewards(msg.sender));
        cursor.reset(msg.sender);
    }

    function rebalance() external override {
        require(
            address(depositToken) == reward.rewardToken(),
            "cannot rebalance mismatched pools"
        );

        uint256 rewards = getRewards(msg.sender);
        reward.issueRewards(address(this), rewards);
        uint256 previousDeposit = cursor.getDeposit(msg.sender);

        cursor.updateDeposit(msg.sender, previousDeposit + rewards);
        reward.updateShares(cursor.totalDeposits(), address(depositToken));

        cursor.reset(msg.sender);
    }

    function pay(address token, uint256 amount) external override {
        uint256 fee = getFee(msg.sender);
        uint256 equivalentFee = product.getEquivalentAmount(
            address(depositToken),
            fee,
            token
        );
        require(equivalentFee >= amount, "Don't overpay, my dear");

        IERC20(token).transferFrom(msg.sender, address(this), amount);
        feeCursor[msg.sender] += ((amount * equivalentFee) / fee);
    }

    function setMultiplier(uint256 multiplier)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        reward.updateMultiplier(multiplier);
        reward.updateShares(cursor.totalDeposits(), address(depositToken));
    }

    function getDeposit(address addr) public view returns (uint256) {
        return cursor.getDeposit(addr);
    }

    function getFee(address addr) public view returns (uint256) {
        return product.getFee(address(depositToken)) - feeCursor[msg.sender];
    }

    function getRewards(address addr) public view returns (uint256) {
        (reward.getRewardsIssued() * cursor.getValue(addr)) / 10**36;
    }
}
