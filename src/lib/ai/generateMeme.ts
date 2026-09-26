/**
 * Server-side meme generation orchestration.
 * UI never talks to fal.ai directly — it calls /api/generate-meme,
 * which routes through this module.
 *
 * Multi-reference flow: character + mutation + world assets are uploaded
 * to fal storage and submitted as image_urls[0..2] in a FIXED order.
 */
import { CHARACTER_MAP } from "@/data/characters";
import { MUTATION_MAP } from "@/data/mutations";
import { STYLE_MAP } from "@/data/styles";
import {
  GENERATION_TIMEOUT_MS,
  MEME_IMAGE_MODEL,
  MEME_IMAGE_SIZE,
} from "./config";
import { buildMemePrompt, MEME_NEGATIVE_PROMPT } from "./buildMemePrompt";
import { ensureFalConfigured, fal, isFalConfigured } from "./falClient";
import { uploadAsset } from "./uploadAsset";
import {
  generateMemeQuickRouter,
  readAssetDataUri,
} from "./quickrouter";
import { createLocalComposite } from "./localComposite";

/** QuickRouter relay keys are OpenAI-style (sk-...); fal keys are not. */
function isQuickRouterKey(): boolean {
  return (process.env.FAL_KEY ?? "").startsWith("sk-");
}

export type GenerationErrorCode =
  | "NOT_CONFIGURED"
  | "INVALID_INPUT"
  | "MISSING_ASSET"
  | "TIMEOUT"
  | "GENERATION_FAILED";

export interface GenerationSuccess {
  success: true;
  imageUrl: string;
  character: string;
  mutation: string;
  style: string;
  resultName: string;
  prompt: string;
  model: string;
  fallback?: boolean;
}

export interface GenerationFailure {
  success: false;
  code: GenerationErrorCode;
  message: string;
}

export type GenerationResult = GenerationSuccess | GenerationFailure;

export interface GenerateMemeInput {
  character: string; // lowercase id, e.g. "pepe"
  mutation: string;
  style: string;
}

/** Validate incoming values against the project data definitions. */
export function validateInput(input: unknown): GenerateMemeInput | null {
  if (typeof input !== "object" || input === null) return null;
  const { character, mutation, style } = input as Record<string, unknown>;
  if (
    typeof character !== "string" ||
    typeof mutation !== "string" ||
    typeof style !== "string"
  ) {
    return null;
  }
  if (
    !CHARACTER_MAP.has(character) ||
    !MUTATION_MAP.has(mutation) ||
    !STYLE_MAP.has(style)
  ) {
    return null;
  }
  return { character, mutation, style };
}

function extractImageUrl(data: unknown): string | null {
  const d = data as Record<string, unknown>;
  if (d && Array.isArray(d.images) && d.images.length > 0) {
    const first = d.images[0] as Record<string, unknown>;
    if (typeof first?.url === "string") return first.url;
  }
  if (d && d.image && typeof (d.image as Record<string, unknown>).url === "string") {
    return (d.image as Record<string, unknown>).url as string;
  }
  if (typeof d?.url === "string") return d.url;
  return null;
}

/** Translate provider HTTP status into a safe, actionable message. */
function providerErrorMessage(err: unknown): string {
  const status =
    typeof err === "object" && err !== null && "status" in err
      ? (err as { status?: number }).status
      : undefined;

  if (status === 401 || status === 403)
    return "The FAL_KEY was rejected. Check that the key is valid and active.";
  if (status === 402)
    return "The fal.ai account has insufficient balance for this generation.";
  if (status === 429)
    return "The AI provider is rate limiting. Wait a moment and try again.";
  if (status === 422)
    return "The provider rejected the request payload (invalid input or asset).";
  return "The AI reactor failed to produce an image. Please try again.";
}

export async function generateMeme(
  input: GenerateMemeInput
): Promise<GenerationResult> {
  if (!isFalConfigured()) {
    return {
      success: false,
      code: "NOT_CONFIGURED",
      message:
        "AI generation is not configured. Add FAL_KEY to .env.local and restart the server.",
    };
  }

  const character = CHARACTER_MAP.get(input.character);
  const mutation = MUTATION_MAP.get(input.mutation);
  const style = STYLE_MAP.get(input.style);
  if (!character || !mutation || !style) {
    return { success: false, code: "INVALID_INPUT", message: "Unknown reel values." };
  }

  const prompt = buildMemePrompt({
    characterName: character.name,
    mutationName: mutation.name,
    styleName: style.name,
    mutationId: mutation.id,
    styleId: style.id,
  });

  const localFallback = async (): Promise<GenerationSuccess> => ({
    success: true,
    imageUrl: await createLocalComposite({
      characterImage: character.image,
      mutationImage: mutation.image,
      worldImage: style.image,
      characterName: character.name,
      mutationName: mutation.name,
      worldName: style.name,
    }),
    character: character.name,
    mutation: mutation.name,
    style: style.name,
    resultName: `${style.name} ${mutation.name} ${character.name}`,
    prompt,
    model: "meme-slot-local-composite",
    fallback: true,
  });

  try {
    /* ---------------------------------------------------------------
     * PATH A — QuickRouter relay (sk-... key): OpenAI chat protocol,
     * three reference images sent inline as data URIs.
     * --------------------------------------------------------------- */
    if (isQuickRouterKey()) {
      console.log(`[MEME AI] Character asset resolved: ${character.image}`);
      console.log(`[MEME AI] Mutation asset resolved: ${mutation.image}`);
      console.log(`[MEME AI] World asset resolved: ${style.image}`);

      let imageUris: string[];
      try {
        imageUris = await Promise.all([
          readAssetDataUri(character.image),
          readAssetDataUri(mutation.image),
          readAssetDataUri(style.image),
        ]);
      } catch {
        return {
          success: false,
          code: "MISSING_ASSET",
          message: "One of the reference images could not be loaded.",
        };
      }
      console.log("[MEME AI] Assets read (3 reference images, QuickRouter mode)");

      const call = generateMemeQuickRouter({ prompt, imageUris });
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("TIMEOUT")), GENERATION_TIMEOUT_MS)
      );

      try {
        const { imageUrl, model } = (await Promise.race([
          call,
          timeout,
        ])) as { imageUrl: string; model: string };
        console.log(`[MEME AI] Generation completed: ${imageUrl.slice(0, 64)}...`);
        return {
          success: true,
          imageUrl,
          character: character.name,
          mutation: mutation.name,
          style: style.name,
          resultName: `${style.name} ${mutation.name} ${character.name}`,
          prompt,
          model,
        };
      } catch (err) {
        const isTimeout = err instanceof Error && err.message === "TIMEOUT";
        const code = err instanceof Error ? err.message : "";
        console.log(`[MEME AI] Generation error: ${code || "unknown"}`);
        console.log("[MEME AI] Provider unavailable; creating local composite fallback");
        return await localFallback();
      }
    }

    /* ---------------------------------------------------------------
     * PATH B — fal.ai direct (fal-format key)
     * --------------------------------------------------------------- */
    if (!ensureFalConfigured()) {
      return {
        success: false,
        code: "NOT_CONFIGURED",
        message: "AI generation is not configured.",
      };
    }

    // 1) resolve + upload ALL THREE reference assets (order is fixed)
    //    image_urls[0] = CHARACTER, [1] = MUTATION, [2] = WORLD
    console.log(`[MEME AI] Character asset resolved: ${character.image}`);
    console.log(`[MEME AI] Mutation asset resolved: ${mutation.image}`);
    console.log(`[MEME AI] World asset resolved: ${style.image}`);

    let characterUrl: string;
    let mutationUrl: string;
    let worldUrl: string;
    try {
      [characterUrl, mutationUrl, worldUrl] = await Promise.all([
        uploadAsset(character.image),
        uploadAsset(mutation.image),
        uploadAsset(style.image),
      ]);
    } catch (err) {
      // real file-read failures vs provider auth failures need different messages
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? (err as { status?: number }).status
          : undefined;
      if (status === 401 || status === 403) {
        console.log("[MEME AI] Asset upload rejected: FAL_KEY invalid (401/403)");
        return {
          success: false,
          code: "NOT_CONFIGURED",
          message:
            "FAL_KEY was rejected by fal.ai. Check that the key is a valid fal.ai key.",
        };
      }
      console.log(`[MEME AI] Asset upload failed: ${providerErrorMessage(err)}`);
      return {
        success: false,
        code: "MISSING_ASSET",
        message: "One of the reference images could not be loaded or uploaded.",
      };
    }
    console.log("[MEME AI] Assets uploaded (3 reference images)");

    // 2) run the multi-reference image-to-image model (queue-aware, hard timeout)
    console.log(`[MEME AI] Generation submitted: ${MEME_IMAGE_MODEL}`);
    const call = fal.subscribe(MEME_IMAGE_MODEL, {
      input: {
        prompt,
        image_urls: [characterUrl, mutationUrl, worldUrl],
        negative_prompt: MEME_NEGATIVE_PROMPT,
        image_size: MEME_IMAGE_SIZE,
        num_images: 1,
      },
      logs: false,
    });

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT")), GENERATION_TIMEOUT_MS)
    );

    const result = (await Promise.race([call, timeout])) as {
      data: unknown;
    };

    const imageUrl = extractImageUrl(result.data);
    if (!imageUrl) {
      return {
        success: false,
        code: "GENERATION_FAILED",
        message: "The model returned no image.",
      };
    }
    console.log(`[MEME AI] Generation completed: ${imageUrl.slice(0, 64)}...`);

    // result name format: STYLE + MUTATION + CHARACTER
    const resultName = `${style.name} ${mutation.name} ${character.name}`;

    return {
      success: true,
      imageUrl,
      character: character.name,
      mutation: mutation.name,
      style: style.name,
      resultName,
      prompt,
      model: MEME_IMAGE_MODEL,
    };
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "TIMEOUT";
    if (!isTimeout) console.log(`[MEME AI] Generation error: ${providerErrorMessage(err)}`);
    console.log("[MEME AI] Provider unavailable; creating local composite fallback");
    try {
      return await localFallback();
    } catch {
      return {
        success: false,
        code: isTimeout ? "TIMEOUT" : "GENERATION_FAILED",
        message: isTimeout ? "Generation timed out. Please try again." : providerErrorMessage(err),
      };
    }
  }
}
