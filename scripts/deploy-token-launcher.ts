import { ethers } from "hardhat";

const POSITION_MANAGER = "0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3";
const WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";

async function main() {
  const launcher = await ethers.deployContract("MemeSlotTokenLauncher", [POSITION_MANAGER, WETH]);
  await launcher.waitForDeployment();
  console.log(`MemeSlotTokenLauncher deployed: ${await launcher.getAddress()}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
