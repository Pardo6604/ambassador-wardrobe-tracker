import React, { useState } from 'react';
import { OutfitSuggestion, ClothingItem, ItemStatus } from '../types';
import { Camera, Check, Copy, Share2, Sparkles, Trash2, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface OutfitCardProps {
  outfit: OutfitSuggestion;
  allItems: ClothingItem[];
  onUploadFitPic: (outfitId: string) => void;
  onBatchStatusChange: (itemIds: string[], status: ItemStatus) => void;
  onDeleteOutfit: (outfitId: string) => void;
  onSelectPiece: (piece: ClothingItem) => void;
  onClick?: () => void;
}

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  allItems,
  onUploadFitPic,
  onBatchStatusChange,
  onDeleteOutfit,
  onSelectPiece,
  onClick,
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Match the outfit's item IDs with actual wardrobe items
  const matchedPieces = outfit.item_ids
    .map(id => allItems.find(item => item.id === id))
    .filter((item): item is ClothingItem => Boolean(item));

  const unwornPieces = matchedPieces.filter(p => p.status === 'Unworn');
  const allPosted = matchedPieces.length > 0 && matchedPieces.every(p => p.status === 'Posted');
  const allWorn = matchedPieces.length > 0 && matchedPieces.every(p => p.status === 'Worn' || p.status === 'Posted');

  // Generate caption tags for reels/posts
  const generateCaption = () => {
    const brands = Array.from(new Set(matchedPieces.map(p => p.brand)));
    const tags = brands.map(b => `@${b.toLowerCase().replace(/[^a-z0-9]/g, '')}`).join(' ');
    return `Today's look: ${outfit.title} 📸 Styled with ${brands.join(' + ')} ✨ ${tags} #brandambassador #gifted #ootd`;
  };

  const handleCopyCaption = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(generateCaption());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      id={`outfit-${outfit.id}`} 
      onClick={onClick}
      className={`bg-white rounded-2xl overflow-hidden border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col group scroll-m-24 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-neutral-300' : ''}`}
    >
      {/* Top Image: Ambassador / Model Fit Picture */}
      <div className="relative aspect-[3/4] w-full bg-[#EAE7E1] overflow-hidden flex items-center justify-center">
        <img
          src={outfit.model_image_url}
          alt={outfit.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
        />

        {/* Gradient Scrim for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight bg-white/90 backdrop-blur-md text-neutral-900 shadow-xs border border-white/40">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{outfit.occasion}</span>
          </div>

          {outfit.is_custom_fit_pic && (
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-600 text-white shadow-xs">
              <Check className="w-3 h-3" />
              <span>Your Fit Pic</span>
            </div>
          )}
        </div>

        {/* Bottom Image Overlay: Title & Fit Pic Upload Button */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex items-end justify-between gap-2">
          <div className="text-white">
            <span className="text-[11px] font-medium text-neutral-300 uppercase tracking-wider block">
              Suggested Look
            </span>
            <h3 className="text-base sm:text-lg font-bold tracking-tight leading-tight font-['Syne',sans-serif] text-white">
              {outfit.title}
            </h3>
          </div>

          {/* Button to upload picture of yourself wearing this outfit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUploadFitPic(outfit.id);
            }}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white/95 hover:bg-white text-neutral-900 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer backdrop-blur-xs min-h-[36px]"
            title="Upload photo of you wearing this outfit"
          >
            <Camera className="w-3.5 h-3.5 text-neutral-800" />
            <span className="hidden sm:inline">Fit Pic</span>
          </button>
        </div>
      </div>

      {/* Card Body: Wardrobe Pieces & Status */}
      <div className="p-4 flex flex-col justify-between flex-1 space-y-4">
        {/* Pieces Carousel / Grid */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-neutral-400 font-semibold uppercase tracking-wider mb-2">
            <span>Seeded Pieces Included ({matchedPieces.length})</span>
            {unwornPieces.length > 0 ? (
              <span className="text-amber-600 font-bold lowercase">{unwornPieces.length} unworn</span>
            ) : allPosted ? (
              <span className="text-emerald-600 font-bold lowercase">all posted ✓</span>
            ) : (
              <span className="text-slate-500 font-bold lowercase">all styled</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {matchedPieces.map((piece) => {
              const isUnworn = piece.status === 'Unworn';
              const isPosted = piece.status === 'Posted';

              return (
                <button
                  key={piece.id}
                  onClick={() => onSelectPiece(piece)}
                  className="flex items-center gap-2 p-1.5 rounded-lg border border-neutral-100 hover:border-neutral-300 hover:bg-neutral-50/80 transition-all text-left group/piece cursor-pointer"
                >
                  <img
                    src={piece.image_url}
                    alt={piece.brand}
                    className="w-10 h-10 rounded-md object-cover bg-neutral-100 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-neutral-900 truncate block">
                      {piece.brand}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                      <span className="truncate">{piece.category}</span>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isUnworn ? 'bg-amber-500' : isPosted ? 'bg-emerald-500' : 'bg-slate-400'
                      }`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Styling Notes */}
        {outfit.styling_notes && (
          <p className="text-xs text-neutral-600 bg-[#FAF9F6] p-2.5 rounded-lg border border-neutral-200/60 italic leading-relaxed">
            "{outfit.styling_notes}"
          </p>
        )}

        {/* Quick Ambassador Actions */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            {/* Batch Status Button */}
            {!allWorn ? (
              <button
                onClick={() => onBatchStatusChange(outfit.item_ids, 'Worn')}
                className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-md text-[11px] font-semibold cursor-pointer active:scale-95 transition-all"
              >
                Mark Worn
              </button>
            ) : !allPosted ? (
              <button
                onClick={() => onBatchStatusChange(outfit.item_ids, 'Posted')}
                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md text-[11px] font-semibold cursor-pointer active:scale-95 transition-all flex items-center gap-1"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Mark Live</span>
              </button>
            ) : (
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3 h-3" /> Campaign Fulfilled
              </span>
            )}

            {/* Quick Caption Copy */}
            <button
              onClick={handleCopyCaption}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
              title="Copy tags & brand mentions for this outfit"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Delete Option */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onDeleteOutfit(outfit.id)}
                className="text-[10px] text-rose-600 font-bold hover:underline"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] text-neutral-400 hover:text-neutral-700"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-neutral-300 hover:text-rose-500 p-1 transition-colors cursor-pointer"
              title="Remove suggested look"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
