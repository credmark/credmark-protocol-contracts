// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMembershipProduct {

    function getFeeCursor_tokens(IERC20 baseToken) external view returns (uint);
    function updateFeeCursor(IERC20 baseToken) external ;

}