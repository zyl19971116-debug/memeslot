import { ethers, network } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

async function main() {
  if (!["robinhoodTestnet", "robinhood"].includes(network.name)) {
    throw new Error("Use --network robinhoodTestnet or --network robinhood explicitly.");
  }
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("DEPLOYER_PRIVATE_KEY is not configured in your local environment.");
  const balance = await ethers.provider.getBalance(deployer.address);

  console.log("NETWORK:", network.name);
  console.log("CHAIN ID:", chainId);
  console.log("DEPLOYER ADDRESS:", deployer.address);
  console.log("DEPLOYER ETH BALANCE:", ethers.formatEther(balance));
  console.log("CONTRACT NAME: MemeSlotCollection");

  const factory = await ethers.getContractFactory("MemeSlotCollection");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  const receipt = await contract.deploymentTransaction()?.wait();

  await mkdir(resolve("deployment"), { recursive: true });
  const output = {
    contract: "MemeSlotCollection",
    address,
    network: network.name,
    chainId,
    transactionHash: receipt?.hash,
    deployedAt: new Date().toISOString(),
  };
  const filename = network.name === "robinhood" ? "robinhood-mainnet.json" : "robinhood-testnet.json";
  await writeFile(resolve("deployment", filename), `${JSON.stringify(output, null, 2)}\n`);
  console.log("DEPLOYED ADDRESS:", address);
  console.log("DEPLOYMENT RECORD:", `deployment/${filename}`);
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
