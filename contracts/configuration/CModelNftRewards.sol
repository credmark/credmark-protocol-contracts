// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "./Configurable.sol";

contract CModelNftRewards is Configurable {
    struct ConstructorParams {
        address modlAddress;
        address modlAllowanceAddress;
        address modelNftAddress;
    }
}
