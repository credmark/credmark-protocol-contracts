// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IModl.sol";
import "../libraries/Time.sol";

contract ModlCmkConversion is AccessControl, ERC20 {
    using SafeERC20 for IERC20;
    bytes32 public constant CONVERSION_MANAGER =
        keccak256("CONVERSION_MANAGER");

    IERC20 public cmk;
    IModl public modl;

    event Deposit(address account, uint256 cmkAmount, uint256 cmkModlAmount);
    event Convert(address account, uint256 cmkModlAmount, uint256 modlAmount);

    uint256 public depositStart;
    uint256 public depositDuration;
    uint256 public depositDiv;

    uint256 public conversionStart;
    uint256 public conversionDuration;
    uint256 public conversionMul;

    constructor(
        uint256 depositDuration_,
        uint256 depositDiv_,
        uint256 conversionDuration_,
        uint256 conversionMul_,
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
        conversionStart = Time.now_u256();
    }

    function startDeposits() external onlyRole(CONVERSION_MANAGER) {
        require(depositStart == 0, "CMERR: Already Started");
        depositStart = Time.now_u256();
    }

    function deposit(uint256 cmkAmount) external {
        cmk.safeTransferFrom(_msgSender(), address(this), cmkAmount);
        _mint(_msgSender(), depositAmount(cmkAmount));
    }

    function convert(uint256 cmkModlAmount) external {
        require(conversionStart > 0, "CMERR: Not Yet Started");
        _burn(_msgSender(), cmkModlAmount);
        modl.mint(_msgSender(), convertAmount(cmkModlAmount));
    }

    function depositAmount(uint256 amount) public view returns (uint256) {
        if (depositStart == 0) {
            return amount / depositDiv;
        }
        uint256 end = depositStart + depositDuration;
        if (end < Time.now_u256()) {
            return 0;
        }
        return
            (amount * (end - Time.now_u256())) / depositDuration / depositDiv;
    }

    function convertAmount(uint256 amount) public view returns (uint256) {
        if (conversionStart == 0) {
            return 0;
        }
        if (conversionStart + conversionDuration < Time.now_u256()) {
            return amount * conversionMul + amount;
        }
        return
            (Time.since(depositStart) * amount * conversionMul) /
            depositDuration +
            amount;
    }
}
