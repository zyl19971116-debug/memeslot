import { NextRequest, NextResponse } from "next/server";
import { keccak256, stringToHex } from "viem";
import {
  StorageNotConfiguredError,
  uploadGeneratedMeme,
  uploadMetadata,
} from "@/lib/storage/permanent";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { generationId, imageUrl, character, mutation, world, name } = body ?? {};
    if (
      ![generationId, imageUrl, character, mutation, world, name].every(
        (value) => typeof value === "string" && value.length > 0,
      )
    ) {
      return NextResponse.json(
        { error: "Invalid V2 publication request." },
        { status: 400 },
      );
    }
    if (!/^https?:\/\//.test(imageUrl) && !imageUrl.startsWith("/generated/")) {
      return NextResponse.json(
        { error: "Unsupported generated image URL." },
        { status: 400 },
      );
    }

    const image = await uploadGeneratedMeme(imageUrl, generationId);
    const metadata = {
      name,
      description: "Created by MEME SLOT AI and published on Robinhood Chain.",
      image: image.uri,
      attributes: [
        { trait_type: "Character", value: character },
        { trait_type: "Mutation", value: mutation },
        { trait_type: "World", value: world },
      ],
    };
    const storedMetadata = await uploadMetadata(metadata, generationId);

    return NextResponse.json({
      version: "v2",
      chainId: 4663,
      generationHash: keccak256(stringToHex(generationId)),
      imageURI: image.uri,
      metadataURI: storedMetadata.uri,
    });
  } catch (error) {
    if (error instanceof StorageNotConfiguredError) {
      return NextResponse.json(
        {
          error: error.message,
          code: "STORAGE_NOT_CONFIGURED",
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: "Meme publication failed. Nothing was submitted onchain." },
      { status: 500 },
    );
  }
}
