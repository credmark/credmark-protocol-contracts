// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ModlMint.sol";

contract CmkConversion is Ownable {
    using SafeERC20 for IERC20;
    IERC20 cmk = IERC20(0x68CFb82Eacb9f198d508B514d898a403c449533E);
    uint256 conversionRatio = 250000000000000000;
    bool isStarted;

    mapping(address => uint256) deposited;

    modifier started() {
        require(isStarted, "not started");
        _;
    }

    function start() external onlyOwner {
        isStarted = true;
    }

    function deposit(uint256 amount) external {}
}
