// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../../external/chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

import "../interfaces/IPriceOracle.sol";

contract ChainlinkPriceOracle is IPriceOracle {
    AggregatorV3Interface private _oracle;

    constructor(AggregatorV3Interface oracle) {
        _oracle = oracle;
    }

    function price() external view override returns (uint256) {
        (, int256 latestPrice, , , ) = _oracle.latestRoundData();
        require(latestPrice >= 0, "VE:latestPrice");
        return uint256(latestPrice);
    }

    function decimals() external view override returns (uint8) {
        return _oracle.decimals();
    }
}
