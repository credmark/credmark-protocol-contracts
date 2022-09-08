// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./Permissioned.sol";

abstract contract Configurable is Permissioned {
    bool internal _configured;

    event Configured(bytes config);

    modifier configured() {
        require(_configured, "CONFIGURED");
        _;
    }

    function _postConfiguration() internal configurer {
        _configured = true;
        emit Configured(msg.data);
    }
}
