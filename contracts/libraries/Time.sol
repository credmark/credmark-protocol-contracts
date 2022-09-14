// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library Time {
    function current() external view returns (uint256) {
        return block.timestamp;
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
