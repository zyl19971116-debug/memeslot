/**
 * SERVER-ONLY fal.ai client bootstrap.
 * Never import this file from client components — it reads FAL_KEY.
 */
import { fal } from "@fal-ai/client";

let configured = false;

export function ensureFalConfigured(): boolean {
  const key = process.env.FAL_KEY;
  if (!key || key.trim() === "") return false;
  if (!configured) {
    fal.config({ credentials: key });
    configured = true;
  }
  return true;
}

export function isFalConfigured(): boolean {
  const key = process.env.FAL_KEY;
  return typeof key === "string" && key.trim() !== "";
}

export { fal };
