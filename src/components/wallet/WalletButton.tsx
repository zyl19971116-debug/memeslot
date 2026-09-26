"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect, useSwitchChain } from "wagmi";
import { useEffect, useRef, useState } from "react";
import { ROBINHOOD_EXPLORER, robinhoodChain } from "@/lib/web3/robinhoodChain";

const short = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

export default function WalletButton() {
  const { address, isConnected, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (!isConnected || !address) {
    return (
      <button onClick={openConnectModal} className="whitespace-nowrap rounded-full bg-black px-4 py-2 text-[10px] font-bold tracking-[0.12em] text-white sm:text-xs">
        CONNECT WALLET
      </button>
    );
  }

  if (chainId !== robinhoodChain.id) {
    return (
      <button onClick={() => switchChain({ chainId: robinhoodChain.id })} disabled={isPending} className="whitespace-nowrap rounded-full bg-[#39ff14] px-4 py-2 text-[10px] font-bold tracking-[0.1em] text-[#04220a]">
        {isPending ? "SWITCHING..." : "SWITCH TO ROBINHOOD"}
      </button>
    );
  }

  return (
    <div ref={menu} className="relative">
      <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 whitespace-nowrap rounded-full bg-black px-4 py-2 text-[10px] font-bold tracking-[0.1em] text-white">
        <span className="h-2 w-2 rounded-full bg-[#39ff14]" /> RH · {short(address)}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 text-[10px] font-bold tracking-[0.12em] shadow-2xl">
          <button className="block w-full rounded-xl px-3 py-2 text-left hover:bg-black/5" onClick={() => navigator.clipboard.writeText(address)}>COPY ADDRESS</button>
          <a className="block rounded-xl px-3 py-2 hover:bg-black/5" href={`${ROBINHOOD_EXPLORER}/address/${address}`} target="_blank" rel="noreferrer">VIEW ON EXPLORER</a>
          <button className="block w-full rounded-xl px-3 py-2 text-left text-red-600 hover:bg-red-50" onClick={() => disconnect()}>DISCONNECT</button>
        </div>
      )}
    </div>
  );
}
