import React, { useState, useRef } from 'react';
import { Category, ItemStatus } from '../types';
import { X, Upload, Image as ImageIcon, Check, Sparkles, Loader2 } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: {
    brand: string;
    category: Category;
    status: ItemStatus;
    image_url: string;
    campaign_tag?: string;
    notes?: string;
    return_deadline?: string;
  }) => Promise<void>;
  allCategories?: string[];
  allStatuses?: string[];
}

// Ready-to-use sample curated wardrobe imagery in case user wants one-click demo items
const SAMPLE_PRESETS: { label: string; category: Category; brand: string; color: string }[] = [
  { label: 'Leather Jacket', category: 'Outerwear', brand: 'Acne Studios', color: '#3A2E2B' },
  { label: 'Pleated Pants', category: 'Bottoms', brand: 'Issey Miyake', color: '#273238' },
  { label: 'Chunky Sneaker', category: 'Footwear', brand: 'Salomon', color: '#324238' },
  { label: 'Cashmere Knit', category: 'Tops', brand: 'The Row', color: '#D5C4A1' },
  { label: 'Shoulder Bag', category: 'Accessories', brand: 'Bottega Veneta', color: '#1E2522' },
];

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  allCategories = ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories'],
  allStatuses = ['Unworn', 'Worn', 'Posted', 'Needs Returning'],
}) => {
  const CATEGORIES = allCategories;
  const STATUSES = allStatuses;
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState<Category>('Tops');
  const [status, setStatus] = useState<ItemStatus>('Unworn');
  const [imageUrl, setImageUrl] = useState('');
  const [campaignTag, setCampaignTag] = useState('');
  const [notes, setNotes] = useState('');
  const [returnDeadline, setReturnDeadline] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local file selection or drag-drop with Canvas/WebP compression
  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setError(null);
    setIsCompressing(true);
    try {
      const compressedDataUrl = await compressImage(file, 1024, 0.85);
      setImageUrl(compressedDataUrl);
    } catch (err) {
      console.warn('Canvas compression failed, falling back to FileReader', err);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          setImageUrl(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressing(false);
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

  // Generate SVG fallback if user doesn't upload a custom file
  const generatePlaceholderSvg = (b: string, c: Category) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 300" width="100%" height="100%">
      <rect width="240" height="300" fill="#F4F2EE"/>
      <circle cx="120" cy="130" r="50" fill="#E4DEC8" opacity="0.5"/>
      <text x="120" y="138" font-family="system-ui, sans-serif" font-size="28" font-weight="700" fill="#2E2E2E" text-anchor="middle">${(b || 'PR').slice(0, 3).toUpperCase()}</text>
      <text x="120" y="240" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#71717A" text-anchor="middle" letter-spacing="2">${c.toUpperCase()}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand.trim()) {
      setError('Please provide a brand name.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const finalImage = imageUrl.trim() || generatePlaceholderSvg(brand, category);

    try {
      await onUpload({
        brand: brand.trim(),
        category,
        status,
        image_url: finalImage,
        campaign_tag: campaignTag.trim() || undefined,
        notes: notes.trim() || undefined,
        return_deadline: status === 'Needs Returning' ? returnDeadline : undefined,
      });

      // Reset form
      setBrand('');
      setCategory('Tops');
      setStatus('Unworn');
      setImageUrl('');
      setCampaignTag('');
      setNotes('');
      setReturnDeadline('');
      onClose();
    } catch {
      setError('Failed to save item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyPreset = (preset: typeof SAMPLE_PRESETS[0]) => {
    setBrand(preset.brand);
    setCategory(preset.category);
    setImageUrl(generatePlaceholderSvg(preset.brand, preset.category));
    setCampaignTag(`Ambassador PR Drop`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight font-['Syne',sans-serif]">
              Log New PR Item
            </h2>
            <p className="text-xs text-neutral-500">Record seeded clothing, loaners, or campaign outfits</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
              Item Photo *
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
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

              {isCompressing ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="text-xs font-semibold text-neutral-800">
                    Optimizing image for AI (1024×1024 WebP)...
                  </span>
                </div>
              ) : imageUrl ? (
                <div className="relative group w-full flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-40 max-w-full rounded-lg object-contain shadow-xs"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-medium text-white bg-neutral-900/80 px-2.5 py-1 rounded-md">
                      Change Photo
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-neutral-200 flex items-center justify-center text-neutral-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-neutral-900">
                      Tap or drag & drop to upload photo
                    </span>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Auto-compressed to 1024×1024 WebP for fast AI generation
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick demo presets for instantaneous testing */}
            <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] text-neutral-400 uppercase font-medium flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-amber-500" /> Presets:
              </span>
              {SAMPLE_PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.label}
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2 py-0.5 text-[11px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md whitespace-nowrap cursor-pointer transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Name Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Brand Name *
            </label>
            <input
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Acne Studios, Jacquemus, Arc'teryx..."
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
            />
          </div>

          {/* Category & Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ItemStatus)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 transition-all"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Return Deadline (shown conditionally if Needs Returning) */}
          {status === 'Needs Returning' && (
            <div className="p-3 bg-rose-50/70 border border-rose-200/80 rounded-lg">
              <label className="block text-xs font-semibold text-rose-800 uppercase tracking-wider mb-1">
                Return Due Date
              </label>
              <input
                type="date"
                value={returnDeadline}
                onChange={(e) => setReturnDeadline(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-rose-200 rounded-md text-neutral-800 focus:outline-none focus:ring-1 focus:ring-rose-800"
              />
              <p className="text-[10px] text-rose-600 mt-1">Showroom loaners will trigger priority reminders.</p>
            </div>
          )}

          {/* Campaign Tag */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Campaign / Collection Tag <span className="text-neutral-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={campaignTag}
              onChange={(e) => setCampaignTag(e.target.value)}
              placeholder="e.g. FW26 Capsule, Fashion Week Seeding, TikTok GRWM..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
            />
          </div>

          {/* Notes & Deliverables */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Ambassador Notes <span className="text-neutral-400 font-normal lowercase">(deliverables, tags, deadlines)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Must tag @brand and use #gifted in reel caption..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg min-h-[40px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 active:scale-[0.98] rounded-lg min-h-[40px] shadow-sm transition-all cursor-pointer"
            >
              {isSubmitting ? 'Saving to Closet...' : 'Save to Closet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
