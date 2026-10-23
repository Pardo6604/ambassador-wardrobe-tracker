import React from 'react';
import { Plus, Sparkles, Shirt, User, Calendar, BarChart3 } from 'lucide-react';
import { AmbassadorProfile } from '../types';

interface HeaderProps {
  currentTab: 'closet' | 'outfits' | 'campaigns' | 'analytics';
  onSelectTab: (tab: 'closet' | 'outfits' | 'campaigns' | 'analytics') => void;
  onOpenUpload: () => void;
  onOpenAccount: () => void;
  profile: AmbassadorProfile;
  unwornCount: number;
  returnDueCount: number;
  outfitsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenUpload,
  onOpenAccount,
  profile,
  unwornCount,
  returnDueCount,
  outfitsCount,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-neutral-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm tracking-tighter shrink-0">
            <Shirt className="w-4 h-4 stroke-[2.2]" />
          </div>
          <button
            onClick={() => onSelectTab('closet')}
            className="text-lg font-bold tracking-tight text-neutral-900 font-['Syne',sans-serif] hover:opacity-80 transition-opacity text-left cursor-pointer"
          >
            ClosetPR
          </button>
        </div>

        {/* Zone 2: Navigation Switcher Tabs (Closet vs Outfits vs Campaigns vs Analytics) */}
        <nav className="flex items-center p-1 bg-neutral-200/60 rounded-xl">
          <button
            onClick={() => onSelectTab('closet')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'closet'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Wardrobe</span>
            {unwornCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            )}
          </button>

          <button
            onClick={() => onSelectTab('outfits')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'outfits'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Outfits</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded-full font-bold tabular-nums">
              {outfitsCount}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('campaigns')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap hidden sm:flex ${
              currentTab === 'campaigns'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Campaigns</span>
          </button>

          <button
            onClick={() => onSelectTab('analytics')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              currentTab === 'analytics'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-neutral-700" />
            <span>Analytics</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions + Account Profile */}
        <div className="flex items-center gap-2">
          {returnDueCount > 0 && (
            <span className="hidden xl:inline text-xs text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded-md border border-rose-200/60">
              {returnDueCount} Return Due
            </span>
          )}

          <button
            onClick={onOpenUpload}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] rounded-lg transition-all shadow-sm shadow-neutral-900/10 min-h-[38px] cursor-pointer shrink-0"
            aria-label="Upload new clothing item"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden md:inline">Add PR</span>
          </button>

          {/* User Account / Profile Button */}
          <button
            onClick={onOpenAccount}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-lg border border-neutral-200/80 bg-white/80 hover:bg-white hover:border-neutral-300 transition-all cursor-pointer min-h-[38px] group"
            title="Manage account, name, password & sign out"
            aria-label="Manage Account"
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-7 h-7 rounded-full object-cover border border-neutral-900 shadow-2xs group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-neutral-500 group-hover:scale-105 transition-transform">
                <User className="w-4 h-4" />
              </div>
            )}
            <div className="text-left hidden sm:block">
              <span className="text-xs font-bold text-neutral-900 block leading-tight truncate max-w-[90px]">
                {profile.name.split(' ')[0]}
              </span>
              <span className="text-[10px] text-neutral-400 block leading-none">
                Account
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
