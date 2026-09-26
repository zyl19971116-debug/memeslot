export interface StoredAsset { uri: string }

export interface PermanentStorageAdapter {
  uploadGeneratedMeme(sourceUrl: string, generationId: string): Promise<StoredAsset>;
  uploadMetadata(metadata: Record<string, unknown>, generationId: string): Promise<StoredAsset>;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Permanent decentralized storage is not configured. Minting is disabled to protect NFT permanence.");
    this.name = "StorageNotConfiguredError";
  }
}

export function getStorageAdapter(): PermanentStorageAdapter {
  throw new StorageNotConfiguredError();
}

export async function uploadGeneratedMeme(sourceUrl: string, generationId: string) {
  return getStorageAdapter().uploadGeneratedMeme(sourceUrl, generationId);
}

export async function uploadMetadata(metadata: Record<string, unknown>, generationId: string) {
  return getStorageAdapter().uploadMetadata(metadata, generationId);
}
