// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IMembershipProduct.sol";
import "../interfaces/IPriceOracle.sol";

contract MembershipProduct is AccessControl, IMembershipProduct {

    uint constant SECONDS_PER_MONTH = 60 * 60 * 24 * 30;

    IERC20 feeToken;
    uint monthlyFeeRate;
    uint start_ts;
    mapping(address => IPriceOracle) oracles;
    mapping(address => uint) feeTokenScaledCursor;
    mapping(address => uint) feeTokenScaledLastTimestamp;

    constructor (
        IERC20 _feeToken,
        uint _monthlyFeeRate
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        feeToken = _feeToken;
        monthlyFeeRate = _monthlyFeeRate;
    }

    function intializeCursor(IERC20 baseToken, IPriceOracle oracle) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (feeTokenScaledLastTimestamp[address(baseToken)] == 0){
            feeTokenScaledLastTimestamp[address(baseToken)] = block.timestamp;
        }
        oracles[address(baseToken)] = oracle;
    }

    function updateFeeCursor(IERC20 baseToken) external override {
        feeTokenScaledCursor[address(baseToken)] = getFeeCursor_tokens(baseToken);
        feeTokenScaledLastTimestamp[address(baseToken)] = block.timestamp;
    }

    function getFeeCursor_tokens(IERC20 baseToken) public override view returns (uint){
        uint price = oracles[address(baseToken)].price();
        uint decimals = oracles[address(baseToken)].decimals();
        uint timeDelta = block.timestamp - feeTokenScaledLastTimestamp[address(baseToken)];
        return feeTokenScaledCursor[address(baseToken)] * timeDelta * monthlyFeeRate * price / SECONDS_PER_MONTH / (10**decimals);
    }
}