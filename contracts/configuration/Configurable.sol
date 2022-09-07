// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./Permissioned.sol";

contract Configurable is Permissioned {
    bool internal _configured;

    modifier configured() {
        require(_configured, "Not Configured");
        _;
    }
}
