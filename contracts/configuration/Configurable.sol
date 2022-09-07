// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./Permissioned.sol";

contract Configurable is Permissioned {
    bool internal _configured;

    event Configured(bytes config);

    modifier configured() {
        require(_configured, "Not Configured");
        _;
    }

    function _postConfiguration() internal configurer {
        _configured = true;
        emit Configured(msg.data);
    }
}
