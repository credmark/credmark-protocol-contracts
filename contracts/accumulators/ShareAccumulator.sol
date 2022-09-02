// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "../libraries/Time.sol";

contract ShareAccumulator is AccessControl {
    bytes32 public constant ACCUMULATOR_ROLE = keccak256("ACCUMULATOR_ROLE");
    uint256 internal R = 10**18;

    mapping(address => uint256) internal share;
    mapping(address => uint256) internal offst;
    mapping(address => uint256) internal accum;

    uint256 internal snapt;

    address internal constant GLOBALS = address(0x0);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ACCUMULATOR_ROLE, msg.sender);
    }

    function setShares(address account, uint256 newShares)
        external
        onlyRole(ACCUMULATOR_ROLE)
    {
        accum[account] = cAccum(account);
        offst[account] = cOffst();
        accum[GLOBALS] = cAccum(GLOBALS);
        offst[GLOBALS] = offst[account];
        snapt = Time.now_u256();
        share[GLOBALS] = share[GLOBALS] + newShares - share[account];
        share[account] = newShares;
    }

    function removeAccumulation(address account)
        external
        onlyRole(ACCUMULATOR_ROLE)
    {
        accum[GLOBALS] = cAccum(GLOBALS) - cAccum(account);
        offst[account] = cOffst();
        offst[GLOBALS] = offst[account];
        snapt = Time.now_u256();
        accum[account] = 0;
    }

    function setR(uint256 r) external onlyRole(DEFAULT_ADMIN_ROLE) {
        accum[GLOBALS] = cAccum(GLOBALS);
        offst[GLOBALS] = cOffst();
        snapt = Time.now_u256();
        R = r;
    }

    function accumulation(address account) external view returns (uint256) {
        return cAccum(account);
    }

    function shares(address account) external view returns (uint256) {
        return share[account];
    }

    function totalAccumulation() public view returns (uint256) {
        return cAccum(GLOBALS);
    }

    function cOffst() internal view returns (uint256) {
        return
            share[GLOBALS] == 0
                ? share[GLOBALS]
                : offst[GLOBALS] + ((Time.since(snapt) * R) / share[GLOBALS]);
    }

    function cAccum(address account) internal view returns (uint256) {
        return share[account] * (cOffst() - offst[account]) + accum[account];
    }
}
