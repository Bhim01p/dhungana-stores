import { createHash, randomUUID } from 'node:crypto';
import { env } from '../config/env';

export type ImageFolder = 'store/products' | 'store/categories' | 'store/payment-methods' | 'store/profiles' | `store/customers/${string}` | `store/admins/${string}`;
const ALLOWED_FORMATS = 'jpg,jpeg,png,webp,avif,heic,heif';

export function createImageUploadSignature(folder: ImageFolder) {
  const { CLOUDINARY_CLOUD_NAME: cloudName, CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret } = env;
  if (!cloudName || !apiKey || !apiSecret) {
    throw Object.assign(new Error('Image uploads are not configured yet. Add the Cloudinary settings to the backend environment.'), { statusCode: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = randomUUID();
  const parameters: Record<string, string> = {
    allowed_formats: ALLOWED_FORMATS,
    folder,
    overwrite: 'false',
    public_id: publicId,
    timestamp: String(timestamp),
  };
  const canonical = Object.keys(parameters).sort().map((key) => `${key}=${parameters[key]}`).join('&');
  const signature = createHash('sha1').update(`${canonical}${apiSecret}`).digest('hex');

  return { cloudName, apiKey, timestamp, folder, publicId, overwrite: false, allowedFormats: ALLOWED_FORMATS, signature };
}
