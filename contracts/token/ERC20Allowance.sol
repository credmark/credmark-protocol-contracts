// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../interfaces/IERC20Allowance.sol";

abstract contract ERC20Allowance is ERC20, IERC20Allowance {
    uint256 private constant PER_ANNUM = 86400 * 365;

    struct Allowance {
        uint256 start;
        uint256 end;
        uint256 annualAllowance;
        uint256 additionalAllowance;
    }

    mapping(address => Allowance) internal allowances;
    mapping(address => uint256) internal minted;

    uint256 internal inflationCeiling;
    uint256 internal totalAnnualAllowance;

    function mintable(address account) public view returns (uint256) {
        Allowance memory allowance = allowances[account];

        require(
            block.timestamp >= allowance.start,
            "ERC20Allowance: Invalid allowance start time."
        );
        uint256 elapsed = block.timestamp - allowance.start;

        if (block.timestamp > allowance.end) {
            elapsed = allowance.end - allowance.start;
        }

        return
            ((elapsed * allowance.annualAllowance) / PER_ANNUM) +
            allowance.additionalAllowance -
            minted[account];
    }

    function _addAllowance(address account, uint256 additionalAllowance)
        internal
    {
        allowances[account].additionalAllowance += additionalAllowance;
    }

    function _setAllowance(address account, uint256 annualAllowance) internal {
        uint256 MAX_INT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        _setAllowance(account, annualAllowance, MAX_INT);
    }

    function _setAllowance(
        address account,
        uint256 annualAllowance,
        uint256 end
    ) internal {
        require(account != address(0), "NA");
        require(block.timestamp <= end, "T");

        uint256 accumulated = mintable(account);
        Allowance memory allowance = allowances[account];

        totalAnnualAllowance =
            totalAnnualAllowance +
            annualAllowance -
            allowance.annualAllowance;

        allowance.start = block.timestamp;
        allowance.end = end;
        allowance.annualAllowance = annualAllowance;
        allowance.additionalAllowance = accumulated;

        allowances[account] = allowance;

        require(totalAnnualAllowance <= inflationCeiling, "VE");
    }

    function _stopAllowance(address account) internal {
        require(account != address(0), "NA");
        Allowance memory allowance = allowances[account];

        totalAnnualAllowance = totalAnnualAllowance - allowance.annualAllowance;
        allowance.annualAllowance = 0;
        allowance.start = 0;
        allowance.end = 0;
        allowance.additionalAllowance = minted[account];

        allowances[account] = allowance;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, amount);

        if (from == address(0)) {
            require(
                amount <= mintable(msg.sender),
                "ERC20Allowance: Mint amount exceeds mintable amount."
            );
            minted[msg.sender] += amount;
        }
    }
}
