import { expect } from "chai";
import { ethers } from "hardhat";

describe("MemeSlotCollection", function () {
  const generation = ethers.keccak256(ethers.toUtf8Bytes("generation-1"));
  const args = [generation, "PEPE", "KING", "CYBER", "ipfs://image", "ipfs://metadata"] as const;

  async function deploy() {
    const [owner, other] = await ethers.getSigners();
    const contract: any = await (await ethers.getContractFactory("MemeSlotCollection")).deploy();
    return { contract, owner, other };
  }

  it("mints to the caller, stores URI/data, and emits MemeMinted", async function () {
    const { contract, owner } = await deploy();
    await expect(contract.mintMeme(...args))
      .to.emit(contract, "MemeMinted")
      .withArgs(1n, owner.address, "PEPE", "KING", "CYBER", "ipfs://image");
    expect(await contract.ownerOf(1n)).to.equal(owner.address);
    expect(await contract.tokenURI(1n)).to.equal("ipfs://metadata");
    const data = await contract.memeData(1n);
    expect(data.creator).to.equal(owner.address);
    expect(data.character).to.equal("PEPE");
    expect(data.mutation).to.equal("KING");
    expect(data.world).to.equal("CYBER");
    expect(data.imageURI).to.equal("ipfs://image");
    expect(data.metadataURI).to.equal("ipfs://metadata");
    expect(data.createdAt).to.be.greaterThan(0n);
  });

  it("rejects the same generation ID twice", async function () {
    const { contract } = await deploy();
    await contract.mintMeme(...args);
    await expect(contract.mintMeme(...args)).to.be.revertedWithCustomError(contract, "GenerationAlreadyMinted").withArgs(generation);
  });

  it("supports multiple users and tokens", async function () {
    const { contract, owner, other } = await deploy();
    await contract.mintMeme(...args);
    const generation2 = ethers.keccak256(ethers.toUtf8Bytes("generation-2"));
    await contract.connect(other).mintMeme(generation2, "DOGE", "GOLD", "SPACE", "ipfs://image2", "ipfs://metadata2");
    expect(await contract.ownerOf(1n)).to.equal(owner.address);
    expect(await contract.ownerOf(2n)).to.equal(other.address);
  });

  it("allows standard ERC721 transfers", async function () {
    const { contract, owner, other } = await deploy();
    await contract.mintMeme(...args);
    await contract.transferFrom(owner.address, other.address, 1n);
    expect(await contract.ownerOf(1n)).to.equal(other.address);
  });
});
