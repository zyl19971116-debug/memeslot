import { expect } from "chai";
import { ethers } from "hardhat";

describe("MemeSlotTokenLauncher", function () {
  it("creates a fixed-supply token and locks the full-range position", async function () {
    const [creator] = await ethers.getSigners();
    const weth = await ethers.deployContract("MockWETH");
    const manager = await ethers.deployContract("MockPositionManager");
    const launcher = await ethers.deployContract("MemeSlotTokenLauncher", [manager.target, weth.target]);
    const ethLiquidity = ethers.parseEther("0.01");
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const tx = await launcher.launch(
      "Test Meme", "MEME", "https://example.com/meme.png", "A test meme",
      { twitter: "", website: "https://example.com" },
      0, 0, deadline, { value: ethLiquidity },
    );
    const receipt = await tx.wait();
    const event = receipt!.logs.map((log) => {
      try { return launcher.interface.parseLog(log); } catch { return null; }
    }).find((item) => item?.name === "TokenLaunched");

    expect(event).not.to.equal(undefined);
    const token = await ethers.getContractAt("MemeSlotToken", event!.args.token);
    expect(await token.totalSupply()).to.equal(ethers.parseEther("1000000000"));
    expect(await token.creator()).to.equal(creator.address);
    expect(await manager.lastRecipient()).to.equal("0x000000000000000000000000000000000000dEaD");
    expect(await token.balanceOf(manager.target)).to.equal(await token.totalSupply());
    expect(await weth.balanceOf(manager.target)).to.equal(ethLiquidity);
  });
});
