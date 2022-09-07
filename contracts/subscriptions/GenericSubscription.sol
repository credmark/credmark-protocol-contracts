// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

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

    IERC20 token;
    ISubscriptionRewardsIssuer internal rewardsIssuer;
    IPriceOracle internal oracle;

    mapping(address => uint256) internal lockupExpiration;

    uint256 constant MONTH_SEC = (30 * 24 * 60 * 60);

    modifier canSubscribe() {
        require(
            config.subscribable || hasRole(MANAGER_ROLE, msg.sender),
            "CMERR: Not Subscribable"
        );
        _;
    }

    modifier isUnlocked(address account) {
        require(
            Time.now_u256() > lockupExpiration[account],
            "CMERR: Lockup in effect"
        );
        _;
    }

    constructor(ConstructorParams memory params) {
        token = IERC20(params.tokenAddress);
        rewardsIssuer = ISubscriptionRewardsIssuer(params.rewardsIssuerAddress);
    }

    function deposit(address account, uint256 amount)
        external
        override
        canSubscribe
        configured
    {
        uint256 depositAmount = _deposit(account, amount);

        token.safeTransferFrom(msg.sender, address(this), depositAmount);

        require(depositAmount > 0, "CMERR: No deposit amount");
    }

    function exit(address account)
        external
        override
        isUnlocked(account)
        managerOr(account)
        configured
    {
        (uint256 accountAmount, uint256 treasuryAmount) = _exit(account);

        if (accountAmount > 0) {
            token.safeTransfer(account, accountAmount);
        }

        if (treasuryAmount > 0) {
            token.safeTransfer(config.treasury, treasuryAmount);
        }

        require(accountAmount > 0 || treasuryAmount > 0, "CMERR: no deposit.");
        require(config.treasury != address(0), "CMERR: no treasury");
    }

    function claim(address account)
        external
        override
        managerOr(account)
        configured
    {
        uint256 claimAmount = _claim(account);
        token.safeTransfer(account, claimAmount);

        require(claimAmount > 0, "CMERR: No Rewards.");
    }

    function liquidate(address account) external override configured {
        uint256 liquidationAmount = _liquidate(account);
        token.safeTransfer(config.treasury, liquidationAmount);

        require(liquidationAmount > 0, "CMERR: Nothing to liquidate.");
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
        returns (uint256 depositTransferAmount)
    {
        _accumulate(rewardsIssuer.issue());
        _setShares(account, share[account] + amount);

        snapshot();

        if (feeOffset[account] == 0) {
            feeOffset[account] = currentFeeOffset();
            lockupExpiration[account] = Time.now_u256() + config.lockup;
        }
        return amount;
    }

    function _exit(address account)
        internal
        returns (uint256 accountAmount, uint256 treasuryAmount)
    {
        treasuryAmount = min(fees(account), deposits(account));
        accountAmount = deposits(account) - treasuryAmount;

        _accumulate(rewardsIssuer.issue());
        _setShares(account, 0);

        feeOffset[account] = 0;

        snapshot();
    }

    function _claim(address account) internal returns (uint256 claimAmount) {
        _accumulate(rewardsIssuer.issue());
        return _removeAccumulation(account);
    }

    function _liquidate(address account)
        internal
        virtual
        returns (uint256 treasuryAmount)
    {
        require(
            !solvent(account),
            "CMERR: Cannot liquidate solvent subscriptions."
        );
        (, treasuryAmount) = _exit(account);
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
