"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useMemo, useState } from "react";
import { decodeEventLog, formatEther, toHex, type Hex } from "viem";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { PONS_NATIVE_PAIR, PONS_V2_FACTORY, ponsV2FactoryAbi } from "@/lib/contracts/ponsV2";
import { robinhoodChain } from "@/lib/web3/robinhoodChain";

interface Props {
  imageUrl: string;
  suggestedName: string;
  description: string;
}

type LaunchTerms = {
  configId: bigint;
  supply: bigint;
  curveFeeBps: bigint;
  graduationThreshold: bigint;
  launchFee: bigint;
  maxCreatorTaxBps: bigint;
  expectedEconomics: Hex;
};

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "Launch failed.";
  if (/rejected|denied|user rejected/i.test(message)) return "Wallet request rejected. No token was launched.";
  if (/insufficient funds/i.test(message)) return "Insufficient ETH for the launch fee and network gas.";
  if (/LaunchConfigDisabled/i.test(message)) return "This PONS launch configuration was disabled. Refresh and try again.";
  if (/not whitelisted|LaunchNotEnabled|UnauthorizedLauncher/i.test(message)) return "PONS V2 launches are currently gated and this wallet is not eligible.";
  return message.length > 190 ? "The PONS V2 transaction failed. No token was launched." : message;
}

function symbolFromName(name: string) {
  const value = name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
  return value || "MEME";
}

export default function PonsV2LaunchButton({ imageUrl, suggestedName, description }: Props) {
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
  const [creatorTax, setCreatorTax] = useState("0");
  const [buybackEnabled, setBuybackEnabled] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [terms, setTerms] = useState<LaunchTerms | null>(null);
  const [status, setStatus] = useState("REVIEW PONS V2 LAUNCH");
  const [error, setError] = useState<string | null>(null);
  const [tokenAddress, setTokenAddress] = useState<string | null>(null);
  const busy = !["REVIEW PONS V2 LAUNCH", "READY TO LAUNCH", "FAILED", "LAUNCHED"].includes(status);
  const absoluteLogo = useMemo(() => {
    if (/^https?:\/\//.test(imageUrl)) return imageUrl;
    if (typeof window !== "undefined") return new URL(imageUrl, window.location.origin).toString();
    return imageUrl;
  }, [imageUrl]);

  async function loadTerms() {
    setError(null);
    if (!isConnected || !address) {
      openConnectModal?.();
      return;
    }
    if (chainId !== robinhoodChain.id) {
      try { await switchChainAsync({ chainId: robinhoodChain.id }); } catch (e) { setError(friendlyError(e)); }
      return;
    }
    if (!publicClient) return;
    try {
      setStatus("READING ONCHAIN TERMS");
      const eligible = await publicClient.readContract({ address: PONS_V2_FACTORY, abi: ponsV2FactoryAbi, functionName: "canLaunch", args: [address] });
      if (!eligible) throw new Error("PONS V2 launches are currently gated and this wallet is not eligible.");
      const count = await publicClient.readContract({ address: PONS_V2_FACTORY, abi: ponsV2FactoryAbi, functionName: "launchConfigCount" });
      let selected: { id: bigint; config: { supply: bigint; curveFeeBps: bigint; phantomQuote: bigint; graduationThreshold: bigint; poolFee: number; tickSpacing: number; enabled: boolean } } | null = null;
      for (let id = 0n; id < count; id++) {
        const config = await publicClient.readContract({ address: PONS_V2_FACTORY, abi: ponsV2FactoryAbi, functionName: "getLaunchConfig", args: [id] });
        if (config.enabled) { selected = { id, config }; break; }
      }
      if (!selected) throw new Error("PONS V2 has no enabled launch configuration right now.");
      const [launchFee, maxCreatorTaxBps, expectedEconomics] = await Promise.all([
        publicClient.readContract({ address: PONS_V2_FACTORY, abi: ponsV2FactoryAbi, functionName: "launchFee" }),
        publicClient.readContract({ address: PONS_V2_FACTORY, abi: ponsV2FactoryAbi, functionName: "maxCreatorTaxBps" }),
        publicClient.readContract({ address: PONS_V2_FACTORY, abi: ponsV2FactoryAbi, functionName: "previewLaunchEconomics", args: [selected.id, PONS_NATIVE_PAIR] }),
      ]);
      setTerms({ configId: selected.id, supply: selected.config.supply, curveFeeBps: selected.config.curveFeeBps, graduationThreshold: selected.config.graduationThreshold, launchFee, maxCreatorTaxBps, expectedEconomics });
      setStatus("READY TO LAUNCH");
    } catch (e) {
      setStatus("FAILED");
      setError(friendlyError(e));
    }
  }

  async function launch() {
    if (!terms || !address || !publicClient || !accepted) return;
    const taxBps = Math.round(Number(creatorTax || "0") * 100);
    if (!name.trim() || !symbol.trim()) { setError("Token name and symbol are required."); return; }
    if (taxBps < 0 || BigInt(taxBps) > terms.maxCreatorTaxBps) { setError(`Creator tax must be between 0% and ${Number(terms.maxCreatorTaxBps) / 100}%.`); return; }
    try {
      setError(null);
      setStatus("CONFIRM IN WALLET");
      const salt = toHex(crypto.getRandomValues(new Uint8Array(32)));
      const hash = await writeContractAsync({
        address: PONS_V2_FACTORY,
        abi: ponsV2FactoryAbi,
        functionName: "launchToken",
        chainId: robinhoodChain.id,
        args: [{
          name: name.trim(), symbol: symbol.trim().toUpperCase(), logo: absoluteLogo,
          description: description.slice(0, 500),
          socials: { twitter: twitter.trim(), telegram: "", discord: "", website: website.trim(), farcaster: "" },
          creatorFeeRecipient: address, creatorTaxBps: taxBps, buybackEnabled,
          expectedEconomics: terms.expectedEconomics, salt,
        }, terms.configId, PONS_NATIVE_PAIR],
        value: terms.launchFee,
      });
      setStatus("WAITING FOR CONFIRMATION");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 180_000 });
      if (receipt.status !== "success") throw new Error("The launch transaction reverted.");
      for (const log of receipt.logs) {
        try {
          const event = decodeEventLog({ abi: ponsV2FactoryAbi, eventName: "TokenLaunched", data: log.data, topics: log.topics });
          if (event.args.token) { setTokenAddress(event.args.token); break; }
        } catch {}
      }
      setStatus("LAUNCHED");
    } catch (e) {
      setStatus("FAILED");
      setError(friendlyError(e));
    }
  }

  return (
    <div className="col-span-2">
      <p className="mb-2 text-center text-[10px] font-bold tracking-[0.18em] text-black/45">OPTIONAL · PONS V2 · ROBINHOOD CHAIN</p>
      <button onClick={() => setOpen(true)} className="w-full rounded-full bg-black py-3 font-display text-sm tracking-[0.15em] text-white">LAUNCH TOKEN ON PONS V2</button>
      {open && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4" onClick={() => !busy && setOpen(false)}>
        <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] bg-white p-6 text-left shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between gap-4"><div><h3 className="font-display text-xl">PONS V2 TOKEN LAUNCH</h3><p className="mt-1 text-xs leading-relaxed text-black/50">Robinhood Chain mainnet · fixed-supply ERC-20 · ETH bonding curve</p></div><button onClick={() => !busy && setOpen(false)} className="text-xl text-black/40">×</button></div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <label className="text-[10px] font-bold tracking-wider text-black/55">TOKEN NAME<input value={name} maxLength={64} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal text-black" /></label>
            <label className="text-[10px] font-bold tracking-wider text-black/55">SYMBOL<input value={symbol} maxLength={12} onChange={(e) => setSymbol(e.target.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal text-black" /></label>
            <label className="col-span-2 text-[10px] font-bold tracking-wider text-black/55">WEBSITE (OPTIONAL)<input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal text-black" /></label>
            <label className="col-span-2 text-[10px] font-bold tracking-wider text-black/55">X / TWITTER (OPTIONAL)<input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="https://x.com/..." className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal text-black" /></label>
            <label className="text-[10px] font-bold tracking-wider text-black/55">CREATOR TAX %<input value={creatorTax} type="number" min="0" step="0.01" onChange={(e) => setCreatorTax(e.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal text-black" /></label>
            <label className="flex items-center gap-2 pt-5 text-xs font-semibold"><input type="checkbox" checked={buybackEnabled} onChange={(e) => setBuybackEnabled(e.target.checked)} /> ENABLE BUYBACK</label>
          </div>
          {terms && <div className="mt-4 rounded-2xl bg-black/[0.04] p-4 text-xs leading-6 text-black/65"><div>Launch fee: <b>{formatEther(terms.launchFee)} ETH</b> + gas</div><div>Supply: <b>{terms.supply.toLocaleString()}</b></div><div>Curve fee: <b>{Number(terms.curveFeeBps) / 100}%</b></div><div>Graduation target: <b>{formatEther(terms.graduationThreshold)} ETH</b></div><div>Factory: <b className="break-all">{PONS_V2_FACTORY}</b></div></div>}
          {terms && <label className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-black/65"><input className="mt-1" type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />I understand this is an irreversible mainnet token launch, the token can lose all value, and my wallet will pay the displayed fee plus gas.</label>}
          {error && <p className="mt-3 text-xs leading-relaxed text-red-600">{error}</p>}
          {tokenAddress && <a className="mt-3 block break-all text-xs font-bold text-blue-600" href={`${robinhoodChain.blockExplorers.default.url}/address/${tokenAddress}`} target="_blank" rel="noreferrer">View token: {tokenAddress}</a>}
          <button disabled={busy || (Boolean(terms) && !accepted) || status === "LAUNCHED"} onClick={terms ? launch : loadTerms} className="mt-5 w-full rounded-full bg-black py-3 text-xs font-bold tracking-[0.15em] text-white disabled:opacity-45">{!isConnected ? "CONNECT WALLET" : chainId !== robinhoodChain.id ? "SWITCH TO ROBINHOOD MAINNET" : status}</button>
          <p className="mt-3 text-center text-[10px] leading-relaxed text-black/40">Terms are read directly from the official PONS V2 factory immediately before launch.</p>
        </div>
      </div>}
    </div>
  );
}
