import React, { useState } from 'react';
import { ClothingItem, OutfitSuggestion, AIGeneratedAnalyticsResult } from '../../types';
import { apiService } from '../../services/api';
import { Sparkles, X, ArrowRight, Check, Table, Layers, Grid, BarChart3, PieChart } from 'lucide-react';

interface AskAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ClothingItem[];
  outfits: OutfitSuggestion[];
  onApplyResult: (result: AIGeneratedAnalyticsResult) => void;
}

const SUGGESTED_PROMPTS = [
  { label: 'Unworn Items by Brand', prompt: 'Create a summary report of all unworn PR items grouped by brand', type: 'report' },
  { label: 'Category vs Status Matrix', prompt: 'Generate a 2D matrix report comparing categories against wear statuses', type: 'report' },
  { label: 'Campaign Deliverable Pipeline', prompt: 'Build a deliverable pipeline dashboard tracking PR items to campaign completion', type: 'dashboard' },
  { label: 'Footwear & Accessories Breakdown', prompt: 'Analyze my footwear and accessories allocation across partner fashion houses', type: 'dashboard' },
  { label: 'Wardrobe Health & Gifting ROI', prompt: 'Show me my wardrobe utilization velocity and top gifting brands', type: 'dashboard' },
];

export const AskAIModal: React.FC<AskAIModalProps> = ({
  isOpen,
  onClose,
  items,
  outfits,
  onApplyResult,
}) => {
  const [prompt, setPrompt] = useState('');
  const [targetType, setTargetType] = useState<'auto' | 'dashboard' | 'report'>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<AIGeneratedAnalyticsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (queryText?: string, explicitType?: 'auto' | 'dashboard' | 'report') => {
    const q = (queryText || prompt).trim();
    if (!q) return;
    setIsLoading(true);
    setError(null);
    setGeneratedResult(null);

    try {
      const res = await apiService.aiGenerateAnalytics(q, explicitType || targetType);
      if (res) {
        setGeneratedResult(res);
      } else {
        setError("Failed to generate analytics from prompt. Please try again.");
      }
    } catch (e: any) {
      setError(e.message || "Error communicating with AI service");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (p: { label: string; prompt: string; type: string }) => {
    setPrompt(p.prompt);
    setTargetType(p.type as any);
    handleGenerate(p.prompt, p.type as any);
  };

  const handleApply = () => {
    if (generatedResult) {
      onApplyResult(generatedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col border border-neutral-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-900 border border-amber-300 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 font-['Syne',sans-serif]">
                Ask AI Analytics Copilot
              </h3>
              <p className="text-xs text-neutral-500">
                Ask in plain English to generate customized reports or dashboard layouts
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Prompt Input Form */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Build me a dashboard tracking unworn PR items from Prada and Balenciaga..."
                className="w-full p-3.5 text-xs sm:text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:bg-white resize-none"
              />
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                className="absolute right-3 bottom-3 px-4 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Target format pills */}
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span className="text-[11px] font-semibold text-neutral-400">Target Type:</span>
              {(['auto', 'dashboard', 'report'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTargetType(t)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize transition-colors ${
                    targetType === t ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Prompts */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2">
              Suggested Ideas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectPrompt(p)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-700 hover:border-neutral-900 hover:bg-white transition-all text-left"
                >
                  ✨ {p.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Generated Result Preview */}
          {generatedResult && (
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-900">
                    {generatedResult.type}
                  </span>
                  <h4 className="text-sm font-bold text-neutral-900 font-['Syne',sans-serif]">
                    {generatedResult.title}
                  </h4>
                </div>
              </div>

              <p className="text-xs text-neutral-700 leading-relaxed">
                {generatedResult.summary}
              </p>

              {/* Action buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open {generatedResult.type === 'report' ? 'Report' : 'Dashboard'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500">
          <span>Powered by ClosetPR fashion analytics intelligence</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-neutral-600 hover:text-neutral-900 font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
