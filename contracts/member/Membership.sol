// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IMembershipPool.sol";
import "../interfaces/IMembershipRewards.sol";
import "./MembershipToken.sol";


contract Membership is AccessControl {

    mapping(uint => address) subscriptions;
    IMembershipPool[] pools;
    MembershipToken token;

    modifier ownerApprovedOrAdmin(uint tokenId) {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || token.isApprovedOrOwner(msg.sender, tokenId));
        _;
    }
    constructor () {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function addMembershipPool(IMembershipPool pool) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pools.push(pool);
    }

    function subscribe(uint tokenId, IMembershipPool pool) external ownerApprovedOrAdmin(tokenId) {
        subscriptions[tokenId] = address(pool); 
    }

    function deposit(uint tokenId, uint amount) external ownerApprovedOrAdmin(tokenId) {
        IMembershipPool(subscriptions[tokenId]).deposit(tokenId, amount);
    }

    function claim(uint tokenId, uint amount) external ownerApprovedOrAdmin(tokenId) {
        IMembershipPool(subscriptions[tokenId]).claim(tokenId, amount);
    }

    function exit(uint tokenId) external ownerApprovedOrAdmin(tokenId) {
        IMembershipPool(subscriptions[tokenId]).exit(tokenId);
    }

}