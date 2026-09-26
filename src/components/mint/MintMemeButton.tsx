"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { decodeEventLog, type Hex } from "viem";
import { useAccount, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { useEffect, useState } from "react";
import { isMemeSlotConfigured, memeSlotAbi, memeSlotAddress } from "@/lib/contracts/memeSlot";
import { robinhoodChain } from "@/lib/web3/robinhoodChain";

type MintState = "PUBLISH TO ROBINHOOD" | "PREPARING MEME" | "CONFIRM IN WALLET" | "TRANSACTION SUBMITTED" | "PUBLISHING ON ROBINHOOD" | "PUBLISHED ONCHAIN" | "FAILED";

interface Props {
  generationId: string | null;
  imageUrl: string;
  name: string;
  character: string;
  mutation: string;
  world: string;
  onMinted?: (tokenId: string, hash: Hex) => void;
}

function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Minting failed.";
  if (/rejected|denied|user rejected/i.test(message)) return "Wallet request rejected. No NFT was minted.";
  if (/insufficient funds/i.test(message)) return "Insufficient ETH for Robinhood Chain gas.";
  if (/GenerationAlreadyMinted|duplicate/i.test(message)) return "This generated meme has already been minted.";
  if (/timeout/i.test(message)) return "Transaction confirmation timed out. Check the explorer before retrying.";
  return message.length > 180 ? "Mint failed. Check your wallet and Robinhood Chain RPC, then retry." : message;
}

export default function MintMemeButton(props: Props) {
  const { address, isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient({ chainId: robinhoodChain.id });
  const [state, setState] = useState<MintState>("PUBLISH TO ROBINHOOD");
  const [error, setError] = useState<string | null>(null);
  const [resumeAfterConnect, setResumeAfterConnect] = useState(false);
  const busy = !["PUBLISH TO ROBINHOOD", "FAILED"].includes(state);

  useEffect(() => {
    if (resumeAfterConnect && isConnected) {
      setResumeAfterConnect(false);
      void beginMint();
    }
    // beginMint deliberately omitted: this effect reacts only to a completed connection
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeAfterConnect, isConnected]);

  const beginMint = async () => {
    setError(null);
    if (!isConnected || !address) {
      setResumeAfterConnect(true);
      openConnectModal?.();
      return;
    }
    if (chainId !== robinhoodChain.id) {
      try { await switchChainAsync({ chainId: robinhoodChain.id }); } catch (e) { setState("FAILED"); setError(friendlyError(e)); }
      return;
    }
    if (!props.generationId) {
      setState("FAILED");
      setError("This result has no server generation ID. Generate a new AI meme before minting.");
      return;
    }
    if (!isMemeSlotConfigured) {
      setState("FAILED");
      setError("MemeSlotCollection is not configured. Set NEXT_PUBLIC_MEME_SLOT_CONTRACT_ADDRESS after testnet deployment.");
      return;
    }

    try {
      setState("PREPARING MEME");
      const response = await fetch("/api/v2/publish-meme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...props }),
      });
      const prepared = await response.json();
      if (!response.ok) throw new Error(prepared.error || "Meme persistence failed.");

      setState("CONFIRM IN WALLET");
      const hash = await writeContractAsync({
        address: memeSlotAddress,
        abi: memeSlotAbi,
        functionName: "mintMeme",
        chainId: robinhoodChain.id,
        args: [prepared.generationHash, props.character, props.mutation, props.world, prepared.imageURI, prepared.metadataURI],
      });
      setState("TRANSACTION SUBMITTED");
      if (!publicClient) throw new Error("Robinhood Chain RPC unavailable.");
      setState("PUBLISHING ON ROBINHOOD");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      if (receipt.status !== "success") throw new Error("Mint transaction reverted.");
      const event = receipt.logs.map((log) => {
        try { return decodeEventLog({ abi: memeSlotAbi, eventName: "MemeMinted", data: log.data, topics: log.topics }); } catch { return null; }
      }).find(Boolean);
      const tokenId = event && "args" in event ? String(event.args.tokenId) : "—";
      setState("PUBLISHED ONCHAIN");
      props.onMinted?.(tokenId, hash);
    } catch (e) {
      setState("FAILED");
      setError(friendlyError(e));
    }
  };

  const label = !isConnected ? "CONNECT WALLET TO PUBLISH" : chainId !== robinhoodChain.id ? "SWITCH TO ROBINHOOD MAINNET" : state;
  return (
    <div className="col-span-2">
      <p className="mb-2 text-center text-[10px] font-bold tracking-[0.18em] text-black/45">
        OPTIONAL · ROBINHOOD CHAIN MAINNET · V2
      </p>
      <button onClick={beginMint} disabled={busy} className="w-full rounded-full bg-black py-3 font-display text-sm tracking-[0.15em] text-white transition-opacity disabled:cursor-wait disabled:opacity-60">
        {label}
      </button>
      {error && <p className="mt-2 px-2 text-center text-[11px] leading-relaxed text-red-600">{error}</p>}
    </div>
  );
}
