export type UploadedFileResult = {
  key: string;
  url: string;
  bucket?: string;
  contentType?: string;
};

export type UploadFileInput = {
  key: string;
  body: Buffer | Uint8Array | string;
  contentType?: string;
};

export interface StorageProvider {
  uploadFile(input: UploadFileInput): Promise<UploadedFileResult>;
  deleteFile(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}