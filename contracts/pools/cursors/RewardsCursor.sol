// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract RewardsCursor {
    /*
        For this Rewards Pool Cursor:

        globalValue is the integral of the total rewards issued per share over the duration of the token.

        base Rate is the issued rewards per second of the rewards token.
        globalTimestamp is the last timestamp that the globalValue was saved
        globalShares are the total number of SHARES that this Cursor is diluting between
        localValue is the last saved RI_sh_0_n 
     */

    uint256 baseRate;
    uint256 totalShares;
    uint256 rewardsIssuedPerShare;
    uint256 timestamp;

    struct PoolCursor {
        uint256 rewardsIssued;
        uint256 rewardsIssuedPerShare;
        uint256 shares;
        uint256 timestamp;
    }

    mapping(address => PoolCursor) internal poolCursor;

    constructor(uint256 _baseRate) {
        timestamp = block.timestamp;
        baseRate = _baseRate;
    }

    function updateShares(address pool, uint256 newShares) external {
        uint256 newRewardsIssuedPerShare = getRIpS();
        uint256 newRewardsIssued = getValue(pool);

        totalShares += newShares - poolCursor[pool].shares;
        timestamp = block.timestamp;
        rewardsIssuedPerShare = newRewardsIssuedPerShare;
        poolCursor[pool] = PoolCursor(
            newRewardsIssued,
            newRewardsIssuedPerShare,
            newShares,
            block.timestamp
        );
    }

    function updateBaseRate(uint256 newRate) external {
        baseRate = newRate;
    }

    function getValue(address pool) public view returns (uint256 value) {
        uint256 timeDelta = block.timestamp - poolCursor[pool].timestamp;
        value =
            poolCursor[pool].rewardsIssued +
            ((rewardsIssuedPerShare - poolCursor[pool].rewardsIssuedPerShare) *
                poolCursor[pool].shares);
    }

    function getRIpS() internal view returns (uint256 value) {
        uint256 timeDelta = block.timestamp - timestamp;
        value = rewardsIssuedPerShare + ((timeDelta * baseRate) / totalShares);
    }
}
