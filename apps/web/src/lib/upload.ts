import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "./logger";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const ALLOWED_DOC_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getS3Client() {
  const region = process.env.S3_REGION ?? "us-east-1";
  const endpoint = process.env.S3_ENDPOINT;

  return new S3Client({
    region,
    ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY ?? "",
      secretAccessKey: process.env.S3_SECRET_KEY ?? "",
    },
  });
}

export type UploadBucket =
  | "store-logos"
  | "store-banners"
  | "license-docs"
  | "product-images";

interface PresignedUploadParams {
  bucket: UploadBucket;
  key: string;
  contentType: string;
  maxSizeBytes?: number;
}

interface PresignedUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

function validateContentType(contentType: string, bucket: UploadBucket): boolean {
  if (contentType === "image/svg+xml") return false;

  if (bucket === "license-docs") {
    return ALLOWED_DOC_TYPES.includes(contentType);
  }
  return ALLOWED_IMAGE_TYPES.includes(contentType);
}

export async function getPresignedUploadUrl(
  params: PresignedUploadParams,
): Promise<PresignedUploadResult> {
  const { bucket, key, contentType, maxSizeBytes = MAX_FILE_SIZE } = params;

  if (!validateContentType(contentType, bucket)) {
    throw new Error(`Invalid content type: ${contentType}`);
  }

  if (maxSizeBytes > MAX_FILE_SIZE) {
    throw new Error(`Max file size cannot exceed ${MAX_FILE_SIZE} bytes`);
  }

  const s3Bucket = process.env.S3_BUCKET ?? "smoke-shop-uploads";
  const s3Key = `${bucket}/${key}`;

  const client = getS3Client();
  const command = new PutObjectCommand({
    Bucket: s3Bucket,
    Key: s3Key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 600 });

  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? "us-east-1";
  const publicUrl = endpoint
    ? `${endpoint}/${s3Bucket}/${s3Key}`
    : `https://${s3Bucket}.s3.${region}.amazonaws.com/${s3Key}`;

  logger.info("Generated presigned upload URL", { bucket, key: s3Key });

  return { uploadUrl, publicUrl, key: s3Key };
}

export function generateUploadKey(
  entityType: "stores" | "users" | "products",
  entityId: string,
  filename: string,
): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
  const timestamp = Date.now();
  return `${entityType}/${entityId}/${timestamp}.${ext}`;
}
