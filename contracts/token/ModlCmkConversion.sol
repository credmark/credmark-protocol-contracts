// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./IModl.sol";
import "../utils/BlockTimeUtils.sol";

contract ModlCmkConversion is BlockTimeUtils, AccessControl, ERC20 {
    bytes32 public constant CONVERSION_MANAGER = keccak256("CONVERSION_MANAGER");

    IERC20 public cmk;
    IModl public modl;

    event Deposit(address account, uint cmkAmount, uint cmkModlAmount);
    event Convert(address account, uint cmkModlAmount, uint modlAmount);

    uint public depositStart;
    uint public depositDuration;
    uint public depositDiv;

    uint public conversionStart;
    uint public conversionDuration;
    uint public conversionMul;

    constructor (
        uint depositDuration_,
        uint depositDiv_,
        uint conversionDuration_,
        uint conversionMul_,
        IERC20 cmk_
    ) ERC20("CMK Convertible Modl", "cmkMODL") {

        depositDuration = depositDuration_;
        depositDiv = depositDiv_;
        conversionDuration = conversionDuration_;
        conversionMul = conversionMul_;

        cmk = cmk_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setModl(IModl modl_) external onlyRole(CONVERSION_MANAGER) {
        modl = modl_;
    }

    function startConversions() external onlyRole(CONVERSION_MANAGER) {
        require(conversionStart == 0, "CMERR: Already Started");
        conversionStart = _blocktime();
    }

    function startDeposits() external onlyRole(CONVERSION_MANAGER) {
        require(depositStart == 0, "CMERR: Already Started");
        depositStart = _blocktime();
    }

    function deposit(address account, uint cmkAmount) external {
        require(account != address(0), "CMERR: account must not be null address.");
        cmk.transferFrom(account, address(this), cmkAmount);
        _mint(account, depositAmount(cmkAmount));
    }

    function convert(address account, uint cmkModlAmount) external {
        _burn(account, cmkModlAmount);
        modl.mint(account, convertAmount(cmkModlAmount));
    }

    function depositAmount(uint amount) public view returns (uint) {
        if(depositStart == 0) {
            return amount / depositDiv;
        }
        uint end = depositStart + depositDuration;
        if (end < _blocktime()) {
            return 0;
        }
        return amount * (end - _blocktime()) / depositDuration / depositDiv;
    }

    function convertAmount(uint amount) public view returns (uint) {
        if(conversionStart == 0) {
            return 0;
        }
        if (conversionStart + conversionDuration < _blocktime()) {
            return amount * conversionMul + amount;
        }
        return (_blocktime() - depositStart) * amount * conversionMul / depositDuration + amount;
    }
}