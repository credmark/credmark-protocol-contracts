// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface ISubscription {
    event Deposit(address indexed account, uint256 amount);
    event Exit(address indexed account, uint256 amount, uint256 fee);
    event Claim(address indexed account, uint256 amount);
    event Liquidate(
        address indexed account,
        address indexed liquidator,
        uint256 amount
    );

    function deposit(uint256 amount) external;

    function exit() external;

    function claim() external;

    function liquidate(address account) external;

    function deposits(address account) external view returns (uint256);

    function fees(address account) external view returns (uint256);

    function rewards(address account) external view returns (uint256);

    function solvent(address account) external view returns (bool);
}
