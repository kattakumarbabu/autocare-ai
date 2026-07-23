import { useRef, useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';

/**
 * ImageUpload — file picker with drag-and-drop and live preview.
 * Calls onChange(File | null) when the user selects or clears an image.
 * currentImage: existing URL string (for edit mode preview).
 */
const ImageUpload = ({ currentImage, onChange, error }) => {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const displayImage = preview || currentImage;

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) return; // 5MB guard

    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  const handleInputChange = (e) => handleFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed overflow-hidden
          transition-all duration-200 group
          ${isDragging
            ? 'border-brand-400 bg-brand-500/10'
            : error
              ? 'border-red-500/40 bg-red-500/5'
              : 'border-white/15 bg-white/5 hover:border-brand-500/50 hover:bg-white/8'
          }
        `}
        style={{ minHeight: '180px' }}
      >
        {displayImage ? (
          /* Preview */
          <div className="relative w-full h-48">
            <img
              src={displayImage}
              alt="Vehicle preview"
              className="w-full h-full object-cover"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 text-white text-sm font-medium">
                <Camera size={16} /> Change photo
              </div>
            </div>
            {/* Clear button */}
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors z-10"
              aria-label="Remove image"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${isDragging ? 'bg-brand-500/20' : 'bg-white/5 group-hover:bg-brand-500/10'}`}>
              <Upload size={24} className={`transition-colors ${isDragging ? 'text-brand-400' : 'text-slate-500 group-hover:text-brand-400'}`} />
            </div>
            <p className="text-white text-sm font-medium mb-1">
              {isDragging ? 'Drop image here' : 'Upload vehicle photo'}
            </p>
            <p className="text-slate-500 text-xs">
              Drag & drop or click to browse • JPG, PNG, WebP • Max 5 MB
            </p>
          </div>
        )}
      </div>

      {error && <p className="field-error mt-1.5">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
};

export default ImageUpload;
