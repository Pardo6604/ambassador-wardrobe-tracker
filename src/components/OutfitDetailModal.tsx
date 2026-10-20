import React, { useState, useEffect } from 'react';
import { OutfitSuggestion, ClothingItem } from '../types';
import { X, Trash2, Camera, Package } from 'lucide-react';

interface OutfitDetailModalProps {
  outfit: OutfitSuggestion | null;
  onClose: () => void;
  onUpdate: (outfitId: string, updates: Partial<OutfitSuggestion>) => void;
  onDelete: (outfitId: string) => void;
  allOccasions: string[];
  allStatuses: string[];
}

export const OutfitDetailModal: React.FC<OutfitDetailModalProps> = ({
  outfit,
  onClose,
  onUpdate,
  onDelete,
  allOccasions,
  allStatuses
}) => {
  const [title, setTitle] = useState('');
  const [occasion, setOccasion] = useState('');
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (outfit) {
      setTitle(outfit.title);
      setOccasion(outfit.occasion || '');
      setStatus(outfit.status || 'Concepting');
      setNotes(outfit.styling_notes || '');
    }
  }, [outfit]);

  if (!outfit) return null;

  const handleSave = () => {
    onUpdate(outfit.id, {
      title,
      occasion,
      status,
      styling_notes: notes
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm sm:items-end">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4">
        
        {/* Header Visual */}
        <div className="relative aspect-video bg-[#F6F5F2] flex items-center justify-center overflow-hidden border-b border-neutral-100">
          {outfit.model_image_url ? (
            <img
              src={outfit.model_image_url}
              alt={outfit.title}
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center text-neutral-500">
              <div className="w-12 h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center mb-2 shadow-xs">
                <Package className="w-6 h-6 stroke-[1.8] text-amber-400" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">Curated Outfit Package</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">{outfit.occasion}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-white">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Outfit Name
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Occasion
                </label>
                <select
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm bg-white"
                >
                  <option value="">Select Occasion</option>
                  {allOccasions.map(occ => (
                    <option key={occ} value={occ}>{occ}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm bg-white"
                >
                  <option value="Concepting">Concepting</option>
                  {allStatuses.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                Styling Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="How to style this..."
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this outfit?')) {
                onDelete(outfit.id);
                onClose();
              }
            }}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Outfit"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
