// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import "../interfaces/IMembershipProduct.sol";
import "../interfaces/IMembershipRewards.sol";
import "../interfaces/IMembershipPool.sol";

contract MembershipPool is AccessControl, IMembershipPool {

    IERC20 poolBaseToken;

    IMembershipProduct product;
    IMembershipRewards reward;

    uint private poolRewardsMultiplier;
    uint private poolLockupSeconds;
    bool private poolSubscribable;


    uint internal totalDeposits_n;

    uint internal RI_dep_n;
    uint internal RI_n;
    uint internal ts_n;

    mapping (uint => uint) nft_deposits;
    mapping (uint => uint) nft_FA_m;
    mapping (uint => uint) nft_RI_dep_m;
    mapping (uint => uint) nft_RA_m;

    constructor (
        uint256 multiplier,
        uint256 lockupSeconds,
        bool subscribable,
        IERC20 baseToken
        )
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);

        poolRewardsMultiplier = multiplier;
        poolLockupSeconds = lockupSeconds;
        poolSubscribable = subscribable;
        poolBaseToken = baseToken;
    }

    function setPoolProduct(IMembershipProduct productContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        product = productContract;
    }

    function setPoolRewards(IMembershipRewards rewardsContract) external onlyRole(DEFAULT_ADMIN_ROLE) {
        reward = rewardsContract;
    }

    function getFeesAccumulated(uint tokenId) public view returns(uint) {
        return product.getFeeCursor_tokens(poolBaseToken) - nft_FA_m[tokenId];
    }

    function getRewardsAccumulated(uint tokenId) public view returns(uint) {
        return (RI_dep_t() - nft_RI_dep_m[tokenId]) * nft_deposits[tokenId] + nft_RA_m[tokenId];
    }

    function deposit(uint tokenId, uint amount) override public {
        if (nft_deposits[tokenId] == 0) {
            nft_FA_m[tokenId] = product.getFeeCursor_tokens(poolBaseToken);
        }

        nft_deposits[tokenId] += amount;
        nft_RA_m[tokenId] = getRewardsAccumulated(tokenId);
        _updateTotalDeposits(amount, true);
    }

    function exit(uint tokenId) override public {
        uint fees = getFeesAccumulated(tokenId);
        uint rewards = getRewardsAccumulated(tokenId);
        uint deposits = nft_deposits[tokenId];

        nft_deposits[tokenId] = 0;
        _updateTotalDeposits(deposits, false);
    }

    function claim(uint tokenId, uint amount) override public {
        require(amount <= getRewardsAccumulated(tokenId), "");
        nft_RA_m[tokenId] -= amount;
    }

    function rebalance(uint tokenId) override public {
        // REquire basetoken == rewards token
        uint rewards = getRewardsAccumulated(tokenId);
        nft_RA_m[tokenId] = 0;
        nft_deposits[tokenId] += rewards;
        _updateTotalDeposits(rewards, true);
    }

    function _updateTotalDeposits(uint amount, bool add) internal {
        if (add) {
            totalDeposits_n += amount;
        } else {
            totalDeposits_n -= amount;
        }
        
        RI_dep_n = RI_dep_t();
        RI_n = reward.getPoolRewardsIssued(this);
        reward.updateShares(this);
        ts_n = block.timestamp;
        product.updateFeeCursor(poolBaseToken);
    }

    function getBaseToken() external view override returns (IERC20) {
        return poolBaseToken;
    }

    function getTotalDeposits() external view override returns (uint) {
        return totalDeposits_n;
    }

    function getMultiplier() external view override returns (uint) {
        return poolRewardsMultiplier;
    }

    function RI_dep_t() internal view returns (uint) {
        return ((reward.getPoolRewardsIssued(this) - RI_n) / totalDeposits_n) + RI_dep_n;
    }

}