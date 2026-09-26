import { getMutationPrompt } from "./mutationPrompts";
import { getStylePrompt } from "./stylePrompts";
import { MAX_PROMPT_CHARS } from "./config";

export interface MemePromptInput {
  characterName: string;
  mutationName: string;
  styleName: string;
  /** lowercase ids used to look up structured prompt fragments */
  mutationId: string;
  styleId: string;
}

/**
 * Build the multi-reference prompt for wan/v2.6/image-to-image.
 * image_urls order is FIXED: [0]=character, [1]=mutation, [2]=world —
 * the prompt refers to them as "image 1", "image 2", "image 3".
 * Must stay under MAX_PROMPT_CHARS (2000).
 */
export function buildMemePrompt(input: MemePromptInput): string {
  const { characterName, mutationName, styleName, mutationId, styleId } = input;

  const mutationBlock = getMutationPrompt(mutationId);
  const styleBlock = getStylePrompt(styleId);

  const lines = [
    `Create: ${styleName} ${mutationName} ${characterName}. ONE coherent new meme character scene.`,
    ``,
    `Image 1 is the PRIMARY CHARACTER reference. Preserve the recognizable identity, face, proportions, silhouette, clothing language and personality of the character from image 1.`,
    ``,
    `Image 2 is the MUTATION CONCEPT reference. Apply the mutation concept naturally to the character from image 1. Do not paste image 2 onto the character.`,
    ``,
    `Image 3 is the WORLD / ENVIRONMENT reference. Place the transformed character naturally inside a world inspired by image 3.`,
    ``,
    `Character: ${characterName}`,
    `Mutation: ${mutationName} — ${mutationBlock}`,
    `World: ${styleName} — ${styleBlock}`,
    ``,
    `Visual style: premium 3D CGI, high-end collectible character, modern meme culture, cinematic lighting, high detail, strong depth, full-body hero composition, centered character, square composition, professional game promotional artwork.`,
    ``,
    `Preserve image 1 character identity. Do not create three separate subjects. Do not create a collage, triptych or split-screen imagery. Do not display the reference images as objects. Create ONE new integrated character.`,
  ];

  const prompt = lines.join("\n");
  return prompt.length <= MAX_PROMPT_CHARS
    ? prompt
    : prompt.slice(0, MAX_PROMPT_CHARS);
}

/** Negative prompt to further suppress collage/split layouts (max 500 chars). */
export const MEME_NEGATIVE_PROMPT =
  "collage, triptych, split screen, three panels, grid layout, multiple separate subjects, watermarks, text overlay, low quality, deformed";
