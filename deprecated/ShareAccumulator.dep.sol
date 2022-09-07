// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../configuration/Permissioned.sol";
import "../libraries/Time.sol";

contract ShareAccumulator {
    uint256 internal R = 10**18;

    mapping(address => uint256) internal share;
    mapping(address => uint256) internal offst;
    mapping(address => uint256) internal accum;

    uint256 internal snapt;

    address internal constant GLOBALS = address(0x0);

    function _setShares(address account, uint256 newShares) internal {
        accum[account] = _cAccum(account);
        offst[account] = _cOffst();
        accum[GLOBALS] = _cAccum(GLOBALS);
        offst[GLOBALS] = offst[account];
        snapt = Time.now_u256();
        share[GLOBALS] = share[GLOBALS] + newShares - share[account];
        share[account] = newShares;
    }

    function _removeAccumulation(address account) internal {
        accum[GLOBALS] = _cAccum(GLOBALS) - _cAccum(account);
        offst[account] = _cOffst();
        offst[GLOBALS] = offst[account];
        snapt = Time.now_u256();
        accum[account] = 0;
    }

    function accumulation(address account) public view returns (uint256) {
        return _cAccum(account);
    }

    function shares(address account) public view returns (uint256) {
        return share[account];
    }

    function totalAccumulation() public view returns (uint256) {
        return _cAccum(GLOBALS);
    }

    function _cOffst() private view returns (uint256) {
        return
            share[GLOBALS] == 0
                ? offst[GLOBALS]
                : offst[GLOBALS] + ((Time.since(snapt) * R) / share[GLOBALS]);
    }

    function _cAccum(address account) private view returns (uint256) {
        return share[account] * (_cOffst() - offst[account]) + accum[account];
    }
}
