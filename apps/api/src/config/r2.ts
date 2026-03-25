import * as Minio from 'minio';
import { env } from './env.js';
import { randomUUID } from 'crypto';

// Extract hostname from endpoint URL (minio expects host without protocol)
const endpointUrl = new URL(env.R2_ENDPOINT || 'https://localhost');

const minio = new Minio.Client({
  endPoint: endpointUrl.hostname,
  useSSL: true,
  accessKey: env.R2_ACCESS_KEY_ID,
  secretKey: env.R2_SECRET_ACCESS_KEY,
  region: 'auto',
  pathStyle: true,
});

export async function uploadFile(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string = 'uploads',
): Promise<string> {
  const ext = originalName.split('.').pop() || 'jpg';
  const key = `${folder}/${randomUUID()}.${ext}`;

  await minio.putObject(env.R2_BUCKET_NAME, key, buffer, buffer.length, {
    'Content-Type': contentType,
  });

  if (env.R2_PUBLIC_URL) {
    return `${env.R2_PUBLIC_URL}/${key}`;
  }
  return key;
}

export async function deleteFile(key: string): Promise<void> {
  const fileKey = env.R2_PUBLIC_URL && key.startsWith(env.R2_PUBLIC_URL)
    ? key.replace(`${env.R2_PUBLIC_URL}/`, '')
    : key;

  await minio.removeObject(env.R2_BUCKET_NAME, fileKey);
}
