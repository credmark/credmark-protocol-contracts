// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Cursor is Ownable {

    uint256 public rate;
    bool public dilutive;

    struct CursorData {
        uint256 value;
        uint256 proportion;
        uint256 timestamp;
        uint256 accumulator;
    }

    mapping(address => CursorData) public cursors;

    constructor(bool dilutive_) {
        dilutive = dilutive_;
    }

    function setRate(uint rate_) external onlyOwner {
        rate = rate;
        if (dilutive) {
            cursors[address(0x0)] = CursorData(
                getValue(address(0x0)),
                cursors[address(0x0)].proportion,
                block.timestamp,
                getAccumulator(address(0x0))
            );
        }
    }

    function updateProportion(address addr, uint256 newProportion) external onlyOwner {
        uint256 newAccumulator = getAccumulator(addr);
        uint256 newCursor = dilutive ? getValue(address(0x0)) : getValue(addr);
        if(dilutive) {
            cursors[address(0x0)] = CursorData(
                newCursor,
                cursors[address(0x0)].proportion + newProportion - cursors[addr].proportion,
                block.timestamp,
                getAccumulator(address(0x0))
            );
        }
        cursors[addr] = CursorData(
                newCursor,
                newProportion,
                block.timestamp,
                newAccumulator
                );
    }

    function getValue(address addr) public view returns (uint256) {
        uint256 timeDelta = block.timestamp - cursors[address(addr)].timestamp;
        return cursors[address(addr)].value + ((timeDelta * rate) / cursors[address(addr)].proportion);
    }

    function getAccumulator(address addr) public view returns (uint256) {
        return dilutive ? (getValue(address(0x0)) - cursors[addr].value) *
            cursors[addr].proportion +
            cursors[addr].accumulator : 0;
    }

    function resetAccumulator(address addr) public onlyOwner {
        if (dilutive) {
            cursors[addr] = CursorData(
                getValue(address(0x0)),
                cursors[addr].proportion,
                block.timestamp,
                0
            );
        }
    }
}
