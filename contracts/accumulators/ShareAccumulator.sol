// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../configuration/Permissioned.sol";
import "../libraries/Time.sol";

contract ShareAccumulator {
    uint256 internal constant R = 10**18;

    mapping(address => uint256) internal share;
    mapping(address => uint256) internal offst;
    mapping(address => uint256) internal accum;

    address internal constant GLOBALS = address(0x0);

    function _accumulate(uint256 newAccumulation) internal {
        offst[GLOBALS] = _newOffset(newAccumulation);
        accum[GLOBALS] += newAccumulation;
    }

    function _setShares(address account, uint256 newShares) internal {
        accum[account] =
            accum[account] +
            (offst[GLOBALS] - offst[account]) *
            share[account];
        offst[account] = offst[GLOBALS];
        share[GLOBALS] = share[GLOBALS] + newShares - share[account];
        share[account] = newShares;
    }

    function _removeAccumulation(address account)
        internal
        returns (uint256 removedAccumulation)
    {
        removedAccumulation = accumulation(account);
        accum[account] = 0;
        accum[GLOBALS] -= removedAccumulation;
        offst[account] = offst[GLOBALS];
    }

    function accumulation(address account) public view returns (uint256) {
        return
            ((offst[GLOBALS] - offst[account]) *
                share[account] +
                accum[account]) / R;
    }

    function accumulation(address account, uint256 unaccumulatedAmount)
        public
        view
        returns (uint256)
    {
        return
            ((_newOffset(unaccumulatedAmount) - offst[account]) *
                share[account] +
                accum[account]) / R;
    }

    function _newOffset(uint256 newAccumulation)
        private
        view
        returns (uint256)
    {
        return
            share[GLOBALS] == 0
                ? offst[GLOBALS]
                : offst[GLOBALS] + (newAccumulation * R) / share[GLOBALS];
    }
}
