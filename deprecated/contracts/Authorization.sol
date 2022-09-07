// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../interfaces/ISubscription.sol";

contract Authorization {
    mapping(address => mapping(address => mapping(address => bool))) authorizedAddresses;

    function authorizeRequester(
        address subscription,
        address owner,
        address requester
    ) external {
        require(msg.sender == owner, "Only owner can grant access");
        authorizedAddresses[subscription][owner][requester] = true;
    }

    function revokeRequester(
        address subscription,
        address owner,
        address requester
    ) external {
        require(msg.sender == owner, "Only owner can grant access");
        authorizedAddresses[subscription][owner][requester] = false;
    }

    function authorized(
        address subscription,
        address owner,
        address requester
    ) external view returns (bool) {
        return
            authorizedAddresses[subscription][owner][requester] &&
            ISubscription(subscription).solvent(owner);
    }
}
