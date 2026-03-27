import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type {
  StorageProvider,
  UploadFileInput,
  UploadedFileResult,
} from "@/lib/storage/types";

const bucket = process.env.S3_BUCKET!;
const region = process.env.S3_REGION!;
const endpoint = process.env.S3_ENDPOINT || undefined;
const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL || "";

export const s3 = new S3Client({
  region,
  endpoint,
  forcePathStyle: !!endpoint,
  credentials:
    process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export class S3StorageProvider implements StorageProvider {
  async uploadFile(input: UploadFileInput): Promise<UploadedFileResult> {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
      })
    );

    return {
      key: input.key,
      url: this.getPublicUrl(input.key),
      bucket,
      contentType: input.contentType,
    };
  }

  async deleteFile(key: string): Promise<void> {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  }

  getPublicUrl(key: string): string {
    if (publicBaseUrl) {
      return `${publicBaseUrl.replace(/\/$/, "")}/${key}`;
    }

    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }
}

export const storage = new S3StorageProvider();