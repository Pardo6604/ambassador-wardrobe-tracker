import React, { useState } from 'react';
import { OutfitSuggestion, ClothingItem, ItemStatus } from '../types';
import { Camera, Check, Copy, Sparkles, Trash2, CheckCircle2, Package, Layers } from 'lucide-react';

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
  const [showFitPic, setShowFitPic] = useState(false);

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

  // Render the Clothing Pieces Package Grid
  const renderPackageGrid = () => {
    if (matchedPieces.length === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#F8F7F4] text-neutral-400">
          <Package className="w-10 h-10 mb-2 stroke-[1.5]" />
          <span className="text-xs font-semibold uppercase tracking-wider">Empty Package</span>
        </div>
      );
    }

    if (matchedPieces.length === 1) {
      const p = matchedPieces[0];
      return (
        <div className="w-full h-full p-2 bg-[#F6F5F2] flex items-center justify-center">
          <div className="relative w-full h-full rounded-xl overflow-hidden bg-white shadow-xs border border-neutral-200/60 group/tile">
            <img
              src={p.image_url}
              alt={p.brand}
              className="w-full h-full object-cover object-center group-hover/tile:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 rounded-md bg-neutral-900/85 backdrop-blur-md text-white text-[11px] font-semibold truncate flex items-center justify-between">
              <span>{p.brand}</span>
              <span className="text-[10px] text-neutral-300 font-normal">{p.category}</span>
            </div>
          </div>
        </div>
      );
    }

    if (matchedPieces.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 w-full h-full p-2 bg-[#F6F5F2]">
          {matchedPieces.map((p) => (
            <div key={p.id} className="relative w-full h-full rounded-xl overflow-hidden bg-white shadow-xs border border-neutral-200/60 group/tile">
              <img
                src={p.image_url}
                alt={p.brand}
                className="w-full h-full object-cover object-center group-hover/tile:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded bg-neutral-900/85 backdrop-blur-md text-white text-[10px] font-semibold truncate flex items-center justify-between">
                <span className="truncate">{p.brand}</span>
                <span className="text-[9px] text-neutral-300 font-normal ml-1 shrink-0">{p.category}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (matchedPieces.length === 3) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full p-2 bg-[#F6F5F2]">
          {/* Hero piece on the left spanning 2 rows */}
          <div className="row-span-2 relative w-full h-full rounded-xl overflow-hidden bg-white shadow-xs border border-neutral-200/60 group/tile">
            <img
              src={matchedPieces[0].image_url}
              alt={matchedPieces[0].brand}
              className="w-full h-full object-cover object-center group-hover/tile:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded bg-neutral-900/85 backdrop-blur-md text-white text-[10px] font-semibold truncate flex items-center justify-between">
              <span className="truncate">{matchedPieces[0].brand}</span>
              <span className="text-[9px] text-neutral-300 font-normal ml-1 shrink-0">{matchedPieces[0].category}</span>
            </div>
          </div>

          {/* 2 stacked pieces on the right */}
          {matchedPieces.slice(1, 3).map((p) => (
            <div key={p.id} className="relative w-full h-full rounded-xl overflow-hidden bg-white shadow-xs border border-neutral-200/60 group/tile">
              <img
                src={p.image_url}
                alt={p.brand}
                className="w-full h-full object-cover object-center group-hover/tile:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded bg-neutral-900/85 backdrop-blur-md text-white text-[10px] font-semibold truncate flex items-center justify-between">
                <span className="truncate">{p.brand}</span>
                <span className="text-[9px] text-neutral-300 font-normal ml-1 shrink-0">{p.category}</span>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 4 or more pieces: 2x2 grid
    const displayPieces = matchedPieces.slice(0, 4);
    const remainingCount = matchedPieces.length - 4;

    return (
      <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full p-2 bg-[#F6F5F2]">
        {displayPieces.map((p, idx) => {
          const isLastWithMore = idx === 3 && remainingCount > 0;
          return (
            <div key={p.id} className="relative w-full h-full rounded-xl overflow-hidden bg-white shadow-xs border border-neutral-200/60 group/tile">
              <img
                src={p.image_url}
                alt={p.brand}
                className="w-full h-full object-cover object-center group-hover/tile:scale-105 transition-transform duration-300"
              />
              {isLastWithMore ? (
                <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                  <span className="text-sm font-bold">+{remainingCount + 1}</span>
                  <span className="text-[9px] uppercase tracking-wider text-neutral-300 font-medium">Pieces</span>
                </div>
              ) : (
                <div className="absolute bottom-1.5 left-1.5 right-1.5 px-2 py-0.5 rounded bg-neutral-900/85 backdrop-blur-md text-white text-[10px] font-semibold truncate flex items-center justify-between">
                  <span className="truncate">{p.brand}</span>
                  <span className="text-[9px] text-neutral-300 font-normal ml-1 shrink-0">{p.category}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div 
      id={`outfit-${outfit.id}`} 
      onClick={onClick}
      className={`bg-white rounded-2xl overflow-hidden border border-neutral-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col group scroll-m-24 transition-all duration-300 ${onClick ? 'cursor-pointer hover:border-neutral-300' : ''}`}
    >
      {/* Top Square: Clothing Pieces Package Grid (or Fit Pic if toggled) */}
      <div className="relative aspect-square w-full bg-[#F6F5F2] overflow-hidden flex items-center justify-center border-b border-neutral-100">
        {showFitPic && outfit.is_custom_fit_pic && outfit.model_image_url ? (
          <img
            src={outfit.model_image_url}
            alt={outfit.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-[1.01] transition-transform duration-300"
          />
        ) : (
          renderPackageGrid()
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight bg-white/95 backdrop-blur-md text-neutral-900 shadow-sm border border-neutral-200/80">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>{outfit.occasion}</span>
          </div>

          <div className="flex items-center gap-1 pointer-events-auto">
            {outfit.is_custom_fit_pic && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFitPic(!showFitPic);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
                title="Toggle between Package Grid and Your Fit Pic"
              >
                {showFitPic ? <Package className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                <span>{showFitPic ? 'Package' : 'Fit Pic'}</span>
              </button>
            )}

            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-neutral-900/90 text-white shadow-sm backdrop-blur-xs">
              <Package className="w-3 h-3 text-amber-400" />
              <span>{matchedPieces.length}P</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card Body: Wardrobe Pieces & Status */}
      <div className="p-4 flex flex-col justify-between flex-1 space-y-3.5">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-base font-bold tracking-tight text-neutral-900 font-['Syne',sans-serif]">
              {outfit.title}
            </h3>
            {unwornPieces.length > 0 ? (
              <span className="text-[11px] font-bold text-amber-600 shrink-0 lowercase">{unwornPieces.length} unworn</span>
            ) : allPosted ? (
              <span className="text-[11px] font-bold text-emerald-600 shrink-0 lowercase">posted ✓</span>
            ) : (
              <span className="text-[11px] font-bold text-neutral-400 shrink-0 lowercase">styled</span>
            )}
          </div>

          {/* AI Stylist Description Guidance */}
          {outfit.styling_notes && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-[#FAF9F6] border border-neutral-200/60 text-xs text-neutral-600 leading-relaxed">
              <div className="flex items-center gap-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>AI Stylist Guidance</span>
              </div>
              <p className="italic text-neutral-700">"{outfit.styling_notes}"</p>
            </div>
          )}
        </div>

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

            {/* Upload Fit Pic button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUploadFitPic(outfit.id);
              }}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
              title="Upload photo of you wearing this outfit"
            >
              <Camera className="w-3.5 h-3.5" />
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
