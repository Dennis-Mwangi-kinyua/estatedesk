import "server-only";
import { ASSET_READ_TIMEOUT_MS, collectAssetBytes } from "./read-limits";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  StorageProvider,
  UploadFileInput,
  UploadedFileResult,
} from "@/lib/storage/types";
import { getStorageConfig } from "@/lib/config/env";

let s3Client: S3Client | null = null;

function getS3Client() {
  const config = getStorageConfig();

  s3Client ??= new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: !!config.endpoint,
    credentials: config.credentials,
  });

  return { client: s3Client, config };
}

export class S3StorageProvider implements StorageProvider {
  async downloadFile(key: string): Promise<Uint8Array> {
    const { client, config } = getS3Client();
    const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }), { abortSignal: AbortSignal.timeout(ASSET_READ_TIMEOUT_MS) });
    if (!response.Body) throw new Error("Stored document is empty.");
    try {
      return await collectAssetBytes(response.Body as AsyncIterable<Uint8Array>, response.ContentLength);
    } finally {
      if ("destroy" in response.Body && typeof response.Body.destroy === "function") response.Body.destroy();
    }
  }

  async uploadFile(input: UploadFileInput): Promise<UploadedFileResult> {
    const { client, config } = getS3Client();

    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    return {
      key: input.key,
      url: this.getPublicUrl(input.key),
      bucket: config.bucket,
      contentType: input.contentType,
    };
  }

  async deleteFile(key: string): Promise<void> {
    const { client, config } = getS3Client();

    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );
  }

  getPublicUrl(key: string): string {
    const config = getStorageConfig();
    const encodedKey = key.split("/").map(encodeURIComponent).join("/");

    if (config.publicBaseUrl) {
      return `${config.publicBaseUrl.replace(/\/+$/, "")}/${encodedKey}`;
    }

    if (config.endpoint) {
      return `${config.endpoint.replace(/\/+$/, "")}/${encodeURIComponent(config.bucket)}/${encodedKey}`;
    }
    return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${encodedKey}`;
  }
}

export const storage = new S3StorageProvider();
