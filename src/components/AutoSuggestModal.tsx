import React, { useState } from 'react';
import { X, Sparkles, Package, Layers, Info } from 'lucide-react';

interface AutoSuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt?: string) => Promise<void>;
  isGenerating: boolean;
}

const OCCASION_CHIPS = [
  { label: 'Fancy Dinner 🍷', text: 'Style me for an elegant fancy dinner' },
  { label: 'Cocktail Party 🍸', text: 'Cocktail party chic and sophisticated' },
  { label: 'Streetwear Editorial 👟', text: 'Edgy streetwear editorial look' },
  { label: 'Summer Minimalist ☀️', text: 'Lightweight summer minimalist outfit' },
  { label: 'Showroom Press 💼', text: 'Fashion showroom business meeting' },
  { label: 'Date Night Chic ✨', text: 'Romantic date night luxury look' },
];

export const AutoSuggestModal: React.FC<AutoSuggestModalProps> = ({
  isOpen, onClose, onGenerate, isGenerating
}) => {
  const [prompt, setPrompt] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div>
            <h2 className="font-bold text-neutral-900 flex items-center gap-2 font-['Syne',sans-serif]">
              <Package className="w-4 h-4 text-neutral-900" />
              AI Stylist: Curate Outfit Package
            </h2>
            <p className="text-[11px] text-neutral-400">Assembles cohesive piece packages based on your clothes' descriptions</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Occasion / Styling Directive Input */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Occasion or Aesthetic Vibe</span>
              <span className="text-[10px] text-neutral-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Style me for a fancy dinner, summer rooftop cocktail, Parisian streetwear..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all"
            />
            
            {/* Quick chips */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <span className="text-[10px] text-neutral-400 font-medium">Quick vibes:</span>
              {OCCASION_CHIPS.map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setPrompt(chip.text)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer border ${
                    prompt === chip.text
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description Engine Explainer Card */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
              <Layers className="w-3.5 h-3.5 text-neutral-700" />
              <span>How Description-Based Curation Works</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              The AI Stylist evaluates each piece's <strong className="text-neutral-700 font-medium">description, fabric</strong> (e.g. cashmere, silk, distressed leather), <strong className="text-neutral-700 font-medium">cut</strong>, and <strong className="text-neutral-700 font-medium">color harmony</strong> to bundle matching items into a single, cohesive outfit package.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] text-amber-700 font-medium">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Unworn seeded PR pieces are automatically prioritized to help you fulfill deliverables!</span>
            </div>
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
            onClick={() => onGenerate(prompt.trim() || undefined)}
            disabled={isGenerating}
            className="px-5 py-2.5 bg-neutral-900 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer shadow-sm active:scale-95"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Curating Package...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                Curate Outfit Package
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
