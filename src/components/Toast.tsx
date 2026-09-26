"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useSlotStore } from "@/lib/slotStore";

export default function Toast() {
  const toast = useSlotStore((s) => s.toast);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed bottom-8 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-black px-6 py-3 text-xs font-bold tracking-[0.2em] text-white shadow-2xl"
          style={{ boxShadow: "0 0 24px rgba(57,255,20,0.35)" }}
        >
          {toast}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
