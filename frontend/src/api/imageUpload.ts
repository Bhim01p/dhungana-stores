export type AdminImageType = 'product' | 'category' | 'paymentMethod' | 'profile';

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  overwrite: boolean;
  allowedFormats: string;
  signature: string;
}

interface CloudinaryUploadResponse {
  secure_url?: string;
  error?: { message?: string };
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/heic', 'image/heif',
]);

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return await response.json() as T;
  } catch {
    return null;
  }
}

export async function uploadImage(file: File, signaturePath: string, token: string, assetType?: AdminImageType): Promise<string> {
  if (!file.size) throw new Error('That image file is empty. Choose another photo.');
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) throw new Error('Choose a JPG, PNG, WebP, AVIF, or HEIC photo.');
  if (file.size > MAX_IMAGE_SIZE) throw new Error('Choose an image up to 5 MB.');

  let signatureResponse: Response;
  try {
    signatureResponse = await fetch(signaturePath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(assetType ? { assetType } : {}),
    });
  } catch {
    throw new Error('Could not reach the store server. Check your connection and try again.');
  }
  const signatureData = await readJson<UploadSignature & { error?: string }>(signatureResponse);
  if (!signatureResponse.ok || !signatureData) {
    throw new Error(signatureData?.error ?? 'The store server could not prepare this upload. Check the API deployment and try again.');
  }

  const form = new FormData();
  form.append('file', file);
  form.append('api_key', signatureData.apiKey);
  form.append('timestamp', String(signatureData.timestamp));
  form.append('signature', signatureData.signature);
  form.append('folder', signatureData.folder);
  form.append('public_id', signatureData.publicId);
  form.append('overwrite', String(signatureData.overwrite));
  form.append('allowed_formats', signatureData.allowedFormats);

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(signatureData.cloudName)}/image/upload`, {
      method: 'POST',
      body: form,
    });
  } catch {
    throw new Error('Could not reach the image service. Check your connection and try again.');
  }
  const uploadData = await readJson<CloudinaryUploadResponse>(uploadResponse);
  if (!uploadResponse.ok || !uploadData?.secure_url) {
    throw new Error(uploadData?.error?.message ?? 'The image upload failed. Please try again.');
  }
  const uploadedUrl = new URL(uploadData.secure_url);
  if (uploadedUrl.protocol !== 'https:' || uploadedUrl.hostname !== 'res.cloudinary.com' || !uploadedUrl.pathname.startsWith(`/${signatureData.cloudName}/image/upload/`)) {
    throw new Error('The image provider returned an unexpected URL.');
  }
  return uploadData.secure_url;
}
