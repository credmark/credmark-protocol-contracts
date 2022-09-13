// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../configuration/CSubscription.sol";

import "./accumulators/ShareAccumulator.sol";
import "./accumulators/PriceAccumulator.sol";

import "../libraries/Time.sol";

import "../interfaces/ISubscription.sol";
import "../interfaces/ISubscriptionRewardsIssuer.sol";

abstract contract Subscription is
    ISubscription,
    CSubscription,
    ShareAccumulator,
    PriceAccumulator
{
    using SafeERC20 for IERC20;

    constructor(ConstructorParams memory params) CSubscription(params) {}

    mapping(address => uint256) internal lockupExpiration;

    uint256 constant MONTH_SEC = (30 * 24 * 60 * 60);

    function deposit(uint256 amount) external override configured {
        _deposit(msg.sender, amount);

        token.safeTransferFrom(msg.sender, address(this), amount);

        require(amount > 0, "ZB");
    }

    function exit() external override {
        require(Time.now_u256() > lockupExpiration[msg.sender], "TL");
        (uint256 amount, uint256 fee) = _exit(msg.sender);

        if (amount > 0) {
            token.safeTransfer(msg.sender, amount);
        }

        if (fee > 0) {
            token.safeTransfer(config.treasury, fee);
        }

        require(amount > 0 || fee > 0, "ZB");
    }

    function claim() external override {
        uint256 amount = _claim(msg.sender);
        IERC20(rewardsIssuer.token()).safeTransfer(msg.sender, amount);

        require(amount > 0, "ZB");
    }

    function liquidate(address account) external override {
        uint256 amount = _liquidate(account);
        token.safeTransfer(config.treasury, amount);

        require(amount > 0, "ZB");
    }

    function deposits(address account) public view override returns (uint256) {
        return share[account];
    }

    function fees(address account) public view override returns (uint256) {
        return
            ((currentFeeOffset() - feeOffset[account]) * config.fee) /
            MONTH_SEC;
    }

    function rewards(address account) public view override returns (uint256) {
        return
            accumulation(
                account,
                rewardsIssuer.getUnissuedRewards(address(this))
            );
    }

    function solvent(address account)
        public
        view
        virtual
        override
        returns (bool)
    {
        return deposits(account) >= fees(account);
    }

    function totalDeposits() public view returns (uint256) {
        return share[GLOBALS];
    }

    function _deposit(address account, uint256 amount)
        internal
        returns (uint256)
    {
        _accumulate(rewardsIssuer.issue());
        _setShares(account, share[account] + amount);

        snapshot();

        if (feeOffset[account] == 0) {
            feeOffset[account] = currentFeeOffset();
            lockupExpiration[account] = Time.now_u256() + config.lockup;
        }

        emit Deposit(account, amount);
        return amount;
    }

    function _exit(address account)
        internal
        returns (uint256 amount, uint256 fee)
    {
        amount = deposits(account);
        fee = Time.min(amount, fees(account));
        amount -= fee;

        _accumulate(rewardsIssuer.issue());
        _setShares(account, 0);

        feeOffset[account] = 0;

        snapshot();

        emit Exit(account, amount, fee);
    }

    function _claim(address account) internal returns (uint256 amount) {
        _accumulate(rewardsIssuer.issue());

        amount = _removeAccumulation(account);

        emit Claim(account, amount);
    }

    function _liquidate(address account)
        internal
        virtual
        returns (uint256 amount)
    {
        require(!solvent(account), "VE:solvent");
        (, amount) = _exit(account);

        emit Liquidate(account, msg.sender, amount);
    }

    function snapshot() public virtual {}
}
