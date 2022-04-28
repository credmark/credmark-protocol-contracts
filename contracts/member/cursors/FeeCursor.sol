// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FeeCursor is Ownable {

    uint baseRate;

    struct TokenCursor {
        uint value;
        uint price;
        uint timestamp;
    }

    mapping(address => TokenCursor) internal tokenCursor;

    constructor() { }

    function updatePrice(address token, uint newPrice) external onlyOwner {
        tokenCursor[token] = TokenCursor(getTokenValue(token), newPrice, block.timestamp);
    }

    function updateBaseRate(uint newRate) external onlyOwner {
        baseRate = newRate;
    }

    function getTokenValue(address token) public view returns (uint value) {
        if (tokenCursor[token].price == 0) {
            return 0;
        }
        uint timeDelta = block.timestamp - tokenCursor[token].timestamp;
        value = tokenCursor[token].value + (timeDelta * baseRate / tokenCursor[token].price);
    }
}


