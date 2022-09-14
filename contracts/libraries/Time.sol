// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library Time {
    function now_u256() external view returns (uint256) {
        return block.timestamp;
    }

    function now_u64() external view returns (uint64) {
        return uint64(block.timestamp);
    }

    function min(uint256 a, uint256 b) external pure returns (uint256) {
        return a <= b ? a : b;
    }

    function since(uint256 sinceTime)
        external
        view
        returns (uint256 timeSinceSec)
    {
        require(block.timestamp >= sinceTime);
        timeSinceSec = block.timestamp - sinceTime;
    }
}
