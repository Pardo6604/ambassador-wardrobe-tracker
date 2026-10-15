import React, { useState, useRef } from 'react';
import { X, Wand2, Upload, Shirt } from 'lucide-react';
import { apiService } from '../services/api';
import { ClothingItem } from '../types';

interface TryOnModalProps {
  clothingItems: ClothingItem[];
  onClose: () => void;
  onSaveOutfit: (outfit: {
    title: string;
    occasion: string;
    model_image_url: string;
    item_ids: string[];
    styling_notes?: string;
  }) => Promise<void>;
}

export const TryOnModal: React.FC<TryOnModalProps> = ({ clothingItems, onClose, onSaveOutfit }) => {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<any[]>([]);
  React.useEffect(() => {
    apiService.getTryonAvatars().then(setAvatars);
  }, []);

  const [selectedGarmentIds, setSelectedGarmentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPersonImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!personImage || selectedGarmentIds.length === 0) return;
    
    setLoading(true);
    let currentImage = personImage;
    
    // Sort so tops go before bottoms
    const garmentsToApply = selectedGarmentIds.map(id => clothingItems.find(i => i.id === id)).filter(Boolean) as ClothingItem[];
    const isTopOrDress = (cat: string) => !['bottom', 'pant', 'jean', 'short', 'skirt', 'trouser', 'legging', 'shoe', 'foot', 'sneaker', 'boot'].some(w => cat.toLowerCase().includes(w));
    // Sort so Bottoms go BEFORE Tops. This allows Tops to naturally drape over Bottoms.
    garmentsToApply.sort((a, b) => {
        const aIsTop = isTopOrDress(a.category);
        const bIsTop = isTopOrDress(b.category);
        if (!aIsTop && bIsTop) return -1;
        if (aIsTop && !bIsTop) return 1;
        return 0;
    });

    for (const garment of garmentsToApply) {
        const catLower = garment.category.toLowerCase();
        let description = 'upper_body';
        if (['bottom', 'pant', 'jean', 'short', 'skirt', 'trouser', 'legging'].some(w => catLower.includes(w))) {
            description = 'lower_body';
        } else if (['dress', 'gown', 'jumpsuit', 'romper'].some(w => catLower.includes(w))) {
            description = 'dresses';
        }
        try {
            const result = await apiService.generateTryOn(currentImage, garment.image_url, description);
            if (result) {
                currentImage = result;
            }
        } catch (err: any) {
            alert(`Error: ${err.message}`);
            setLoading(false);
            return;
        }
    }
    
    setResultImage(currentImage);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!resultImage || selectedGarmentIds.length === 0) return;
    
    const brands = selectedGarmentIds.map(id => clothingItems.find(i => i.id === id)?.brand).filter(Boolean);
    const uniqueBrands = Array.from(new Set(brands));
    
    await onSaveOutfit({
      title: `AI Try-On: ${uniqueBrands.join(' + ') || 'New'} Look`,
      occasion: 'Virtual Try-On',
      model_image_url: resultImage,
      item_ids: selectedGarmentIds,
      styling_notes: 'Generated using Hugging Face IDM-VTON.'
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h2 className="text-lg font-bold text-neutral-900 font-['Syne',sans-serif] flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-500" />
            AI Virtual Try-On
          </h2>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {!resultImage ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Person Image Selection */}
              <div className="space-y-3 flex flex-col">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  1. Select Your Avatar
                </label>
                <div className="flex-1 border border-neutral-200 rounded-xl p-3 overflow-y-auto max-h-[400px]">
                  {avatars.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-8">No avatars found. Go to Account Settings to upload one.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {avatars.map(av => (
                        <div 
                          key={av.id} 
                          onClick={() => setPersonImage(av.image_base64)}
                          className={`cursor-pointer rounded-lg border-2 p-1 transition-all ${personImage === av.image_base64 ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:bg-neutral-50'}`}
                        >
                          <img src={av.image_base64} alt={av.name} className="w-full aspect-[3/4] object-cover rounded-md bg-neutral-100" />
                          <p className="text-[10px] text-center mt-1 font-semibold truncate text-neutral-600">{av.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Garment Selection */}
              <div className="space-y-3 flex flex-col">
                <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                  2. Select Garments (Max 1 per category)
                </label>
                <div className="flex-1 border border-neutral-200 rounded-xl p-3 overflow-y-auto max-h-[400px]">
                  {clothingItems.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center py-8">Your closet is empty.</p>
                  ) : (
                    <div className="space-y-4">
                      {Array.from(new Set(clothingItems.map(i => i.category))).map(cat => {
                          const itemsInCat = clothingItems.filter(i => i.category === cat);
                          return (
                              <div key={cat}>
                                  <h4 className="text-xs font-bold text-neutral-500 mb-2 uppercase">{cat}</h4>
                                  <div className="grid grid-cols-3 gap-2">
                                    {itemsInCat.map(item => {
                                        const isSelected = selectedGarmentIds.includes(item.id);
                                        return (
                                        <div 
                                          key={item.id} 
                                          onClick={() => {
                                              if (isSelected) {
                                                  setSelectedGarmentIds(selectedGarmentIds.filter(id => id !== item.id));
                                              } else {
                                                  // Remove other items in same category, then add this one
                                                  const othersInCat = itemsInCat.map(i => i.id);
                                                  const filtered = selectedGarmentIds.filter(id => !othersInCat.includes(id));
                                                  setSelectedGarmentIds([...filtered, item.id]);
                                              }
                                          }}
                                          className={`cursor-pointer rounded-lg border-2 p-1 transition-all relative ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:bg-neutral-50'}`}
                                        >
                                          {isSelected && (
                                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center border-2 border-white z-10">
                                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                              </div>
                                          )}
                                          <img src={item.image_url} alt={item.brand} className="w-full aspect-square object-cover rounded-md bg-neutral-100" />
                                        </div>
                                        );
                                    })}
                                  </div>
                              </div>
                          );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <img src={resultImage} alt="Result" className="w-full max-w-sm rounded-xl shadow-lg aspect-[3/4] object-cover" />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3 sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-neutral-600 hover:text-neutral-900 transition-colors">
            Cancel
          </button>
          
          {!resultImage ? (
            <button
              onClick={handleGenerate}
              disabled={!personImage || selectedGarmentIds.length === 0 || loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating (30-60s)...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Try-On
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-neutral-900 hover:bg-black rounded-lg shadow-sm transition-all"
            >
              Save Outfit to Studio
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
