import React, { useState, useMemo } from 'react';
import { OutfitSuggestion, ClothingItem, ItemStatus, AmbassadorProfile } from '../types';
import { OutfitCard } from './OutfitCard';
import { OutfitBuilderModal } from './OutfitBuilderModal';
import { apiService } from '../services/api';
import { FitPicUploadModal } from './FitPicUploadModal';
import { TryOnModal } from './TryOnModal';
import { Sparkles, Plus, Wand2, Camera, User, SlidersHorizontal, PackageOpen } from 'lucide-react';
import { createFitPicModelSvg } from '../data/seedData';
import { OutfitDetailModal } from './OutfitDetailModal';
import { AutoSuggestModal } from './AutoSuggestModal';

interface OutfitStudioProps {
  outfits: OutfitSuggestion[];
  clothingItems: ClothingItem[];
  profile: AmbassadorProfile;
  onUpdateProfile: (profile: AmbassadorProfile) => void;
  onSaveOutfit: (outfit: {
    title: string;
    occasion: string;
    model_image_url: string;
    item_ids: string[];
    styling_notes?: string;
    is_custom_fit_pic?: boolean;
  }) => Promise<void>;
  onUpdateFitPic: (outfitId: string, photoUrl: string) => Promise<void>;
  onBatchStatusChange: (itemIds: string[], status: ItemStatus) => void;
  onDeleteOutfit: (outfitId: string) => void;
  onSelectPiece: (piece: ClothingItem) => void;
  onOutfitGenerated?: (outfit: OutfitSuggestion) => void;
  onManageOccasions?: () => void;
  targetOutfitId?: string | null;
  onClearTargetOutfit?: () => void;
}

export const OutfitStudio: React.FC<OutfitStudioProps> = ({
  outfits,
  clothingItems,
  profile,
  onUpdateProfile,
  onSaveOutfit,
  onUpdateFitPic,
  onBatchStatusChange,
  onDeleteOutfit,
  onSelectPiece,
  onOutfitGenerated,
  onManageOccasions,
  targetOutfitId,
  onClearTargetOutfit,
}) => {
  const allOccasions = useMemo(() => {
    if (profile.custom_occasions) {
      return ['All', ...profile.custom_occasions.split(',').map(s => s.trim()).filter(Boolean)];
    }
    return [
      'All',
      'Streetwear Editorial',
      'Campaign Shoot',
      'Daily GRWM',
      'VIP Event Launch',
    ];
  }, [profile.custom_occasions]);

  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [isAutoSuggesting, setIsAutoSuggesting] = useState(false);
  const [activeUploadOutfitId, setActiveUploadOutfitId] = useState<string | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitSuggestion | null>(null);

  const handleUpdateOutfitDetails = async (id: string, updates: Partial<OutfitSuggestion>) => {
    try {
      // @ts-ignore
      await apiService.updateOutfit(id, updates);
      if ((window as any).refreshApp) {
        (window as any).refreshApp();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update outfit.");
    }
  };

  React.useEffect(() => {
    if (targetOutfitId) {
      setSelectedOccasion('All');
      setTimeout(() => {
        const el = document.getElementById(`outfit-${targetOutfitId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-neutral-900', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-4', 'ring-neutral-900', 'ring-offset-2'), 2000);
          onClearTargetOutfit?.();
        }
      }, 100);
    }
  }, [targetOutfitId, onClearTargetOutfit]);

  // Filter outfits
  const filteredOutfits = useMemo(() => {
    if (selectedOccasion === 'All') return outfits;
    return outfits.filter(o => o.occasion.toLowerCase() === selectedOccasion.toLowerCase());
  }, [outfits, selectedOccasion]);

  const activeOutfitForFitPic = useMemo(() => {
    return outfits.find(o => o.id === activeUploadOutfitId) || null;
  }, [outfits, activeUploadOutfitId]);

  // Smart Auto-Generator: Pair unworn items into a fresh look
  const handleAutoGenerateOutfit = async () => {
    const unwornTops = clothingItems.filter(i => i.category === 'Tops');
    const unwornBottoms = clothingItems.filter(i => i.category === 'Bottoms');
    const unwornOuter = clothingItems.filter(i => i.category === 'Outerwear');
    const footwear = clothingItems.filter(i => i.category === 'Footwear');
    const accessories = clothingItems.filter(i => i.category === 'Accessories');

    const top = unwornTops.find(i => i.status === 'Unworn') || unwornTops[0];
    const bottom = unwornBottoms.find(i => i.status === 'Unworn') || unwornBottoms[0];
    const outer = unwornOuter.find(i => i.status === 'Unworn') || unwornOuter[0];
    const shoes = footwear[0];
    const acc = accessories[0];

    const pieces = [outer, top, bottom, shoes, acc].filter(Boolean) as ClothingItem[];
    if (pieces.length === 0) return;

    const brandNames = Array.from(new Set(pieces.map(p => p.brand))).slice(0, 3).join(' × ');
    const title = `${brandNames} Capsule Mix`;
    const occasion = 'Streetwear Editorial';

    const visual = createFitPicModelSvg(
      '#ECE8E1',
      '#2F3E46',
      '#354F52',
      '#52796F',
      title,
      'Seeded Wardrobe Match'
    );

    await onSaveOutfit({
      title,
      occasion,
      model_image_url: visual,
      item_ids: pieces.map(p => p.id),
      styling_notes: `Curated combination highlighting ${pieces.map(p => p.brand).join(', ')}. Perfect for TikTok GRWM or lookbook carousel.`,
      is_custom_fit_pic: false,
    });
  };


  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  const handleAutoSuggest = async (prompt?: string) => {
    setIsAutoSuggesting(true);
    setIsSuggestModalOpen(false);
    try {
      const newOutfit = await apiService.autoSuggestOutfit(prompt);
      if (newOutfit) {
        if (onOutfitGenerated) {
          onOutfitGenerated(newOutfit);
        }
      }
    } catch (e: any) {
      alert(e.message || "Failed to auto-suggest outfit package.");
    } finally {
      setIsAutoSuggesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ambassador Profile Banner: "My Lookbook Model Persona" */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <img
              src={profile.avatar_url}
              alt={profile.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-neutral-900 shadow-xs"
            />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-neutral-900 text-white flex items-center justify-center text-[10px]">
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-neutral-900 font-['Syne',sans-serif]">
                {profile.name}
              </h2>
              <span className="text-[11px] font-semibold text-neutral-400">
                {profile.handle}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Brand Ambassador Fit Lookbook · See yourself styled in suggested PR outfit combinations
            </p>
          </div>
        </div>

        {/* Creator Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsSuggestModalOpen(true)}
            disabled={isAutoSuggesting}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-neutral-900 bg-amber-300 hover:bg-amber-400 shadow-sm rounded-lg transition-all cursor-pointer min-h-[38px] disabled:opacity-50"
            title="Auto-curate an outfit package based on wardrobe descriptions"
          >
            {isAutoSuggesting ? (
              <div className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
            )}
            <span className="hidden sm:inline">{isAutoSuggesting ? 'Curating...' : 'AI Suggest Package'}</span>
          </button>

          <button
            onClick={() => setIsTryOnOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-lg transition-all cursor-pointer min-h-[38px]"
            title="Use AI to try on a garment"
          >
            <Wand2 className="w-3.5 h-3.5 text-white" />
            <span>AI Try-On</span>
          </button>

          <button
            onClick={() => setIsBuilderOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-all active:scale-[0.98] cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>Style New Outfit</span>
          </button>
        </div>
      </div>

      {/* Filter Row: Occasion Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          <button 
            onClick={onManageOccasions}
            className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-900 uppercase tracking-wider mr-1 hidden sm:inline shrink-0 cursor-pointer transition-colors"
          >
            Occasion:
          </button>
          {allOccasions.map((occ) => {
            const active = selectedOccasion === occ;
            return (
              <button
                key={occ}
                onClick={() => setSelectedOccasion(occ)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-white/80 text-neutral-600 hover:text-neutral-900 hover:bg-white border border-neutral-200/70'
                }`}
              >
                {occ}
              </button>
            );
          })}
        </div>

        <span className="text-xs text-neutral-500 font-medium hidden sm:inline">
          Showing <strong className="text-neutral-900 font-semibold">{filteredOutfits.length}</strong> suggested outfits
        </span>
      </div>

      {/* Pinterest-style Outfit Grid */}
      {filteredOutfits.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {filteredOutfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              allItems={clothingItems}
              onUploadFitPic={setActiveUploadOutfitId}
              onBatchStatusChange={onBatchStatusChange}
              onDeleteOutfit={onDeleteOutfit}
              onSelectPiece={onSelectPiece}
              onClick={() => setSelectedOutfit(outfit)}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-neutral-200 max-w-md mx-auto my-6">
          <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-500">
            <PackageOpen className="w-6 h-6 stroke-[1.7]" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 font-['Syne',sans-serif]">
            No outfits found for this vibe
          </h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
            Build your first outfit combination or auto-generate a look from your seeded wardrobe.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setSelectedOccasion('All')}
              className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
            >
              Show All
            </button>
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Style Look</span>
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedOutfit && (
        <OutfitDetailModal
          outfit={selectedOutfit}
          onClose={() => setSelectedOutfit(null)}
          onUpdate={handleUpdateOutfitDetails}
          onDelete={onDeleteOutfit}
          allOccasions={allOccasions.filter(o => o !== 'All')}
          allStatuses={profile.custom_statuses ? profile.custom_statuses.split(',').map(s => s.trim()).filter(Boolean) : ['Unworn', 'Worn', 'Posted', 'Needs Returning']}
        />
      )}


            {/* Auto Suggest Modal */}
      <AutoSuggestModal
        isOpen={isSuggestModalOpen}
        onClose={() => setIsSuggestModalOpen(false)}
        onGenerate={handleAutoSuggest}
        isGenerating={isAutoSuggesting}
      />

      {/* AI Try-On Modal */}
      {isTryOnOpen && (
        <TryOnModal
          clothingItems={clothingItems}
          onClose={() => setIsTryOnOpen(false)}
          onSaveOutfit={onSaveOutfit}
        />
      )}

      {/* Outfit Builder Modal */}

      <OutfitBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        allItems={clothingItems}
        onSaveOutfit={onSaveOutfit}
      />

      {/* Fit Picture Upload Modal */}
      <FitPicUploadModal
        isOpen={Boolean(activeUploadOutfitId)}
        outfit={activeOutfitForFitPic}
        allItems={clothingItems}
        onClose={() => setActiveUploadOutfitId(null)}
        onSaveFitPic={onUpdateFitPic}
      />
    </div>
  );
};
