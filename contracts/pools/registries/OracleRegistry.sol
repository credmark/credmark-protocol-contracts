// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./Registry.sol";
import "../interfaces/IPriceOracle.sol";

contract OracleRegistry is Registry {
    mapping(address => IPriceOracle) public oracles;

    constructor(address registryManager) Registry(registryManager) {}

    function setTokenOracle(address tokenAddress, IPriceOracle oracle)
        external
        registered(tokenAddress)
        onlyRole(REGISTRY_MANAGER_ROLE)
    {
        oracles[tokenAddress] = oracle;
    }

    function getOracle(address tokenAddress)
        external
        view
        registered(tokenAddress)
        returns (IPriceOracle)
    {
        return oracles[tokenAddress];
    }
}
