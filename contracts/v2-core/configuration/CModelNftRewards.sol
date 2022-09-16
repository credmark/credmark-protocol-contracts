// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../util/Configurable.sol";

import "../interfaces/IModl.sol";

contract CModelNftRewards {
    struct ConstructorParams {
        address modlAddress;
        address modelNftAddress;
    }

    IERC721 public immutable modelNft;
    IModl public immutable modl;

    constructor(ConstructorParams memory params) {
        modelNft = IERC721(params.modelNftAddress);
        modl = IModl(params.modlAddress);
    }
}
