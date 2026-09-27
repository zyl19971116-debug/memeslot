"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMemo, useState } from "react";
import { decodeEventLog, parseEther } from "viem";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { directLauncherAbi, directLauncherAddress, isDirectLauncherConfigured } from "@/lib/contracts/directLauncher";
import { robinhoodChain } from "@/lib/web3/robinhoodChain";

interface Props { imageUrl: string; suggestedName: string; description: string; }
type Status = "REVIEW LAUNCH" | "CONFIRM IN WALLET" | "CREATING TOKEN & POOL" | "LAUNCHED" | "FAILED";

function symbolFromName(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase() || "MEME";
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "Launch failed.";
  if (/rejected|denied|user rejected/i.test(message)) return "Wallet request rejected. Nothing was deployed.";
  if (/insufficient funds/i.test(message)) return "Insufficient ETH for initial liquidity and gas.";
  return message.length > 180 ? "The launch transaction failed. No completed launch was recorded." : message;
}

export default function DirectTokenLaunchButton({ imageUrl, suggestedName, description }: Props) {
  const { address, isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: robinhoodChain.id });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(suggestedName);
  const [symbol, setSymbol] = useState(() => symbolFromName(suggestedName));
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [liquidityEth, setLiquidityEth] = useState("0.01");
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState<Status>("REVIEW LAUNCH");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ token: string; pool: string } | null>(null);
  const busy = status === "CONFIRM IN WALLET" || status === "CREATING TOKEN & POOL";
  const absoluteLogo = useMemo(() => /^https?:\/\//.test(imageUrl) ? imageUrl : typeof window !== "undefined" ? new URL(imageUrl, window.location.origin).toString() : imageUrl, [imageUrl]);

  async function launch() {
    setError(null);
    if (!isConnected || !address) { openConnectModal?.(); return; }
    if (chainId !== robinhoodChain.id) {
      try { await switchChainAsync({ chainId: robinhoodChain.id }); } catch (e) { setError(friendlyError(e)); }
      return;
    }
    if (!isDirectLauncherConfigured) { setStatus("FAILED"); setError("The MEME SLOT launcher contract is not configured yet."); return; }
    if (!accepted) { setError("Confirm the irreversible launch terms first."); return; }
    if (!name.trim() || !symbol.trim()) { setError("Token name and symbol are required."); return; }
    let value: bigint;
    try { value = parseEther(liquidityEth); } catch { setError("Enter a valid ETH liquidity amount."); return; }
    if (value < parseEther("0.001")) { setError("Initial liquidity must be at least 0.001 ETH."); return; }
    try {
      setStatus("CONFIRM IN WALLET");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 20 * 60);
      const hash = await writeContractAsync({
        address: directLauncherAddress,
        abi: directLauncherAbi,
        functionName: "launch",
        chainId: robinhoodChain.id,
        args: [name.trim(), symbol.trim().toUpperCase(), absoluteLogo, description.slice(0, 500), { twitter: twitter.trim(), website: website.trim() }, 0n, 0n, deadline],
        value,
        // Robinhood Wallet can stall while estimating this atomic token + pool
        // creation call. The official RPC estimates ~6.3m gas; keep headroom.
        gas: 8_200_000n,
      });
      setStatus("CREATING TOKEN & POOL");
      if (!publicClient) throw new Error("Robinhood Chain RPC unavailable.");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 180_000 });
      if (receipt.status !== "success") throw new Error("Launch transaction reverted.");
      for (const log of receipt.logs) {
        try {
          const event = decodeEventLog({ abi: directLauncherAbi, eventName: "TokenLaunched", data: log.data, topics: log.topics });
          setResult({ token: event.args.token, pool: event.args.pool });
          break;
        } catch {}
      }
      setStatus("LAUNCHED");
    } catch (e) { setStatus("FAILED"); setError(friendlyError(e)); }
  }

  return <div className="col-span-2">
    <p className="mb-2 text-center text-[10px] font-bold tracking-[0.18em] text-black/45">OPTIONAL · ROBINHOOD CHAIN · LOCKED V3 LIQUIDITY</p>
    <button onClick={() => setOpen(true)} className="w-full rounded-full bg-black py-3 font-display text-sm tracking-[0.15em] text-white">LAUNCH TRADEABLE TOKEN</button>
    {open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4" onClick={() => !busy && setOpen(false)}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between gap-4"><div><h3 className="font-display text-xl">ROBINHOOD CHAIN LAUNCH</h3><p className="mt-1 text-xs text-black/50">Fixed-supply ERC-20 · Token/WETH V3 pool · permanently locked LP</p></div><button onClick={() => !busy && setOpen(false)} className="text-xl text-black/40">×</button></div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <label className="text-[10px] font-bold tracking-wider text-black/55">TOKEN NAME<input value={name} maxLength={64} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal text-black" /></label>
          <label className="text-[10px] font-bold tracking-wider text-black/55">SYMBOL<input value={symbol} maxLength={12} onChange={(e) => setSymbol(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal text-black" /></label>
          <label className="col-span-2 text-[10px] font-bold tracking-wider text-black/55">INITIAL LIQUIDITY (ETH)<input value={liquidityEth} type="number" min="0.001" step="0.001" onChange={(e) => setLiquidityEth(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal text-black" /></label>
          <label className="col-span-2 text-[10px] font-bold tracking-wider text-black/55">WEBSITE (OPTIONAL)<input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal text-black" /></label>
          <label className="col-span-2 text-[10px] font-bold tracking-wider text-black/55">X / TWITTER (OPTIONAL)<input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/..." className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal text-black" /></label>
        </div>
        <div className="mt-4 rounded-2xl bg-black/[0.04] p-4 text-xs leading-6 text-black/65"><div>Supply: <b>1,000,000,000</b></div><div>Pool fee: <b>1%</b></div><div>LP allocation: <b>100% of supply + {liquidityEth || "0"} ETH</b></div><div>LP NFT: <b>permanently sent to 0x…dEaD</b></div><div>Platform launch fee: <b>none</b> · network gas still applies</div></div>
        <label className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-black/65"><input className="mt-1" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />I understand the token launch and liquidity lock are irreversible, all supplied ETH enters the pool, and the token may lose all value.</label>
        {error && <p className="mt-3 text-xs leading-relaxed text-red-600">{error}</p>}
        {result && <div className="mt-3 space-y-1 text-xs"><a className="block break-all font-bold text-blue-600" href={`${robinhoodChain.blockExplorers.default.url}/address/${result.token}`} target="_blank" rel="noreferrer">Token: {result.token}</a><a className="block break-all font-bold text-blue-600" href={`${robinhoodChain.blockExplorers.default.url}/address/${result.pool}`} target="_blank" rel="noreferrer">Pool: {result.pool}</a></div>}
        <button disabled={busy || !accepted || status === "LAUNCHED"} onClick={launch} className="mt-5 w-full rounded-full bg-black py-3 text-xs font-bold tracking-[0.15em] text-white disabled:opacity-45">{!isConnected ? "CONNECT WALLET" : chainId !== robinhoodChain.id ? "SWITCH TO ROBINHOOD MAINNET" : status}</button>
      </div>
    </div>}
  </div>;
}
