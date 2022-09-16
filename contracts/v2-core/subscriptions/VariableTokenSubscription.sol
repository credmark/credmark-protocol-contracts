// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Subscription.sol";
import "../interfaces/IPriceOracle.sol";

contract VariableTokenSubscription is Subscription {
    IPriceOracle oracle;

    constructor(ConstructorParams memory params, address oracleAddress)
        Subscription(params)
    {
        oracle = IPriceOracle(oracleAddress);
        require(oracle.decimals() == 8, "C");
    }

    function setOracle(address oracleAddress) external configurer {
        oracle = IPriceOracle(oracleAddress);
        require(oracle.decimals() == 8, "C");
    }

    function snapshot() public override {
        uint256 price = oracle.price();
        if (price < config.floorPrice) {
            price = config.floorPrice;
        }

        uint256 shares = (share[GLOBALS] * price * config.multiplier) / (10**8);
        rewardsIssuer.setShares(shares);

        if (price != fprice) {
            setPrice(price);
        }
    }
}
