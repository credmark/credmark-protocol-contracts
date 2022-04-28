// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

contract FeeCursor is Ownable {
    uint256 baseRate;

    struct TokenCursor {
        uint256 value;
        uint256 price;
        uint256 timestamp;
    }

    mapping(address => TokenCursor) internal tokenCursor;

    constructor() {}

    function updatePrice(address token, uint256 newPrice) external onlyOwner {
        tokenCursor[token] = TokenCursor(
            getTokenValue(token),
            newPrice,
            block.timestamp
        );
    }

    function updateBaseRate(uint256 newRate) external onlyOwner {
        baseRate = newRate;
    }

    function getTokenValue(address token) public view returns (uint256 value) {
        if (tokenCursor[token].price == 0) {
            return 0;
        }
        uint256 timeDelta = block.timestamp - tokenCursor[token].timestamp;
        value =
            tokenCursor[token].value +
            ((timeDelta * baseRate) / tokenCursor[token].price);
    }
}
