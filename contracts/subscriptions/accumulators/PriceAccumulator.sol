// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../../libraries/Time.sol";

abstract contract PriceAccumulator {
    uint8 internal constant decimals = 8;

    uint256 internal fprice;
    uint256 internal foffst;
    uint256 internal fsnapt;

    mapping(address => uint256) internal feeOffset;

    function setPrice(uint256 newPrice) internal {
        foffst = currentFeeOffset();
        fprice = newPrice;
        fsnapt = Time.now_u256();
    }

    function currentFeeOffset() internal view returns (uint256) {
        return
            fprice == 0
                ? foffst
                : (Time.since(fsnapt) * (10**decimals)) / fprice + foffst;
    }
}
