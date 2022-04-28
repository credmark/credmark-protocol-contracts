// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Token.sol";

contract ModlMint is AccessControl {
    uint256 constant SECONDS_PER_ANNUM = 60 * 60 * 24 * 365;

    mapping(address => uint256) registrationTimestamp;
    mapping(address => uint256) annualMintLimit;
    mapping(address => uint256) mintEndTime;
    mapping(address => uint256) minted;

    Token modl;

    constructor(Token _modl) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        modl = _modl;
    }

    function registerMinter(
        address minter,
        uint256 limit,
        uint256 endTime
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        registrationTimestamp[minter] = block.timestamp;
        annualMintLimit[minter] = limit;
        mintEndTime[minter] = endTime;
    }

    function mint(address recipient, uint256 amount) external {
        require(amount < mintable(msg.sender), "");
        modl.mint(recipient, amount);
        minted[msg.sender] += amount;
    }

    function mintable(address minter) public view returns (uint256) {
        uint256 endTime = mintEndTime[minter];
        if (block.timestamp < mintEndTime[minter]) {
            endTime = block.timestamp;
        }
        return
            (annualMintLimit[minter] *
                (endTime - registrationTimestamp[minter])) /
            SECONDS_PER_ANNUM -
            minted[minter];
    }
}
