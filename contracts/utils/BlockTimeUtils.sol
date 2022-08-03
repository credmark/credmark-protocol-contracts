// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

abstract contract BlockTimeUtils {

    function _blocktime() internal view returns (uint) {
        return block.timestamp;
    }

    function _blocktime64() internal view returns (uint64) {
        return uint64(block.timestamp);
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a <= b ? a : b;
    }

    function elapsed(uint start, uint end) view internal returns (uint percent, uint8 decimals, bool divz) {
        decimals = 18;
        percent = 0;
        divz = false;
        if (start == end){
            divz = true;
        } else {
            percent = ( min(_blocktime(), end) - start ) * (10 ** decimals) / (end - start);
        }
    }

    function elapsedWithScalar(uint start, uint end, uint scalar) view internal returns (uint) {
        (uint percent, uint8 decimals, bool divz) = elapsed(start, end);
        if (divz) {
            return scalar;
        } else {
            return scalar * percent / 10 ** 18;
        }
    }
}