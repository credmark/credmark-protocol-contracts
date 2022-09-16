// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface IERC20Allowance {
    function mintable(address account) external view returns (uint256);
}
