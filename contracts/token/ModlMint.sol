// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Token.sol";

contract ModlMint is AccessControl {

    uint constant SECONDS_PER_ANNUM = 60 * 60 * 24 * 365;

    mapping(address => uint) registrationTimestamp;
    mapping(address => uint) annualMintLimit;
    mapping(address => uint) mintEndTime;
    mapping(address => uint) minted;

    Token modl;

    constructor (Token _modl) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        modl = _modl;
    }

    function registerMinter(address minter, uint limit, uint endTime) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registrationTimestamp[minter] = block.timestamp;
        annualMintLimit[minter] = limit;
        mintEndTime[minter] = endTime;
    }

    function mint(address recipient, uint amount) external {
        require(amount < mintable(msg.sender), "");
        modl.mint(recipient, amount);
        minted[msg.sender] += amount;
    }

    function mintable(address minter) public view returns (uint) {
        uint endTime = mintEndTime[minter];
        if (block.timestamp < mintEndTime[minter]) {
            endTime = block.timestamp;
        }
        return annualMintLimit[minter] * (endTime - registrationTimestamp[minter]) / SECONDS_PER_ANNUM - minted[minter];
    }
}