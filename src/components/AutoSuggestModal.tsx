import React, { useState, useEffect } from 'react';
import { X, Sparkles, User, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';

interface AutoSuggestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (avatarId?: string) => Promise<void>;
  isGenerating: boolean;
}

export const AutoSuggestModal: React.FC<AutoSuggestModalProps> = ({
  isOpen, onClose, onGenerate, isGenerating
}) => {
  const [avatars, setAvatars] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h2 className="font-bold text-neutral-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Surprise Me!
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="w-6 h-6 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : avatars.length > 0 ? (
            <>
              <p className="text-xs text-neutral-500 mb-4">
                Select an avatar scenario to base the AI generated look on. The system will layer the garments onto the selected photo.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {avatars.map(av => (
                  <div 
                    key={av.id}
                    onClick={() => setSelectedId(av.id)}
                    className={`cursor-pointer rounded-lg border-2 overflow-hidden transition-all relative ${
                      selectedId === av.id ? 'border-neutral-900 shadow-md ring-2 ring-neutral-900/20' : 'border-transparent hover:border-neutral-300'
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
            </>
          ) : (
            <div className="text-center p-6 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-amber-800">No Avatars Found</p>
              <p className="text-[11px] text-amber-700 mt-1">
                You haven't uploaded any AI Try-On avatars yet. Go to your Account Profile to upload one first!
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-neutral-100 bg-neutral-50">
          <button
            onClick={() => onGenerate(selectedId || undefined)}
            disabled={isGenerating || (avatars.length > 0 && !selectedId)}
            className="w-full py-2.5 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Generating Look...
              </>
            ) : (
              'Generate Outfit'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
