// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

library Time {
    function now_u256() public view returns (uint256) {
        return block.timestamp;
    }

    function now_u64() public view returns (uint64) {
        return uint64(block.timestamp);
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a <= b ? a : b;
    }

    function since(uint256 sinceTime)
        public
        view
        returns (uint256 timeSince_sec)
    {
        require(now_u256() >= sinceTime);
        return now_u256() - sinceTime;
    }
}
