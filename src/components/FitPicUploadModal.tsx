import React, { useState, useRef } from 'react';
import { OutfitSuggestion, ClothingItem } from '../types';
import { X, Upload, Camera, Check, Sparkles } from 'lucide-react';
import { createFitPicModelSvg } from '../data/seedData';
import { compressImage } from '../utils/imageCompressor';

interface FitPicUploadModalProps {
  isOpen: boolean;
  outfit: OutfitSuggestion | null;
  allItems: ClothingItem[];
  onClose: () => void;
  onSaveFitPic: (outfitId: string, photoUrl: string) => Promise<void>;
}

export const FitPicUploadModal: React.FC<FitPicUploadModalProps> = ({
  isOpen,
  outfit,
  allItems,
  onClose,
  onSaveFitPic,
}) => {
  const [photoUrl, setPhotoUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !outfit) return null;

  const matchedPieces = outfit.item_ids
    .map(id => allItems.find(item => item.id === id))
    .filter((item): item is ClothingItem => Boolean(item));

  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, WEBP).');
      return;
    }
    setError(null);
    try {
      const compressed = await compressImage(file, 1024, 0.85);
      setPhotoUrl(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setPhotoUrl(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) {
      setError('Please upload or snap a photo of yourself wearing this outfit.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSaveFitPic(outfit.id, photoUrl);
      setPhotoUrl('');
      onClose();
    } catch {
      setError('Failed to save fit picture. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo generator for quick preset preview if user doesn't have a selfie on hand
  const handleUseDemoEditorial = (colorScheme: 'slate' | 'warm' | 'olive') => {
    const pal = colorScheme === 'slate'
      ? { bg: '#E3E6E8', top: '#1E293B', bot: '#334155', out: '#0F172A', label: 'Monochrome Street' }
      : colorScheme === 'warm'
      ? { bg: '#F2ECE4', top: '#C2A68D', bot: '#453831', out: '#6E5244', label: 'Warm Minimalist' }
      : { bg: '#E8ECE6', top: '#3D4A3E', bot: '#252F26', out: '#556657', label: 'Olive Gorpcore' };

    const svg = createFitPicModelSvg(pal.bg, pal.top, pal.bot, pal.out, outfit.title, pal.label);
    setPhotoUrl(svg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight font-['Syne',sans-serif]">
              Upload Your Fit Picture
            </h2>
            <p className="text-xs text-neutral-500">
              See yourself wearing "{outfit.title}"
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Outfit summary strip */}
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-neutral-200/80">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
              Styled Pieces
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {matchedPieces.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-neutral-200 text-xs shrink-0">
                  <img src={p.image_url} alt="" className="w-5 h-5 rounded object-cover" />
                  <span className="font-semibold text-neutral-800">{p.brand}</span>
                  <span className="text-neutral-400 text-[10px]">({p.category})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Photo Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
              Your Photo (Mirror Selfie / Lookbook Fit Pic) *
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
                isDragging
                  ? 'border-neutral-900 bg-neutral-50 scale-[0.99]'
                  : 'border-neutral-200 hover:border-neutral-400 bg-[#FAF9F6]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {photoUrl ? (
                <div className="relative group w-full flex items-center justify-center">
                  <img
                    src={photoUrl}
                    alt="Fit pic preview"
                    className="max-h-56 max-w-full rounded-lg object-contain shadow-xs"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-semibold text-white bg-neutral-900/90 px-3 py-1.5 rounded-md">
                      Change Photo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2.5">
                  <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-700">
                    <Camera className="w-6 h-6 stroke-[1.8]" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-neutral-900 block">
                      Snap or select your fit photo
                    </span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Upload from phone camera roll or computer
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Presets for Demo / Instant preview */}
            <div className="mt-2.5 flex items-center gap-1.5 text-xs">
              <span className="text-[10px] text-neutral-400 uppercase font-semibold flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-500" /> Or sample look:
              </span>
              <button
                type="button"
                onClick={() => handleUseDemoEditorial('slate')}
                className="px-2 py-0.5 text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md cursor-pointer"
              >
                Monochrome
              </button>
              <button
                type="button"
                onClick={() => handleUseDemoEditorial('warm')}
                className="px-2 py-0.5 text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md cursor-pointer"
              >
                Warm Minimalist
              </button>
              <button
                type="button"
                onClick={() => handleUseDemoEditorial('olive')}
                className="px-2 py-0.5 text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md cursor-pointer"
              >
                Olive Tone
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 rounded-lg min-h-[40px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !photoUrl}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 active:scale-[0.98] rounded-lg min-h-[40px] shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Fit Pic...' : 'Save Fit Pic'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
