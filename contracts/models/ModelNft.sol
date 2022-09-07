// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "../configuration/Permissioned.sol";

contract ModelNft is ERC721, Pausable, ERC721Enumerable, Permissioned {
    constructor() ERC721("Credmark Model NFT", "cmModelNFT") {}

    function _baseURI() internal pure override returns (string memory) {
        return "https://api.credmark.com/v1/meta/model/";
    }

    function pause() external configurer {
        _pause();
    }

    function unpause() external configurer {
        _unpause();
    }

    function safeMint(address to, string memory _slug) public manager {
        uint256 tokenId = toHash(_slug);
        _safeMint(to, tokenId);
    }

    function toHash(string memory _slug) internal pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(_slug)));
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
