import { useState, useRef } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  token?: string; // Add token prop
}

/**
 * Reusable image upload component.
 * Sends file to /api/upload and returns the Cloudinary URL.
 * Flat solid colors only — no gradients, no opacities.
 */
function ImageUpload({ value, onChange, label = 'Upload Image', token }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG, and WebP files are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be under 5MB.');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post<{ success: boolean; data: { imageUrl: string } }>(
        '/upload',
        formData,
        { 
          headers: { 
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          } 
        }
      );

      onChange(response.data.data.imageUrl);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to upload image.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be re-uploaded
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>

      {value ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border-2 border-gray-200 bg-gray-100">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <span className="text-sm font-medium text-gray-500">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">Click to upload</span>
              <span className="text-xs text-gray-400">JPG, PNG, WebP — Max 5MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-600 font-medium mt-1.5">{error}</p>
      )}
    </div>
  );
}

export default ImageUpload;
