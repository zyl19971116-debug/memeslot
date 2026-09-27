import { getAddress, isAddress, parseAbi } from "viem";

const configuredAddress = process.env.NEXT_PUBLIC_MEME_TOKEN_LAUNCHER_ADDRESS ?? "";
export const isDirectLauncherConfigured = isAddress(configuredAddress);
export const directLauncherAddress = (
  isDirectLauncherConfigured ? getAddress(configuredAddress) : "0x0000000000000000000000000000000000000000"
) as `0x${string}`;

export const directLauncherAbi = parseAbi([
  "function SUPPLY() view returns (uint256)",
  "function POOL_FEE() view returns (uint24)",
  "function LP_LOCK() view returns (address)",
  "function tokenForCreation(bytes32 creationId) view returns (address)",
  "function launch(bytes32 creationId,string name_, string symbol_, string logo_, string description_, (string twitter,string website) socials_, uint256 amount0Min, uint256 amount1Min, uint256 deadline) payable returns (address token,address pool,uint256 positionId)",
  "event TokenLaunched(address indexed token,address indexed pool,address indexed creator,bytes32 creationId,uint256 positionId,uint128 liquidity,uint256 ethLiquidity)",
  "error CreationAlreadyLaunched(bytes32 creationId,address token)",
]);
