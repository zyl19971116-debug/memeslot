import type { Address } from "viem";

export const memeSlotAddress = (process.env.NEXT_PUBLIC_MEME_SLOT_CONTRACT_ADDRESS || "") as Address;
export const isMemeSlotConfigured = /^0x[0-9a-fA-F]{40}$/.test(memeSlotAddress);

export const memeSlotAbi = [
  {
    type: "function", name: "mintMeme", stateMutability: "nonpayable",
    inputs: [
      { name: "generationId", type: "bytes32" }, { name: "character", type: "string" },
      { name: "mutation", type: "string" }, { name: "world", type: "string" },
      { name: "imageURI", type: "string" }, { name: "metadataURI", type: "string" },
    ], outputs: [{ name: "tokenId", type: "uint256" }],
  },
  { type: "function", name: "ownerOf", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "address" }] },
  { type: "function", name: "tokenURI", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ type: "string" }] },
  {
    type: "event", name: "MemeMinted", anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" }, { indexed: true, name: "creator", type: "address" },
      { indexed: false, name: "character", type: "string" }, { indexed: false, name: "mutation", type: "string" },
      { indexed: false, name: "world", type: "string" }, { indexed: false, name: "imageURI", type: "string" },
    ],
  },
] as const;
