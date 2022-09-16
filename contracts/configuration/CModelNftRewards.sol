// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "./Configurable.sol";

import "../interfaces/IModl.sol";
import "../interfaces/IModlAllowance.sol";

contract CModelNftRewards is Configurable {
    struct ConstructorParams {
        address modlAddress;
        address modelNftAddress;
    }

    constructor(ConstructorParams memory params) {
        modelNft = IERC721(params.modelNftAddress);
        modl = IModl(params.modlAddress);
    }

    IERC721 public immutable modelNft;
    IModl public immutable modl;
}
