import React, { useState, useRef } from 'react';
import { ClothingItem, Category, OutfitSuggestion } from '../types';
import { X, Check, Plus, Camera, Sparkles, Shirt } from 'lucide-react';
import { createFitPicModelSvg } from '../data/seedData';

interface OutfitBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  allItems: ClothingItem[];
  onSaveOutfit: (outfit: {
    title: string;
    occasion: string;
    model_image_url: string;
    item_ids: string[];
    styling_notes?: string;
    is_custom_fit_pic?: boolean;
  }) => Promise<void>;
}

const OCCASIONS = [
  'Streetwear Editorial',
  'Campaign Shoot',
  'Daily GRWM',
  'VIP Event Launch',
  'Showroom Press',
];

export const OutfitBuilderModal: React.FC<OutfitBuilderModalProps> = ({
  isOpen,
  onClose,
  allItems,
  onSaveOutfit,
}) => {
  const [title, setTitle] = useState('');
  const [occasion, setOccasion] = useState(OCCASIONS[0]);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [stylingNotes, setStylingNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const toggleItem = (id: string) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          setPhotoUrl(evt.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please name your outfit look.');
      return;
    }
    if (selectedItemIds.length === 0) {
      setError('Select at least 1 wardrobe piece for this outfit.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // If user didn't upload a custom selfie, create an editorial lookbook model SVG
    let finalImage = photoUrl;
    let isCustom = Boolean(photoUrl);

    if (!finalImage) {
      finalImage = createFitPicModelSvg(
        '#EDEAE4',
        '#2E3842',
        '#1E2522',
        '#4A3B32',
        title.trim(),
        occasion
      );
    }

    try {
      await onSaveOutfit({
        title: title.trim(),
        occasion,
        model_image_url: finalImage,
        item_ids: selectedItemIds,
        styling_notes: stylingNotes.trim() || undefined,
        is_custom_fit_pic: isCustom,
      });

      setTitle('');
      setSelectedItemIds([]);
      setStylingNotes('');
      setPhotoUrl('');
      onClose();
    } catch {
      setError('Failed to save outfit look. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group items by category for easy selection
  const categories: Category[] = ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-neutral-100 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight font-['Syne',sans-serif]">
              Build Suggested Look
            </h2>
            <p className="text-xs text-neutral-500">Pair your PR wardrobe items and attach your fit pic</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
          {error && (
            <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Look Title & Occasion */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Look Name *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. NYC Gallery Opening Look..."
                className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
                Occasion / Vibe *
              </label>
              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900"
              >
                {OCCASIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Select Wardrobe Pieces */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                Select Wardrobe Pieces ({selectedItemIds.length} selected) *
              </label>
              <span className="text-[11px] text-neutral-400">
                Tap items to toggle into this look
              </span>
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const catItems = allItems.filter(i => i.category === cat);
                if (catItems.length === 0) return null;

                return (
                  <div key={cat}>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                      {cat}
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {catItems.map((item) => {
                        const isSelected = selectedItemIds.includes(item.id);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                                : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200'
                            }`}
                          >
                            <img
                              src={item.image_url}
                              alt=""
                              className="w-8 h-8 rounded-sm object-cover bg-neutral-100 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold truncate block">
                                {item.brand}
                              </span>
                              <span className={`text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                                {item.status}
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0 mr-1" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ambassador Fit Picture (Optional or Custom) */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Fit Picture (Photo of You Wearing the Look)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-neutral-200 hover:border-neutral-400 rounded-xl p-4 bg-[#FAF9F6] text-center cursor-pointer flex items-center justify-center gap-3 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              {photoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={photoUrl} alt="Preview" className="w-12 h-16 rounded-md object-cover shadow-xs" />
                  <div className="text-left text-xs">
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Photo attached!
                    </span>
                    <p className="text-neutral-400 text-[11px]">Tap to change photo</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-neutral-600">
                  <Camera className="w-4 h-4 text-neutral-500" />
                  <span>Tap to upload a mirror selfie / fit photo (or an editorial model preview will be generated)</span>
                </div>
              )}
            </div>
          </div>

          {/* Styling Notes */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Styling Notes / Deliverable Plan
            </label>
            <textarea
              rows={2}
              value={stylingNotes}
              onChange={(e) => setStylingNotes(e.target.value)}
              placeholder="e.g. Shoot outdoor natural light walk. Include #gifted by @brand in reel caption..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 resize-none"
            />
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
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 active:scale-[0.98] rounded-lg min-h-[40px] shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Look...' : 'Save Look'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
