// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../../libraries/Time.sol";

/**
    @title PriceAccumulator
    @author Credmark
    @notice This contracts tracks the average price of a token over any time period.
    @dev This contract should be inherited by contracts that accumulate a linear rolling 
    price that differ's per account, as denoted by an address. This allows for second 
    by second cost averaging per account.
**/

abstract contract PriceAccumulator {
    /** 
        globals:
        decimals is the number of decimals in the price that is being set.
        fprice is the current accumulating price
        foffst is the last saved offset
        fsnapt is the timestamp of the last offset snapshot 
    **/

    uint256 internal fprice;
    uint256 internal foffst;
    uint256 internal fsnapt;

    /**
        @dev Any account's feeOffset can be subtracted by the current offset and multiplied by fee/sec to determine the average price per second that account has experienced.
    **/
    mapping(address => uint256) internal feeOffset;

    /**
        @notice snapshots the previous accumulation and sets a new price
        @dev by setting the price, you presume accumulation offset for the amount of time up to the newly set variable.
        @param newPrice The new price of the accumulating token
    **/
    function setPrice(uint256 newPrice) internal {
        foffst = currentFeeOffset();
        fprice = newPrice;
        fsnapt = Time.now_u256();
    }

    /** 
        @notice returns the offset for the block.timestamp
        @dev calculates the current offset
    **/
    function currentFeeOffset() internal view returns (uint256) {
        return
            fprice == 0
                ? foffst
                : (Time.since(fsnapt) * (10**8)) / fprice + foffst;
    }
}
