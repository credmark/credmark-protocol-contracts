// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./permissions/Configurer.sol";

abstract contract Configurable is Configurer {
    bool internal _configured;

    event Configured(address configurer, bytes data);

    modifier configured() {
        require(_configured, "C");
        _;
    }

    function _postConfiguration() internal configurer {
        _configured = true;
        emit Configured(msg.sender, msg.data);
    }
}
