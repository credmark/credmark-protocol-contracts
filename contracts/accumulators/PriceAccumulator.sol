// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../libraries/Time.sol";
import "../configuration/Permissioned.sol";

contract PriceAccumulator is Permissioned {
    uint8 internal constant decimals = 8;

    uint256 public price;
    uint256 internal offst;
    uint256 internal snapt;

    function setPrice(uint256 newPrice) external configurer {
        offst = offset();
        snapt = Time.now_u256();
        price = newPrice;
    }

    function offset() public view returns (uint256) {
        return
            price == 0
                ? offst
                : (Time.since(snapt) * (10**decimals)) / price + offst;
    }
}
