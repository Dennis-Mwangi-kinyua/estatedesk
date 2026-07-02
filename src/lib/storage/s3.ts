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
    const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
    if (!response.Body) throw new Error("Stored document is empty.");
    return response.Body.transformToByteArray();
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

    if (config.publicBaseUrl) {
      return `${config.publicBaseUrl.replace(/\/$/, "")}/${key}`;
    }

    return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  }
}

export const storage = new S3StorageProvider();
