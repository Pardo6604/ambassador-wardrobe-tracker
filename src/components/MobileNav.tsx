import React from 'react';
import { ItemStatus, AmbassadorProfile } from '../types';
import { LayoutGrid, Sparkles, Plus, Shirt, User, Calendar, BarChart3 } from 'lucide-react';

interface MobileNavProps {
  currentTab: 'closet' | 'outfits' | 'campaigns' | 'analytics';
  onSelectTab: (tab: 'closet' | 'outfits' | 'campaigns' | 'analytics') => void;
  activeStatus: ItemStatus | 'All';
  onSelectStatus: (status: ItemStatus | 'All') => void;
  onOpenUpload: () => void;
  onOpenAccount: () => void;
  profile: AmbassadorProfile;
  unwornCount: number;
  outfitsCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  activeStatus,
  onSelectStatus,
  onOpenUpload,
  onOpenAccount,
  profile,
  unwornCount,
  outfitsCount,
}) => {
  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F6]/95 backdrop-blur-md border-t border-neutral-200/80 px-1 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-6 items-center max-w-md mx-auto h-14">
        {/* Tab 1: Wardrobe Closet */}
        <button
          onClick={() => {
            onSelectTab('closet');
            onSelectStatus('All');
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
            currentTab === 'closet' && activeStatus === 'All'
              ? 'text-neutral-900 font-semibold'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Shirt className="w-5 h-5 stroke-[2]" />
          <span className="text-[9.5px] tracking-tight mt-0.5">Closet</span>
        </button>

        {/* Tab 2: Campaigns */}
        <button
          onClick={() => onSelectTab('campaigns')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
            currentTab === 'campaigns'
              ? 'text-neutral-900 font-semibold'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Calendar className="w-5 h-5 stroke-[2]" />
          <span className="text-[9.5px] tracking-tight mt-0.5">Campaigns</span>
        </button>

        {/* Tab 3: Outfits & Fit Pics */}
        <button
          onClick={() => onSelectTab('outfits')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
            currentTab === 'outfits'
              ? 'text-neutral-900 font-semibold'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <Sparkles className="w-5 h-5 stroke-[2] text-amber-500" />
          <span className="text-[9.5px] tracking-tight mt-0.5">Outfits</span>
        </button>

        {/* Tab 4: Analytics */}
        <button
          onClick={() => onSelectTab('analytics')}
          className={`relative flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
            currentTab === 'analytics'
              ? 'text-neutral-900 font-semibold'
              : 'text-neutral-400 hover:text-neutral-700'
          }`}
        >
          <BarChart3 className="w-5 h-5 stroke-[2]" />
          <span className="text-[9.5px] tracking-tight mt-0.5">Stats</span>
        </button>

        {/* Tab 5: Add New */}
        <button
          onClick={onOpenUpload}
          className="flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer text-neutral-900 active:scale-95 transition-transform"
        >
          <div className="w-6 h-6 rounded-full bg-neutral-900 text-white flex items-center justify-center shadow-xs">
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <span className="text-[9.5px] tracking-tight mt-0.5 font-medium">Add</span>
        </button>

        {/* Tab 6: Account */}
        <button
          onClick={onOpenAccount}
          className="flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer text-neutral-500 hover:text-neutral-900 active:scale-95 transition-transform"
        >
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-5 h-5 rounded-full object-cover border border-neutral-900 shadow-2xs"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-neutral-200 border border-neutral-300 flex items-center justify-center text-neutral-500 shadow-2xs">
              <User className="w-3 h-3" />
            </div>
          )}
          <span className="text-[9.5px] tracking-tight mt-0.5">Account</span>
        </button>
      </div>
    </nav>
  );
};

