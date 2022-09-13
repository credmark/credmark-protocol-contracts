// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import "./Configurable.sol";

import "../interfaces/IModl.sol";

contract CSubscriptionRewardsIssuer is Configurable {
    bytes32 public constant TRUSTED_CONTRACT_ROLE =
        keccak256("TRUSTED_CONTRACT_ROLE");
    modifier trustedContract() {
        _checkRole(TRUSTED_CONTRACT_ROLE);
        _;
    }
    struct ConstructorParams {
        address modlAddress;
    }

    struct Configuration {
        uint256 amountPerAnnum;
    }

    constructor(ConstructorParams memory params) {
        modl = IModl(params.modlAddress);
    }

    function configure(Configuration memory newConfig) external {
        config = newConfig;
        _postConfiguration();
    }

    Configuration config;

    IModl public immutable modl;
}
