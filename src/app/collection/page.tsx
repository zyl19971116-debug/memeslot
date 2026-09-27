"use client";

import { useEffect, useMemo, useState } from "react";
import { useDiscoveryStore } from "@/lib/storage";
import RarityBadge from "@/components/RarityBadge";
import { CHARACTERS } from "@/data/characters";
import { MUTATIONS } from "@/data/mutations";
import { STYLES } from "@/data/styles";
import { PLACEHOLDER_IMAGE, type Rarity } from "@/data/base";
import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { directLauncherAbi, directLauncherAddress, isDirectLauncherConfigured } from "@/lib/contracts/directLauncher";
import { ROBINHOOD_EXPLORER, robinhoodChain } from "@/lib/web3/robinhoodChain";

const FILTERS = ["ALL", "COMMON", "RARE", "EPIC", "LEGENDARY", "SECRET"] as const;

const CHAR_NAME = new Map(CHARACTERS.map((c) => [c.id, c.name]));
const MUT_NAME = new Map(MUTATIONS.map((m) => [m.id, m.name]));
const STYLE_NAME = new Map(STYLES.map((s) => [s.id, s.name]));

const short = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;
const TOKEN_LAUNCHER_START_BLOCK = 74_000_000n;
const HIDDEN_LAUNCHED_TOKENS = new Set([
  "0x5f54c20eae92e06497255cfa05ce1a75dd2648e9",
]);

function LaunchedTokens({ creator, title = "LAUNCHED TOKENS", description = "All tradeable tokens published through MEME SLOT on Robinhood Chain." }: { creator?: `0x${string}`; title?: string; description?: string }) {
  const client = usePublicClient({ chainId: robinhoodChain.id });
  const query = useQuery({
    queryKey: ["launched-tokens", creator ?? "all"],
    enabled: Boolean(client && isDirectLauncherConfigured),
    queryFn: async () => {
      if (!client) return [];
      const latest = await client.getBlockNumber();
      const logs = [];
      for (let fromBlock = TOKEN_LAUNCHER_START_BLOCK; fromBlock <= latest; fromBlock += 5_000n) {
        const toBlock = fromBlock + 4_999n > latest ? latest : fromBlock + 4_999n;
        const chunk = await client.getContractEvents({
          address: directLauncherAddress,
          abi: directLauncherAbi,
          eventName: "TokenLaunched",
          ...(creator ? { args: { creator } } : {}),
          fromBlock,
          toBlock,
        });
        logs.push(...chunk);
      }
      const visibleLogs = logs.filter((log) => {
        const token = log.args.token;
        return token && !HIDDEN_LAUNCHED_TOKENS.has(token.toLowerCase());
      });
      return Promise.all(visibleLogs.reverse().map(async (log) => {
        const token = log.args.token!;
        const tokenAbi = [
          { type: "function", name: "name", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
          { type: "function", name: "symbol", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
          { type: "function", name: "logo", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
          { type: "function", name: "description", stateMutability: "view", inputs: [], outputs: [{ type: "string" }] },
        ] as const;
        const [name, symbol, logo, description] = await Promise.all([
          client.readContract({ address: token, abi: tokenAbi, functionName: "name" }),
          client.readContract({ address: token, abi: tokenAbi, functionName: "symbol" }),
          client.readContract({ address: token, abi: tokenAbi, functionName: "logo" }),
          client.readContract({ address: token, abi: tokenAbi, functionName: "description" }),
        ]);
        return { token, pool: log.args.pool!, transactionHash: log.transactionHash, name, symbol, logo, description };
      }));
    },
  });

  return (
    <section className="mb-14">
      <div className="flex items-end justify-between gap-4">
        <div><h1 className="font-display text-3xl tracking-tight sm:text-4xl">{title}</h1><p className="mt-2 text-sm text-black/50">{description}</p></div>
        <span className="rounded-full bg-black px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-white"><span className="text-[#39ff14]">●</span> LIVE ONCHAIN</span>
      </div>
      {query.isLoading ? (
        <div className="py-16 text-center text-sm text-black/40">READING TOKEN LAUNCHES...</div>
      ) : query.isError ? (
        <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-700">Could not read launched tokens. Refresh and try again.</div>
      ) : query.data?.length ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((item) => (
            <article key={item.token} className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.logo} alt={item.name} className="aspect-square w-full bg-black/[0.03] object-cover" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3"><div><div className="font-display text-lg">{item.name}</div><div className="mt-1 text-[10px] font-bold tracking-[0.16em] text-black/45">${item.symbol}</div></div><span className="rounded-full bg-green-100 px-2.5 py-1 text-[9px] font-bold text-green-800">LIVE</span></div>
                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-black/50">{item.description}</p>
                <div className="mt-4 space-y-1 text-[10px] text-black/45"><div>TOKEN · {short(item.token)}</div><div>POOL · {short(item.pool)}</div></div>
                <div className="mt-4 grid grid-cols-2 gap-2"><a href={`${ROBINHOOD_EXPLORER}/address/${item.token}`} target="_blank" rel="noreferrer" className="rounded-full bg-black py-2.5 text-center text-[9px] font-bold tracking-[0.12em] text-white">VIEW TOKEN</a><a href={`${ROBINHOOD_EXPLORER}/tx/${item.transactionHash}`} target="_blank" rel="noreferrer" className="rounded-full border border-black/15 py-2.5 text-center text-[9px] font-bold tracking-[0.12em]">TRANSACTION</a></div>
              </div>
            </article>
          ))}
        </div>
      ) : <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white/60 py-16 text-center text-sm text-black/45">NO TOKENS HAVE BEEN LAUNCHED YET.</div>}
    </section>
  );
}

export default function CollectionPage() {
  const discoveries = useDiscoveryStore((s) => s.discoveries);
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ALL");
  const [mounted, setMounted] = useState(false);

  // avoid SSR/client hydration mismatch with persisted localStorage state
  useEffect(() => {
    setMounted(true);
  }, []);

  const list = useMemo(
    () => (filter === "ALL" ? discoveries : discoveries.filter((d) => d.rarity === filter)),
    [discoveries, filter]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <LaunchedTokens />
      <div className="mb-10 border-t border-black/10 pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="ml-auto rounded-2xl border border-black/10 bg-white px-5 py-3 text-center shadow-card">
          <div className="text-[10px] font-bold tracking-[0.25em] text-black/40">DISCOVERED</div>
          <div className="font-display text-2xl">
            {discoveries.length} <span className="text-black/30">/ ???</span>
          </div>
        </div>
      </div>

      {!isConnected || !address ? (
        <button onClick={openConnectModal} className="mt-8 w-full rounded-3xl border border-dashed border-black/15 bg-white py-16 text-sm font-bold tracking-[0.14em]">CONNECT WALLET TO VIEW YOUR TOKENS &amp; MEMES</button>
      ) : (
        <>
          <div className="mt-10">
            <LaunchedTokens creator={address} title="MY LAUNCHED TOKENS" description="Tradeable tokens published by the connected wallet." />
          </div>
          <h2 className="mt-4 font-display text-2xl tracking-tight">SAVED MEMES</h2>

      <div className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-bold tracking-[0.18em] transition-colors ${
              filter === f ? "bg-black text-white" : "bg-white text-black/55 hover:bg-black/5"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {!mounted ? (
        <div className="py-24 text-center text-sm text-black/40">LOADING...</div>
      ) : list.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-dashed border-black/15 bg-white/60 py-24 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PLACEHOLDER_IMAGE}
            alt="placeholder"
            className="mx-auto h-24 w-24 object-contain opacity-60"
          />
          <p className="mt-4 text-sm text-black/45">
            NOTHING DISCOVERED YET.
            <br />
            GO SPIN THE MACHINE.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((d) => (
            <div
              key={d.id}
              className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-card transition-shadow hover:shadow-cardHover"
            >
              <div className="relative aspect-square overflow-hidden bg-black/[0.03]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={d.image}
                  alt={d.resultName}
                  className="h-full w-full object-cover"
                  draggable={false}
                />
                <div className="absolute left-3 top-3">
                  <RarityBadge rarity={d.rarity as Rarity} />
                </div>
                {d.specialCombo && (
                  <div className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[9px] font-bold tracking-[0.15em] text-white">
                    SPECIAL {d.specialCombo}
                  </div>
                )}
              </div>
              <div className="px-4 py-3">
                <div className="font-display text-sm tracking-tight">{d.resultName}</div>
                <div className="mt-0.5 text-[10px] font-semibold tracking-[0.12em] text-black/40">
                  {CHAR_NAME.get(d.character)} + {MUT_NAME.get(d.mutation)} +{" "}
                  {STYLE_NAME.get(d.style)}
                </div>
                <div className="mt-1 text-[10px] text-black/30">
                  {new Date(d.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
      </div>
    </div>
  );
}
