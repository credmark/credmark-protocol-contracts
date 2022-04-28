// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ModlMint.sol";

contract Vesting is AccessControl {

    ModlMint minter;

    uint startedAt;

    struct VestingState {
        uint totalAmount;
        uint startTime;
        uint endTime;
        uint claimed;
    }

    mapping (address => VestingState) vestingStates;

    modifier started() {
        require(startedAt > 0);
        _;
    }

    constructor(ModlMint minter_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        minter = minter_;
    }

    function start() external onlyRole(DEFAULT_ADMIN_ROLE) {
        startedAt = block.timestamp;
    }

    function claim(address addr) public {
        require(msg.sender == addr || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Cannot claim for other people.");
        minter.mint(addr, claimable(addr));
    } 

    function claimable(address addr) public returns (uint) {

        if (block.timestamp > vestingStates[addr].endTime) {

        }
    }
}