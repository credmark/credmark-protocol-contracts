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
import "../interfaces/IPriceOracle.sol";

contract GenericSubscription is
    ISubscription,
    CSubscription,
    ShareAccumulator,
    PriceAccumulator
{
    using SafeERC20 for IERC20;

    constructor(ConstructorParams memory params) CSubscription(params) {}

    mapping(address => uint256) internal lockupExpiration;

    uint256 constant MONTH_SEC = (30 * 24 * 60 * 60);

    modifier canSubscribe() {
        require(
            config.subscribable || hasRole(MANAGER_ROLE, msg.sender),
            "Subscription:UNAUTHORIZED"
        );
        _;
    }

    modifier isUnlocked(address account) {
        require(
            Time.now_u256() > lockupExpiration[account],
            "Subscription:TIMELOCK"
        );
        _;
    }

    function deposit(address account, uint256 amount)
        external
        override
        canSubscribe
        configured
    {
        _deposit(account, amount);

        token.safeTransferFrom(msg.sender, address(this), amount);

        require(amount > 0, "Subscription:ZERO_BALANCE");
    }

    function exit(address account)
        external
        override
        isUnlocked(account)
        managerOr(account)
        configured
    {
        (uint256 amount, uint256 fee) = _exit(account);

        if (amount > 0) {
            token.safeTransfer(account, amount);
        }

        if (fee > 0) {
            token.safeTransfer(config.treasury, fee);
        }

        require(amount > 0 || fee > 0, "Subscription:ZERO_BALANCE");
        require(
            config.treasury != address(0),
            "Subscription:VALUE_ERROR:treasury"
        );
    }

    function claim(address account)
        external
        override
        managerOr(account)
        configured
    {
        uint256 claimAmount = _claim(account);
        token.safeTransfer(account, claimAmount);

        require(claimAmount > 0, "Subscription:ZERO_BALANCE");
    }

    function liquidate(address account) external override configured {
        uint256 liquidationAmount = _liquidate(account);
        token.safeTransfer(config.treasury, liquidationAmount);

        require(liquidationAmount > 0, "Subscription:ZERO_BALANCE");
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

    function clampedPrice()
        public
        view
        returns (uint256 price, uint8 decimals)
    {
        price = IPriceOracle(config.oracleAddress).price();
        decimals = IPriceOracle(config.oracleAddress).decimals();
        if (price < config.floorPrice) {
            price = config.floorPrice;
        }
        if (price > config.ceilingPrice && config.ceilingPrice != 0) {
            price = config.ceilingPrice;
        }
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
        fee = min(amount, fees(account));
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
        require(!solvent(account), "Subscription:VALUE_ERROR:solvent");
        (, amount) = _exit(account);

        emit Liquidate(account, msg.sender, amount);
    }

    function snapshot() public {
        (uint256 price, uint8 decimals) = clampedPrice();

        uint256 shares = (share[GLOBALS] * price * config.multiplier) /
            (10**decimals);

        if (rewardsIssuer.getShares(address(this)) != shares) {
            rewardsIssuer.setShares(shares);
        }

        if (price != fprice) {
            setPrice(price);
        }
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a <= b ? a : b;
    }
}
