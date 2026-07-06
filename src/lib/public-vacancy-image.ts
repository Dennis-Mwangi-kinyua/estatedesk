function buildS3PublicUrl(key: string) {
  if (key.startsWith("http://") || key.startsWith("https://")) {
    return key;
  }

  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL;
  const bucket = process.env.S3_BUCKET ?? process.env.S3_BUCKET_NAME;
  const region = process.env.S3_REGION;

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}/${key.replace(/^\/+/, "")}`;
  }

  if (bucket && region) {
    return `https://${bucket}.s3.${region}.amazonaws.com/${key.replace(/^\/+/, "")}`;
  }

  return null;
}

export function publicVacancyImageUrl(key: string | null | undefined) {
  if (!key) return null;

  if (key.startsWith("/") || key.startsWith("http://") || key.startsWith("https://")) {
    return key.startsWith("/") ? key : key;
  }

  const s3Url = buildS3PublicUrl(key);
  if (s3Url) return s3Url;

  return `/${key.replace(/^public\//, "")}`;
}