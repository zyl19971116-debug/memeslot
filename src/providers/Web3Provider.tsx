"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

const Web3ProviderInner = dynamic(() => import("./Web3ProviderInner"), {
  ssr: false,
  loading: () => null,
});

export default function Web3Provider({ children }: { children: ReactNode }) {
  return <Web3ProviderInner>{children}</Web3ProviderInner>;
}
