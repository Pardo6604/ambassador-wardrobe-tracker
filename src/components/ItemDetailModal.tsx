import React, { useState } from 'react';
import { ClothingItem, ItemStatus } from '../types';
import { X, Copy, Check, Trash2, Calendar, Tag, AlertCircle, Share2, Sparkles } from 'lucide-react';

interface ItemDetailModalProps {
  item: ClothingItem | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: ItemStatus) => void;
  onDelete: (id: string) => void;
  relatedOutfits?: import('../types').OutfitSuggestion[];
  onNavigateToOutfit?: (outfitId: string) => void;
}

const STATUS_OPTIONS: { id: ItemStatus; label: string; desc: string }[] = [
  { id: 'Unworn', label: 'Unworn', desc: 'Seeded package received, ready for outfit styling' },
  { id: 'Worn', label: 'Worn / Styled', desc: 'Worn for lookbook shoot or event' },
  { id: 'Posted', label: 'Posted / Live', desc: 'Campaign reel, post, or story published' },
  { id: 'Needs Returning', label: 'Needs Returning', desc: 'Press loaner to ship back to showroom' },
];

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onUpdateStatus,
  onDelete,
  relatedOutfits = [],
  onNavigateToOutfit,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!item) return null;

  const brandTag = `@${item.brand.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const captionHelper = `Styled in ${item.brand} ${item.category.toLowerCase()} ✨ ${brandTag} #gifted #brandambassador`;

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(captionHelper);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
            <span>{item.category}</span>
            <span>·</span>
            <span>PR Inventory</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 hover:text-neutral-900 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Left Column: Visual Card */}
          <div className="flex flex-col items-center">
            <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#F4F4F3] border border-neutral-200/70 shadow-xs flex items-center justify-center relative">
              <img
                src={item.image_url}
                alt={item.brand}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="mt-3 w-full flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Received {new Date(item.created_at).toLocaleDateString()}
              </span>
              <span className="font-mono text-[10px] text-neutral-400">
                ID: {item.id.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Right Column: Ambassador Controls & Details */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight font-['Syne',sans-serif]">
                  {item.brand}
                </h3>
                {item.campaign_tag && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-neutral-600 font-medium">
                    <Tag className="w-3.5 h-3.5 text-neutral-400" />
                    <span>{item.campaign_tag}</span>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-2">
                  Ambassador Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((st) => {
                    const isCurrent = item.status === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => onUpdateStatus(item.id, st.id)}
                        className={`p-2.5 text-left rounded-lg border text-xs transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                            : 'bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200'
                        }`}
                      >
                        <div className="font-semibold">{st.label}</div>
                        <div className={`text-[10px] mt-0.5 line-clamp-1 ${isCurrent ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          {st.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Return deadline warning if applicable */}
              {item.status === 'Needs Returning' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-900">
                    <span className="font-semibold">Showroom Loaner:</span>{' '}
                    {item.return_deadline ? `Must return by ${item.return_deadline}.` : 'Coordinate with agency for return slip.'}
                  </div>
                </div>
              )}

              {/* Piece Description & AI Styling Profile */}
              {item.description && (
                <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg">
                  <span className="text-[11px] font-semibold text-indigo-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Piece Description & Styling Profile
                  </span>
                  <p className="text-xs text-indigo-950/80 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )}

              {/* Notes */}
              {item.notes && (
                <div className="p-3 bg-[#FAF9F6] border border-neutral-200/80 rounded-lg">
                  <span className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">
                    Deliverables & Notes
                  </span>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    {item.notes}
                  </p>
                </div>
              )}

              {/* Social Caption & Tag Helper */}
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200/70">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                    <Share2 className="w-3 h-3" /> Quick Caption Helper
                  </span>
                  <button
                    onClick={handleCopyCaption}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-900 hover:text-neutral-700 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xs font-mono bg-white p-2 rounded border border-neutral-200 text-neutral-600 select-all">
                  {captionHelper}
                </div>
              </div>

              {/* Related Outfits Section */}
              {relatedOutfits.length > 0 && (
                <div className="pt-2">
                  <span className="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-2">
                    Styled in Outfits
                  </span>
                  <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-none -mx-2 px-2">
                    {relatedOutfits.map((outfit) => (
                      <button
                        key={outfit.id}
                        onClick={() => onNavigateToOutfit?.(outfit.id)}
                        className="flex flex-col items-start gap-1.5 w-24 shrink-0 group text-left cursor-pointer"
                        title={outfit.title}
                      >
                        <div className="w-24 h-24 rounded-lg overflow-hidden border border-neutral-200 group-hover:border-neutral-900 transition-colors">
                          <img
                            src={outfit.model_image_url}
                            alt={outfit.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <span className="text-[10px] font-medium text-neutral-800 line-clamp-1 w-full group-hover:text-neutral-900">
                          {outfit.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              {confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-700 font-medium">Remove item?</span>
                  <button
                    onClick={handleDelete}
                    className="px-2.5 py-1 text-xs bg-rose-600 text-white rounded-md hover:bg-rose-700 cursor-pointer font-medium"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1 text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-rose-600 transition-colors cursor-pointer py-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove from Closet</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
