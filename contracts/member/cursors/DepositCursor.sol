// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DepositCursor is Ownable {
    uint256 internal baseRate = 10**36;
    uint256 internal timestamp;
    uint256 internal sharesPerDeposit;
    uint256 public totalDeposits;

    struct DepositTimeCursor {
        uint256 accumulatedDeposit;
        uint256 sharesPerDeposit;
        uint256 deposit;
        uint256 timestamp;
    }

    mapping(address => DepositTimeCursor) depositorCursor;

    constructor() {
        timestamp = block.timestamp;
    }

    function updateDeposit(address depositor, uint256 newDeposit) external {
        uint256 newSharesPerDeposit = getValue();
        uint256 newAccumulatedDeposit = getValue(depositor);

        totalDeposits += newDeposit - depositorCursor[depositor].deposit;
        timestamp = block.timestamp;
        sharesPerDeposit = newSharesPerDeposit;
        depositorCursor[depositor] = DepositTimeCursor(
            newAccumulatedDeposit,
            newSharesPerDeposit,
            newDeposit,
            block.timestamp
        );
    }

    function getValue() public view returns (uint256) {
        uint256 timeDelta = block.timestamp - timestamp;
        return sharesPerDeposit + ((timeDelta * baseRate) / totalDeposits);
    }

    function getValue(address depositor) public view returns (uint256) {
        return
            (getValue() - depositorCursor[depositor].sharesPerDeposit) *
            depositorCursor[depositor].deposit +
            depositorCursor[depositor].accumulatedDeposit;
    }

    function getDeposit(address depositor) public view returns (uint256) {
        return depositorCursor[depositor].deposit;
    }

    function reset(address depositor) public {
        depositorCursor[depositor] = DepositTimeCursor(
            0,
            getValue(),
            depositorCursor[depositor].deposit,
            block.timestamp
        );
    }
}
