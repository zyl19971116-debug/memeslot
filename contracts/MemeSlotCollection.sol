// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract MemeSlotCollection is ERC721URIStorage {
    struct MemeData {
        address creator;
        string character;
        string mutation;
        string world;
        string imageURI;
        string metadataURI;
        uint256 createdAt;
    }

    uint256 private _nextTokenId = 1;
    mapping(uint256 => MemeData) public memeData;
    mapping(bytes32 => bool) public generationMinted;

    event MemeMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string character,
        string mutation,
        string world,
        string imageURI
    );

    error GenerationAlreadyMinted(bytes32 generationId);

    constructor() ERC721("MEME SLOT", "MSLOT") {}

    function mintMeme(
        bytes32 generationId,
        string calldata character,
        string calldata mutation,
        string calldata world,
        string calldata imageURI,
        string calldata metadataURI
    ) external returns (uint256 tokenId) {
        if (generationMinted[generationId]) revert GenerationAlreadyMinted(generationId);
        generationMinted[generationId] = true;

        tokenId = _nextTokenId++;
        memeData[tokenId] = MemeData({
            creator: msg.sender,
            character: character,
            mutation: mutation,
            world: world,
            imageURI: imageURI,
            metadataURI: metadataURI,
            createdAt: block.timestamp
        });
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit MemeMinted(tokenId, msg.sender, character, mutation, world, imageURI);
    }
}
