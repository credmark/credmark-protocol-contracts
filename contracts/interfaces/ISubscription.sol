// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ISubscription {
    function deposit(address account, uint256 amount) external;

    function exit(address account) external;

    function claim(address account) external;

    function liquidate(address account) external;

    function deposits(address account) external view returns (uint256);

    function fees(address account) external view returns (uint256);

    function rewards(address account) external view returns (uint256);

    function solvent(address account) external view returns (bool);
}
