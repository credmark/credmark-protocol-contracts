// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IPriceOracle.sol";
import "../interfaces/IMembershipPool.sol";
import "../interfaces/IMembershipRewards.sol";

contract MembershipRewards is AccessControl, IMembershipRewards {

    uint constant internal SECONDS_PER_MONTH = 60 * 60 * 24 * 30;

    IERC20 internal rewardToken;
    IMembershipPool[] internal pools;
    mapping(address => bool) internal supportedPool;

    mapping(address => IPriceOracle) internal oracles;

    uint internal RI_mo;
    uint internal totalShares_n;
    uint internal RI_sh_n;
    uint internal ts_n;
    mapping (address => uint) internal p_RI_m;
    mapping (address => uint) internal p_RI_sh_m;
    mapping (address => uint) internal p_shares_m;


    constructor (
        IERC20 rewardToken_,
        uint rewardRate_
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        rewardToken = rewardToken_;
        RI_mo = rewardRate_;
    }

    function setMonthlyRewardRate(uint rewardRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        RI_sh_n = RI_sh_t();
        ts_n = block.timestamp;
        RI_mo = rewardRate;
    }

    function initializePool(IMembershipPool pool, IPriceOracle oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (ts_n == 0){
            ts_n = block.timestamp;
        }
        oracles[address(pool.getBaseToken())] = oracle;
        pools.push(pool);
        supportedPool[address(pool)] = true;
    }

    function updateShares(IMembershipPool pool) public override {

        uint price = oracles[address(pool.getBaseToken())].price();
        uint decimals = oracles[address(pool.getBaseToken())].decimals();
        
        p_RI_m[address(pool)] = getPoolRewardsIssued(pool);
        RI_sh_n = RI_sh_t();
        p_RI_sh_m[address(pool)] = RI_sh_n;
        ts_n = block.timestamp;

        uint newShares = pool.getTotalDeposits() * price * pool.getMultiplier() / (10**decimals);
        totalShares_n = totalShares_n - p_shares_m[address(pool)] + newShares;
        p_shares_m[address(pool)] = newShares;
    }

    function getPoolRewardsIssued(IMembershipPool pool) public override view returns (uint) {
        return p_RI_m[address(pool)] + (RI_sh_t() - p_RI_sh_m[address(pool)]) * p_shares_m[address(pool)];
    }

    function getRewardsToken() external override view returns (IERC20) {
        return rewardToken;
    }

    function RI_sh_t() internal view returns (uint) {
        uint timeDelta = block.timestamp - ts_n;
        return (RI_mo * timeDelta / totalShares_n) + RI_sh_n;
    }
}