import React, { useState, useEffect } from 'react';
import { X, Sparkles, Package, Layers, SlidersHorizontal, Check, Info } from 'lucide-react';

interface AutoSuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt?: string, instructions?: string) => Promise<void>;
  isGenerating: boolean;
  defaultInstructions?: string;
  onSaveDefaultInstructions?: (instructions: string) => Promise<void>;
}

const OCCASION_CHIPS = [
  { label: 'Fancy Dinner 🍷', text: 'Style me for an elegant fancy dinner' },
  { label: 'Cocktail Party 🍸', text: 'Cocktail party chic and sophisticated' },
  { label: 'Streetwear Editorial 👟', text: 'Edgy streetwear editorial look' },
  { label: 'Summer Minimalist ☀️', text: 'Lightweight summer minimalist outfit' },
  { label: 'Showroom Press 💼', text: 'Fashion showroom business meeting' },
  { label: 'Date Night Chic ✨', text: 'Romantic date night luxury look' },
];

const INSTRUCTION_PRESETS = [
  { label: 'Monochrome Palette 🖤', rule: 'Monochrome tone-on-tone palette' },
  { label: 'Always Include Accessories 💍', rule: 'Always include a statement accessory' },
  { label: 'Layer with Outerwear 🧥', rule: 'Layer with structured outerwear' },
  { label: 'No Sneakers (Loafers/Boots) 👞', rule: 'No athletic sneakers, formal shoes only' },
  { label: 'Warm Earth Tones 🍂', rule: 'Warm earth tone color harmony' },
  { label: 'High-Low Mix ⚖️', rule: 'Contrast high-low mix of luxury and casual pieces' },
  { label: 'Prioritize Unworn PR 🏷️', rule: 'Prioritize unworn seeded PR pieces' },
];

export const AutoSuggestModal: React.FC<AutoSuggestModalProps> = ({
  isOpen, 
  onClose, 
  onGenerate, 
  isGenerating,
  defaultInstructions = '',
  onSaveDefaultInstructions,
}) => {
  const [prompt, setPrompt] = useState<string>('');
  const [instructions, setInstructions] = useState<string>(defaultInstructions);
  const [saveAsDefault, setSaveAsDefault] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setInstructions(defaultInstructions);
    }
  }, [isOpen, defaultInstructions]);

  if (!isOpen) return null;

  const handleAddInstructionPreset = (rule: string) => {
    const trimmed = instructions.trim();
    if (!trimmed) {
      setInstructions(rule);
    } else if (trimmed.toLowerCase().includes(rule.toLowerCase())) {
      const parts = trimmed.split(',').map(s => s.trim()).filter(s => s.toLowerCase() !== rule.toLowerCase());
      setInstructions(parts.join(', '));
    } else {
      setInstructions(`${trimmed}, ${rule}`);
    }
  };

  const handleCurate = async () => {
    if (saveAsDefault && onSaveDefaultInstructions && instructions.trim() !== defaultInstructions.trim()) {
      onSaveDefaultInstructions(instructions.trim());
    }
    await onGenerate(prompt.trim() || undefined, instructions.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[92vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <div>
            <h2 className="font-bold text-neutral-900 flex items-center gap-2 font-['Syne',sans-serif]">
              <Package className="w-4 h-4 text-neutral-900" />
              AI Stylist: Curate Outfit Package
            </h2>
            <p className="text-[11px] text-neutral-400">Curates cohesive piece packages guided by your instructions and descriptions</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {/* Step 1: Occasion / Aesthetic Vibe */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>1. Occasion or Aesthetic Vibe</span>
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

          {/* Step 2: Instructions to the AI on how to build the outfits */}
          <div className="pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-900" />
                <span>2. Instructions to the AI</span>
              </label>
              <span className="text-[10px] text-neutral-400 font-normal lowercase">How to build the look</span>
            </div>

            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Instruct the AI: e.g. Always include a statement accessory, maintain a monochrome black palette, pair structured blazer with wide-leg pants, no sneakers..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white transition-all resize-none"
            />

            {/* Instruction Preset Rule Pills */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[10px] text-neutral-400 font-medium">Add rules:</span>
              {INSTRUCTION_PRESETS.map(preset => {
                const isSelected = instructions.toLowerCase().includes(preset.rule.toLowerCase());
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleAddInstructionPreset(preset.rule)}
                    className={`px-2 py-1 text-[10.5px] font-medium rounded-lg transition-colors cursor-pointer border flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                        : 'bg-white hover:bg-neutral-100 text-neutral-700 border-neutral-200/80'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-amber-700" />}
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Save as default checkbox */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="saveDefaultInstructions"
                checked={saveAsDefault}
                onChange={(e) => setSaveAsDefault(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
              />
              <label htmlFor="saveDefaultInstructions" className="text-[11px] text-neutral-600 cursor-pointer select-none">
                Save these styling instructions as my default for future outfits
              </label>
            </div>
          </div>

          {/* Description Engine Explainer Card */}
          <div className="p-3.5 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
              <Layers className="w-3.5 h-3.5 text-neutral-700" />
              <span>How Description-Based Curation Works</span>
            </div>
            <p className="text-[11px] text-neutral-500 leading-relaxed">
              The AI Stylist evaluates each piece's <strong className="text-neutral-700 font-medium">description, fabric</strong> (wool, cashmere, silk, leather), <strong className="text-neutral-700 font-medium">cut</strong>, and <strong className="text-neutral-700 font-medium">color harmony</strong>, applying your instructions to assemble a cohesive package.
            </p>
            <div className="pt-1 flex items-center gap-1.5 text-[10px] text-amber-700 font-medium">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Unworn seeded PR pieces are automatically highlighted to assist your deliverable schedule.</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between gap-2">
          {instructions && (
            <button
              type="button"
              onClick={() => setInstructions('')}
              className="text-xs text-neutral-400 hover:text-neutral-700 cursor-pointer"
            >
              Clear instructions
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleCurate}
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
    </div>
  );
};
