// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "../util/permissions/Manager.sol";
import "../util/permissions/Configurer.sol";

contract ModelNft is ERC721, Pausable, ERC721Enumerable, Manager, Configurer {
    constructor() ERC721("Credmark Model NFT", "cmModelNFT") {}

    function pause() external configurer {
        _pause();
    }

    function unpause() external configurer {
        _unpause();
    }

    function safeMint(address to, string memory slug) external manager {
        uint256 tokenId = toHash(slug);
        _safeMint(to, tokenId);
    }

    function toHash(string memory slug) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(slug)));
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
