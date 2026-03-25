import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { env } from './env.js';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  region: 'auto',
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string = 'uploads',
): Promise<string> {
  const ext = originalName.split('.').pop() || 'jpg';
  const key = `${folder}/${randomUUID()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  // Return public URL or key
  if (env.R2_PUBLIC_URL) {
    return `${env.R2_PUBLIC_URL}/${key}`;
  }
  return key;
}

export async function deleteFile(key: string): Promise<void> {
  // If it's a full URL, extract the key
  const fileKey = env.R2_PUBLIC_URL && key.startsWith(env.R2_PUBLIC_URL)
    ? key.replace(`${env.R2_PUBLIC_URL}/`, '')
    : key;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: fileKey,
    }),
  );
}
