import React from 'react';
import { ItemStatus } from '../types';
import { Package, Clock, CheckCircle2, RotateCcw, LayoutGrid, Tag } from 'lucide-react';
import * as Icons from 'lucide-react';

interface StatsBannerProps {
  stats: {
    total: number;
    statusCounts: Record<string, number>;
  };
  allStatuses: string[];
  statusIcons?: Record<string, string>;
  activeStatus: ItemStatus | 'All';
  onSelectStatus: (status: ItemStatus | 'All') => void;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  stats,
  allStatuses,
  statusIcons = {},
  activeStatus,
  onSelectStatus,
}) => {
  const getIconForStatus = (s: string) => {
    if (statusIcons[s]) {
      // @ts-ignore
      return Icons[statusIcons[s]] || Tag;
    }
    switch (s.toLowerCase()) {
      case 'unworn': return Package;
      case 'worn': return Clock;
      case 'posted': return CheckCircle2;
      case 'needs returning': return RotateCcw;
      default: return Tag;
    }
  };

  const getAccentForStatus = (s: string) => {
    switch (s.toLowerCase()) {
      case 'unworn': return 'text-amber-600';
      case 'worn': return 'text-slate-600';
      case 'posted': return 'text-emerald-600';
      case 'needs returning': return 'text-rose-600';
      default: return 'text-blue-600';
    }
  };

  const getDescForStatus = (s: string) => {
    switch (s.toLowerCase()) {
      case 'unworn': return 'Ready for styling';
      case 'worn': return 'Content in progress';
      case 'posted': return 'Reel or post delivered';
      case 'needs returning': return 'Showroom loaners';
      default: return 'Custom status';
    }
  };

  const allCard = {
    id: 'All' as const,
    label: 'Total Wardrobe',
    count: stats.total,
    icon: LayoutGrid,
    desc: 'All PR & Seeded Pieces',
    accent: 'text-neutral-600',
  };

  const statusCards = allStatuses.map(s => ({
    id: s,
    label: s,
    count: stats.statusCounts[s] || 0,
    icon: getIconForStatus(s),
    desc: getDescForStatus(s),
    accent: getAccentForStatus(s)
  }));

  const cards = [allCard, ...statusCards];

  return (
    <div className="w-full bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex overflow-x-auto hide-scrollbar">
          <div className="flex p-4 gap-4 w-full">
            {cards.map((card) => {
              const isActive = activeStatus === card.id;
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => onSelectStatus(card.id)}
                  className={`
                    relative flex flex-col w-[200px] sm:w-[calc(20%-12.8px)] shrink-0 p-5 rounded-2xl border transition-all duration-200 overflow-hidden group text-left
                    ${isActive 
                      ? 'bg-white border-neutral-900 shadow-sm' 
                      : 'bg-white border-neutral-200/60 hover:border-neutral-300 hover:shadow-sm'
                    }
                  `}
                >
                  <div className="flex items-start justify-between w-full mb-3">
                    <span className={`text-sm font-semibold tracking-wide ${isActive ? 'text-neutral-900' : 'text-neutral-500'}`}>
                      {card.label}
                    </span>
                    <div className={`p-2 rounded-xl transition-colors ${isActive ? card.accent.replace('text-', 'bg-').replace('600', '100') : 'bg-neutral-50 group-hover:bg-neutral-100'}`}>
                      <Icon className={`w-5 h-5 ${card.accent}`} />
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-bold tracking-tight ${isActive ? 'text-neutral-900' : 'text-neutral-700'}`}>
                      {card.count}
                    </span>
                  </div>
                  
                  <span className={`text-xs mt-1 ${isActive ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    {card.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
