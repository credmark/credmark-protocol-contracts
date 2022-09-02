// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "../accumulators/ShareAccumulator.sol";
import "../accumulators/PriceAccumulator.sol";

import "../libraries/Time.sol";

import "../interfaces/IRewardsIssuer.sol";
import "../interfaces/ISubscription.sol";
import "../interfaces/IRewardsIssuer.sol";
import "../interfaces/IPriceOracle.sol";

contract BaseSubscription is ISubscription, AccessControl {
    using SafeERC20 for IERC20;

    IERC20 token;
    IRewardsIssuer internal rewardsIssuer;
    IPriceOracle internal oracle;

    ShareAccumulator internal depositAccumulator;
    PriceAccumulator internal priceAccumulator;
    address internal revenueTreasury;

    mapping(address => uint256) internal feeOffset;
    mapping(address => uint256) internal lockupExpiration;

    SubscriptionConfiguration public config;
    uint256 constant MONTH_SEC = (30 * 24 * 60 * 60);

    uint256 totalDeposits;

    modifier isSubscribable() {
        require(
            config.subscribable || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "CMERR: Not Subscribable"
        );
        _;
    }

    modifier lockup(address account) {
        require(
            Time.now_u256() > lockupExpiration[account],
            "CMERR: Lockup in effect"
        );
        _;
    }

    modifier subscriptionOwner(address account) {
        require(
            msg.sender == account || hasRole(DEFAULT_ADMIN_ROLE, msg.sender)
        );
        _;
    }

    constructor(
        IERC20 token_,
        IRewardsIssuer rewardsIssuer_,
        IPriceOracle oracle_,
        address revenueTreasury_
    ) {
        token = token_;
        oracle = oracle_;
        rewardsIssuer = rewardsIssuer_;
        revenueTreasury = revenueTreasury_;

        depositAccumulator = new ShareAccumulator();
        priceAccumulator = new PriceAccumulator();
    }

    function deposit(address account, uint256 amount)
        external
        override
        isSubscribable
    {
        _deposit(account, amount);
    }

    function exit(address account)
        external
        override
        lockup(account)
        subscriptionOwner(account)
    {
        _exit(account);
    }

    function claim(address account)
        external
        override
        subscriptionOwner(account)
    {
        _claim(account);
    }

    function liquidate(address account) external override {
        _liquidate(account);
    }

    function deposits(address account) public view override returns (uint256) {
        return depositAccumulator.shares(account);
    }

    function fees(address account) public view override returns (uint256) {
        return
            ((priceAccumulator.offset() - feeOffset[account]) * config.fee) /
            MONTH_SEC;
    }

    function rewards(address account) public view override returns (uint256) {
        return
            (totalRewards() * depositAccumulator.accumulation(account)) /
            depositAccumulator.totalAccumulation();
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

    function totalRewards() internal view virtual returns (uint256) {
        return
            rewardsIssuer.getUnissuedRewards(address(this)) +
            IERC20(rewardsIssuer.token()).balanceOf(address(this));
    }

    function _feePrice() internal view returns (uint256 price, uint8 decimals) {
        (price, decimals) = _tokenPrice();
        if (price < config.floorPrice) {
            price = config.floorPrice;
        }
        if (price > config.ceilingPrice && config.ceilingPrice != 0) {
            price = config.ceilingPrice;
        }
    }

    function _tokenPrice()
        internal
        view
        returns (uint256 price, uint8 decimals)
    {
        return (oracle.price(), oracle.decimals());
    }

    function _deposit(address account, uint256 amount) internal {
        require(amount > 0, "CMERR: deposit amount 0");

        token.safeTransferFrom(msg.sender, address(this), amount);

        depositAccumulator.setShares(
            account,
            depositAccumulator.shares(account) + amount
        );
        totalDeposits += amount;
        if (feeOffset[account] == 0) {
            feeOffset[account] = priceAccumulator.offset();
            lockupExpiration[account] = Time.now_u256() + config.lockup;
        }
        snapshot();
    }

    function _exit(address account) internal {
        require(depositAccumulator.shares(account) > 0, "CMERR: no deposit");
        require(
            revenueTreasury != address(0),
            "CMERR: No revenue treasury set."
        );

        if (solvent(account)) {
            token.safeTransfer(revenueTreasury, fees(account));
            token.safeTransfer(account, deposits(account) - fees(account));
        } else {
            token.safeTransfer(revenueTreasury, deposits(account));
        }

        totalDeposits -= deposits(account);

        depositAccumulator.setShares(account, 0);

        feeOffset[account] = 0;

        snapshot();
    }

    function _claim(address account) internal {
        rewardsIssuer.issue();

        bool success = IERC20(rewardsIssuer.token()).transfer(
            account,
            rewards(account)
        );
        require(success, "CMERR: Transfer failed");

        depositAccumulator.removeAccumulation(account);
    }

    function _liquidate(address account) internal virtual {
        require(
            !solvent(account),
            "CMERR: Cannot liquidate solvent subscriptions."
        );
        _exit(account);
    }

    function snapshot() public {
        (uint256 price, uint8 decimals) = _feePrice();

        uint256 shares = (totalDeposits * price * config.multiplier) /
            (10**decimals);

        if (shares != rewardsIssuer.getShares(address(this))) {
            rewardsIssuer.setShares(shares);
        }

        if (price != priceAccumulator.price()) {
            priceAccumulator.setPrice(price);
        }
    }

    function configure(SubscriptionConfiguration memory config_)
        public
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        config = config_;
    }
}
