import { useState } from 'react';
import { uploadImage, type AdminImageType } from '../api/imageUpload';

interface Props {
  token: string;
  assetType: AdminImageType;
  onUploaded: (url: string) => void;
  multiple?: boolean;
  maxFiles?: number;
}

export default function AdminImageUpload({ token, assetType, onUploaded, multiple = false, maxFiles = 8 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files?: FileList | null) => {
    if (!files?.length) return;
    const selected = Array.from(files).slice(0, multiple ? maxFiles : 1);
    if (selected.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of selected) {
        const url = await uploadImage(file, '/api/admin/uploads/image-signature', token, assetType);
        onUploaded(url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload this image.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mt-2">
      <label className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
        {uploading ? 'Uploading…' : multiple ? 'Choose photos to upload' : 'Choose image to upload'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif,.heic,.heif"
          multiple={multiple}
          className="sr-only"
          disabled={uploading}
          onChange={(event) => { void handleFiles(event.currentTarget.files); event.currentTarget.value = ''; }}
          aria-label={`Upload ${assetType} image`}
        />
      </label>
      <p className="mt-1 text-xs text-stone-500">JPG, PNG, WebP, AVIF, or HEIC · up to 5 MB. After upload, save the form.</p>
      {error && <p role="alert" className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
