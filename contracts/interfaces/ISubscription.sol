// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ISubscription {
    struct SubscriptionConfiguration {
        uint256 lockup;
        uint256 fee;
        uint256 multiplier;
        bool subscribable;
        uint256 floorPrice;
        uint256 ceilingPrice;
    }

    function configure(SubscriptionConfiguration memory config) external;

    function deposit(address account, uint256 amount) external;

    function exit(address account) external;

    function claim(address account) external;

    function liquidate(address account) external;

    function deposits(address account) external view returns (uint256);

    function fees(address account) external view returns (uint256);

    function rewards(address account) external view returns (uint256);

    function solvent(address account) external view returns (bool);
}
