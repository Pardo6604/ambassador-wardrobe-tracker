import React, { useState } from 'react';
import { ClothingItem, ItemStatus } from '../types';
import { CheckCircle2, Clock, Package, RotateCcw, AlertTriangle, ChevronRight } from 'lucide-react';

interface ClothingCardProps {
  item: ClothingItem;
  onSelect: (item: ClothingItem) => void;
  onUpdateStatus: (id: string, newStatus: ItemStatus) => void;
}

export const ClothingCard: React.FC<ClothingCardProps> = ({
  item,
  onSelect,
  onUpdateStatus,
}) => {
  const [imageError, setImageError] = useState(false);

  // Status configuration with domain colors
  const statusConfig: Record<ItemStatus, { label: string; dot: string; text: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
    'Unworn': {
      label: 'Unworn',
      dot: 'bg-amber-500',
      text: 'text-amber-800',
      bg: 'bg-amber-50/90 border-amber-200/60',
      icon: Package,
    },
    'Worn': {
      label: 'Worn / Styled',
      dot: 'bg-slate-500',
      text: 'text-slate-800',
      bg: 'bg-slate-100/90 border-slate-200/60',
      icon: Clock,
    },
    'Posted': {
      label: 'Posted',
      dot: 'bg-emerald-500',
      text: 'text-emerald-800',
      bg: 'bg-emerald-50/90 border-emerald-200/60',
      icon: CheckCircle2,
    },
    'Needs Returning': {
      label: 'Return Due',
      dot: 'bg-rose-500',
      text: 'text-rose-800',
      bg: 'bg-rose-50/90 border-rose-200/60',
      icon: RotateCcw,
    },
  };

  const currentStatus = statusConfig[item.status] || statusConfig['Unworn'];
  const StatusIcon = currentStatus.icon;

  // Cycle through next logical ambassador status
  const handleQuickStatusCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cycleMap: Record<ItemStatus, ItemStatus> = {
      'Unworn': 'Worn',
      'Worn': 'Posted',
      'Posted': 'Unworn',
      'Needs Returning': 'Posted',
    };
    onUpdateStatus(item.id, cycleMap[item.status]);
  };

  return (
    <div
      onClick={() => onSelect(item)}
      className="group relative bg-white rounded-2xl overflow-hidden border border-neutral-200/70 hover:border-neutral-300 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all duration-200 cursor-pointer flex flex-col"
    >
      {/* Visual Image Container with aspect ratio matching fashion editorial */}
      <div className="relative aspect-[3/4] w-full bg-[#F4F4F3] overflow-hidden flex items-center justify-center">
        {!imageError && item.image_url ? (
          <img
            src={item.image_url}
            alt={`${item.brand} ${item.category}`}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <span className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-700 mb-2 font-bold font-['Syne',sans-serif]">
              {item.brand.slice(0, 2).toUpperCase()}
            </span>
            <span className="text-xs font-semibold text-neutral-700">{item.brand}</span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider mt-0.5">{item.category}</span>
          </div>
        )}

        {/* Floating Status Badge */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight border backdrop-blur-md shadow-xs ${currentStatus.bg} ${currentStatus.text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.dot}`}></span>
            <span>{currentStatus.label}</span>
          </div>
        </div>

        {/* Quick status change button visible on hover or mobile tap */}
        <button
          onClick={handleQuickStatusCycle}
          title="Advance status"
          className="absolute bottom-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-800 shadow-sm flex items-center justify-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity active:scale-95 cursor-pointer"
          aria-label="Advance item status"
        >
          <StatusIcon className="w-3.5 h-3.5" />
        </button>

        {/* Return Deadline notice badge if applicable */}
        {item.status === 'Needs Returning' && item.return_deadline && (
          <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 bg-rose-950/80 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
            <AlertTriangle className="w-2.5 h-2.5 text-rose-300" />
            <span>Due {item.return_deadline}</span>
          </div>
        )}
      </div>

      {/* Card Info Content */}
      <div className="p-3.5 sm:p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between gap-1 text-[11px] text-neutral-400 font-medium mb-1">
            <span className="uppercase tracking-wider">{item.category}</span>
            {item.campaign_tag && (
              <span className="truncate max-w-[130px] text-neutral-500">
                {item.campaign_tag}
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-neutral-900 tracking-tight leading-snug line-clamp-1 font-['Syne',sans-serif]">
            {item.brand}
          </h3>

          {item.notes && (
            <p className="mt-1 text-xs text-neutral-500 line-clamp-1 italic">
              "{item.notes}"
            </p>
          )}
        </div>

        {/* Card Footer with tap prompt */}
        <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
          <span>Added {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
          <div className="flex items-center gap-0.5 text-neutral-700 font-medium group-hover:text-neutral-950">
            <span>Details</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
};
