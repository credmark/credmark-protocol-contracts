// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract Registry is AccessControl {
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant REGISTRY_MANAGER_ROLE = keccak256("REGISTRY_MANAGER_ROLE");

    EnumerableSet.AddressSet internal registeredAddresses;

    modifier registered(address addr) {
        require(registeredAddresses.contains(addr), "Contract is not Registered");
        _;
    }

    constructor(address registryManager) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRY_MANAGER_ROLE, registryManager);
    }

    function register(address addr) public onlyRole(REGISTRY_MANAGER_ROLE) {
        registeredAddresses.add(addr);
    }

    function unregister(address addr) public onlyRole(REGISTRY_MANAGER_ROLE) {
        registeredAddresses.remove(addr);
    }

    function isRegistered(address addr) external view returns(bool) {
        return registeredAddresses.contains(addr);
    }

    function addressAt(uint i) external view returns (address) {
        return registeredAddresses.at(i);
    }
}