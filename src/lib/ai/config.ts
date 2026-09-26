/**
 * AI generation configuration — the ONLY place where the model id lives.
 * Change MEME_IMAGE_MODEL here to switch models; nothing else needs editing.
 */

/** fal.ai multi-reference image-to-image model (accepts 1-3 image_urls). */
export const MEME_IMAGE_MODEL = "wan/v2.6/image-to-image";

/**
 * QuickRouter (OpenAI-compatible relay) settings — used when FAL_KEY
 * holds a QuickRouter key (sk-...). The chat-image model accepts multiple
 * reference images inline and returns ONE new coherent image.
 */
export const QUICKROUTER_BASE_URL = "https://api.quickrouter.ai/v1";
export const QUICKROUTER_IMAGE_MODEL = "gemini-3.1-flash-image";

/** Output size requested from the model (1:1 square HD). */
export const MEME_IMAGE_SIZE = "square_hd" as const;

/** Server-side timeout for a single generation call (ms). */
export const GENERATION_TIMEOUT_MS = 120_000;

/** How many generations one client (IP) may request per rolling minute. */
export const RATE_LIMIT_PER_MINUTE = 8;

/**
 * Should the 10 curated special combos also go through AI generation?
 * false = special combos keep their pre-made creation images (fast, always works).
 */
export const AI_FOR_SPECIAL_COMBOS = false;

/** Server-side root of the public assets (read from disk, then uploaded to fal storage). */
export const PUBLIC_ASSET_ROOT = "public";

/** Hard cap for the generation prompt (wan/v2.6 rejects prompts > 2000 chars). */
export const MAX_PROMPT_CHARS = 2000;
