// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import "./IERC20MintAllowance.sol";

interface IModl is IERC20, IAccessControl, IERC20MintAllowance {
    event Burn(address account, uint256 amount);

    function mint(address to, uint256 amount) external;

    function burn(uint256 amount) external;
}
