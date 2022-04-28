// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IProduct.sol";
import "./cursors/FeeCursor.sol";
import "./oracles/OracleRegistry.sol";

contract Product is AccessControl, IProduct {

    FeeCursor internal cursor;
    OracleRegistry internal oracles;
    string public name;

    constructor (
        uint rate,
        string memory name_
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        cursor = new FeeCursor();
    }

    function setRate(uint rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        cursor.updateBaseRate(rate);
    }

    function setOracleRegistry(OracleRegistry oracleRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        oracles = oracleRegistry;
    }

    function updatePrice(address baseToken) external override {

        IPriceOracle oracle = oracles.getOracle(baseToken);

        uint price = oracle.price();
        uint decimals = oracle.decimals();

        cursor.updatePrice(baseToken, price);
    }

    function getFee(address baseToken) external override view returns (uint) {
        return cursor.getTokenValue(address(baseToken));
    }

    function getEquivalentAmount(address baseToken, uint amount, address outputToken) external override view returns (uint) {
        uint basePrice = oracles.getOracle(baseToken).price();
        uint outputPrice = oracles.getOracle(baseToken).price();
        return amount * basePrice / outputPrice;
    }
}