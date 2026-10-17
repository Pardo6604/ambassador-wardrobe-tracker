import React, { useState, useEffect } from 'react';
import { X, Sparkles, User, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface AutoSuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (avatarId?: string, prompt?: string) => Promise<void>;
  isGenerating: boolean;
}

const OCCASION_CHIPS = [
  { label: 'Fancy Dinner 🍷', text: 'Style me for an elegant fancy dinner' },
  { label: 'Cocktail Party 🍸', text: 'Cocktail party chic and sophisticated' },
  { label: 'Streetwear 👟', text: 'Edgy streetwear editorial look' },
  { label: 'Showroom Meeting 💼', text: 'Fashion showroom business meeting' },
  { label: 'Summer Minimalist ☀️', text: 'Lightweight summer minimalist outfit' },
];

export const AutoSuggestModal: React.FC<AutoSuggestModalProps> = ({
  isOpen, onClose, onGenerate, isGenerating
}) => {
  const [avatars, setAvatars] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiService.getTryonAvatars().then(avs => {
        setAvatars(avs);
        if (avs.length > 0) setSelectedId(avs[0].id);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div>
            <h2 className="font-bold text-neutral-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI Stylist: Curate Outfit
            </h2>
            <p className="text-[11px] text-neutral-400">Context-aware styling based on your closet pieces & descriptions</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {/* Occasion / Styling Directive Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Styling Occasion or Vibe</span>
              <span className="text-[10px] text-neutral-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Style me for a fancy dinner, Paris fashion week, casual brunch..."
              className="w-full px-3 py-2 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
            />
            
            {/* Quick chips */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[10px] text-neutral-400 font-medium">Quick vibes:</span>
              {OCCASION_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setPrompt(chip.text)}
                  className={`px-2 py-0.5 text-[11px] rounded-md transition-colors cursor-pointer border ${
                    prompt === chip.text
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white hover:bg-neutral-100 text-neutral-600 border-neutral-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Scenario Selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5">
              Select Your Avatar Scenario
            </label>
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : avatars.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5 max-h-[220px] overflow-y-auto p-1">
                {avatars.map(av => (
                  <div 
                    key={av.id}
                    onClick={() => setSelectedId(av.id)}
                    className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all relative ${
                      selectedId === av.id ? 'border-neutral-900 shadow-sm ring-2 ring-neutral-900/20' : 'border-transparent hover:border-neutral-300'
                    }`}
                  >
                    <div className="aspect-[3/4] bg-neutral-100 relative">
                      <img src={av.image_base64} alt={av.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                        <p className="text-white text-[10px] font-bold truncate text-center">{av.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-amber-800">No Avatars Found</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Upload an avatar photo in your Account Profile to enable virtual try-on previews!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(selectedId || undefined, prompt.trim() || undefined)}
            disabled={isGenerating || (avatars.length > 0 && !selectedId)}
            className="px-5 py-2.5 bg-neutral-900 text-white text-xs sm:text-sm font-semibold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer shadow-sm"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Styling Look...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                Style Look
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
