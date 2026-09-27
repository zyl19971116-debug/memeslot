"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useAccount, useDeployContract, usePublicClient, useSwitchChain } from "wagmi";
import { memeSlotTokenLauncherBytecode } from "@/lib/generated/memeSlotTokenLauncherBytecode";
import { robinhoodChain } from "@/lib/web3/robinhoodChain";

const POSITION_MANAGER = "0x73991a25C818Bf1f1128dEAaB1492D45638DE0D3" as const;
const WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73" as const;
const constructorAbi = [{ type: "constructor", inputs: [{ name: "positionManager_", type: "address" }, { name: "weth_", type: "address" }] }] as const;

export default function DeployLauncherPanel() {
  const { isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { deployContractAsync } = useDeployContract();
  const client = usePublicClient({ chainId: robinhoodChain.id });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAddress, setContractAddress] = useState<string | null>(null);

  async function deploy() {
    setError(null);
    if (!isConnected) { openConnectModal?.(); return; }
    if (chainId !== robinhoodChain.id) { try { await switchChainAsync({ chainId: robinhoodChain.id }); } catch { setError("Network switch was rejected."); } return; }
    if (!client) return;
    try {
      setBusy(true);
      const hash = await deployContractAsync({
        abi: constructorAbi,
        bytecode: memeSlotTokenLauncherBytecode,
        args: [POSITION_MANAGER, WETH],
        chainId: robinhoodChain.id,
        // Robinhood Wallet currently fails to estimate this contract creation
        // even though the official RPC estimates ~2.21m gas successfully.
        gas: 3_000_000n,
      });
      const receipt = await client.waitForTransactionReceipt({ hash, timeout: 180_000 });
      if (receipt.status !== "success" || !receipt.contractAddress) throw new Error("Deployment reverted.");
      setContractAddress(receipt.contractAddress);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Deployment failed.";
      setError(/rejected|denied/i.test(message) ? "Wallet request rejected. No contract was deployed." : "Deployment failed. Check wallet funds and try again.");
    } finally { setBusy(false); }
  }

  return <div className="rounded-[28px] border border-black/10 bg-white p-6 shadow-sm">
    <h2 className="font-display text-xl">DEPLOY MEME SLOT LAUNCHER</h2>
    <p className="mt-3 text-sm leading-relaxed text-black/60">One-time Robinhood Chain mainnet deployment. Your wallet pays network gas only. This does not launch a meme token yet.</p>
    <div className="mt-4 rounded-2xl bg-black/[0.04] p-4 text-xs leading-6 text-black/60"><div>Position Manager: <span className="break-all font-semibold">{POSITION_MANAGER}</span></div><div>WETH: <span className="break-all font-semibold">{WETH}</span></div></div>
    {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
    {contractAddress && <div className="mt-4 rounded-2xl border border-green-300 bg-green-50 p-4"><p className="text-xs font-bold text-green-800">DEPLOYED SUCCESSFULLY</p><a className="mt-1 block break-all text-xs text-blue-600" href={`${robinhoodChain.blockExplorers.default.url}/address/${contractAddress}`} target="_blank" rel="noreferrer">{contractAddress}</a><p className="mt-2 text-xs text-black/60">Copy this address and send it back to me so I can activate it on the production site.</p></div>}
    <button onClick={deploy} disabled={busy || Boolean(contractAddress)} className="mt-5 w-full rounded-full bg-black py-3 text-xs font-bold tracking-[0.15em] text-white disabled:opacity-50">{!isConnected ? "CONNECT WALLET" : chainId !== robinhoodChain.id ? "SWITCH TO ROBINHOOD MAINNET" : busy ? "CONFIRM / DEPLOYING…" : "DEPLOY LAUNCHER"}</button>
  </div>;
}
