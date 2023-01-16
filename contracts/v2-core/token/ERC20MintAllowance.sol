// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IERC20MintAllowance.sol";

abstract contract ERC20MintAllowance is IERC20MintAllowance {
    uint256 private constant PER_ANNUM = 86400 * 365;

    struct MintAllowance {
        uint256 start;
        uint256 end;
        uint256 annualMintAllowance;
        uint256 additionalMintAllowance;
    }

    mapping(address => MintAllowance) internal mintAllowances;
    mapping(address => uint256) internal minted;

    uint256 internal inflationCeiling;
    uint256 internal totalAnnualMintAllowance;

    function mintable(address account) public view returns (uint256) {
        MintAllowance memory mintAllowance = mintAllowances[account];

        require(block.timestamp >= mintAllowance.start, "VE:start");
        uint256 elapsed = block.timestamp - mintAllowance.start;

        if (block.timestamp > mintAllowance.end) {
            elapsed = mintAllowance.end - mintAllowance.start;
        }

        return
            ((elapsed * mintAllowance.annualMintAllowance) / PER_ANNUM) +
            mintAllowance.additionalMintAllowance -
            minted[account];
    }

    function _addMintAllowance(address account, uint256 additionalMintAllowance)
        internal
    {
        mintAllowances[account]
            .additionalMintAllowance += additionalMintAllowance;
    }

    function _setMintAllowance(address account, uint256 annualMintAllowance)
        internal
    {
        uint256 MAX_INT = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff;
        _setMintAllowance(account, annualMintAllowance, MAX_INT);
    }

    function _setMintAllowance(
        address account,
        uint256 annualMintAllowance,
        uint256 end
    ) internal {
        require(account != address(0), "NA");
        require(block.timestamp <= end, "VE:end");

        uint256 accumulated = mintable(account);
        MintAllowance memory mintAllowance = mintAllowances[account];

        totalAnnualMintAllowance =
            totalAnnualMintAllowance +
            annualMintAllowance -
            mintAllowance.annualMintAllowance;

        mintAllowance.start = block.timestamp;
        mintAllowance.end = end;
        mintAllowance.annualMintAllowance = annualMintAllowance;
        mintAllowance.additionalMintAllowance = accumulated;

        mintAllowances[account] = mintAllowance;

        require(
            totalAnnualMintAllowance <= inflationCeiling,
            "VE:totalAnnualMintAllowance"
        );
    }

    function _stopMintAllowance(address account) internal {
        require(account != address(0), "NA");
        MintAllowance memory mintAllowance = mintAllowances[account];

        totalAnnualMintAllowance =
            totalAnnualMintAllowance -
            mintAllowance.annualMintAllowance;
        mintAllowance.annualMintAllowance = 0;
        mintAllowance.start = 0;
        mintAllowance.end = 0;
        mintAllowance.additionalMintAllowance = minted[account];

        mintAllowances[account] = mintAllowance;
    }

    function _beforeTokenTransfer(
        address from,
        address,
        uint256 amount
    ) internal virtual {
        if (from == address(0)) {
            require(amount <= mintable(msg.sender), "MintAmountExceeded");
            minted[msg.sender] += amount;
        }
    }
}
