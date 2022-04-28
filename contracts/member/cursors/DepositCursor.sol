// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DepositCursor is Ownable {
    
    uint internal baseRate = 10**36;
    uint internal timestamp;
    uint internal sharesPerDeposit;
    uint public totalDeposits;

    struct DepositTimeCursor {
        uint accumulatedDeposit;
        uint sharesPerDeposit;
        uint deposit;
        uint timestamp;
    }

    mapping(address => DepositTimeCursor) depositorCursor;

    constructor() {
        timestamp = block.timestamp;
    }

    function updateDeposit(address depositor, uint newDeposit) external {
        uint newSharesPerDeposit = getValue();
        uint newAccumulatedDeposit = getValue(depositor);

        totalDeposits += newDeposit - depositorCursor[depositor].deposit;
        timestamp = block.timestamp;
        sharesPerDeposit = newSharesPerDeposit;
        depositorCursor[depositor] = DepositTimeCursor(newAccumulatedDeposit, newSharesPerDeposit, newDeposit, block.timestamp);
    }

    function getValue() public view returns (uint) {
        uint timeDelta = block.timestamp - timestamp;
        return sharesPerDeposit + (timeDelta * baseRate / totalDeposits);
    }

    function getValue(address depositor) public view returns (uint) {
        return (getValue() - depositorCursor[depositor].sharesPerDeposit) *
        depositorCursor[depositor].deposit + depositorCursor[depositor].accumulatedDeposit;
    }

    function getDeposit(address depositor) public view returns (uint) {
        return depositorCursor[depositor].deposit;
    }

    function reset(address depositor) public {
        depositorCursor[depositor] = DepositTimeCursor(0, getValue(), depositorCursor[depositor].deposit, block.timestamp);
    }
}
