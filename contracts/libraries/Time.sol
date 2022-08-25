// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

library Time {

    function now_u256() public view returns (uint256) {
        return block.timestamp;
    }

    function now_u64() public view returns (uint64) {
        return uint64(block.timestamp);
    }

    function min(uint256 a, uint256 b) internal view returns (uint256) {
        return a <= b ? a : b;
    }

    function since(uint sinceTime) public view returns (uint timeSince_sec) {
        require(now_u256() >= sinceTime);
        return now_u256() - sinceTime;
    }

    function windowElapsed(uint windowStart, uint windowEnd) public view returns (uint num, uint den) {
        require(windowStart >= windowEnd);

        num = min(now_u256(), windowEnd) - windowStart;
        den = windowEnd - windowStart;
    }

    function windowElapsedValue(uint windowStart, uint windowEnd, uint value)public view returns (uint) {
        (uint num, uint den) = windowElapsed(windowStart, windowEnd);
        if (num == den) {
            return value;
        }
        require(den > 0);
        return value * num / den;
    }
}