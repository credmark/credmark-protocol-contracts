// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IProduct {

    function updatePrice(address baseToken) external;
    function getFee(address baseToken) external view returns (uint);
    function getEquivalentAmount(address baseToken, uint amount, address outputToken) external view returns (uint);
}