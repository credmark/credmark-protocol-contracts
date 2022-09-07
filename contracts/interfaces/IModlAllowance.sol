// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "../interfaces/IModl.sol";

interface IModlAllowance {
    event Claim(address account, uint256 amount);

    event Update(address account, uint256 amountPerAnnum);

    function claim(address account) external returns (uint256 amount);

    function claimableAmount(address account)
        external
        view
        returns (uint256 amount);

    function modl() external returns (IModl);
}