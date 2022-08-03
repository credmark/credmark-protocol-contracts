// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IProduct.sol";
import "./cursors/FeeCursor.sol";
import "./registries/OracleRegistry.sol";

contract Product is AccessControl, IProduct {
    FeeCursor internal cursor;
    OracleRegistry internal oracles;
    string public name;

    constructor(uint256 rate, string memory name_) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        name = name_;
        cursor = new FeeCursor();
        cursor.updateBaseRate(rate);
    }

    function setRate(uint256 rate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        cursor.updateBaseRate(rate);
    }

    function setOracleRegistry(OracleRegistry oracleRegistry)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        oracles = oracleRegistry;
    }

    function updatePrice(address baseToken) external override {
        IPriceOracle oracle = oracles.getOracle(baseToken);

        uint256 price = oracle.price();
        uint256 decimals = oracle.decimals();

        cursor.updatePrice(baseToken, price);
    }

    function getFee(address baseToken)
        external
        view
        override
        returns (uint256)
    {
        return cursor.getTokenValue(address(baseToken));
    }

    function getEquivalentAmount(
        address baseToken,
        uint256 amount,
        address outputToken
    ) external view override returns (uint256) {
        uint256 basePrice = oracles.getOracle(baseToken).price();
        uint256 outputPrice = oracles.getOracle(outputToken).price();
        return (amount * basePrice) / outputPrice;
    }
}
