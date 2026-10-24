'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ClothingItem, Category, ItemStatus, WardrobeStats, OutfitSuggestion, AmbassadorProfile } from '../types';
import { apiService } from '../services/api';
import { Header } from './Header';
import { StatsBanner } from './StatsBanner';
import { FilterBar } from './FilterBar';
import { ClothingCard } from './ClothingCard';
import { UploadModal } from './UploadModal';
import { ItemDetailModal } from './ItemDetailModal';
import { MobileNav } from './MobileNav';
import { ManageTagsModal } from './ManageTagsModal';
import { OutfitStudio } from './OutfitStudio';
import { AccountModal } from './AccountModal';
import { AuthScreen } from './AuthScreen';
import { CampaignBoard } from './CampaignBoard';
import { AnalyticsHub } from './analytics/AnalyticsHub';
import { ErrorBoundary } from './ErrorBoundary';
import { Plus, RotateCcw, PackageOpen, Sparkles, Shirt } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentTab, setCurrentTab] = useState<'closet' | 'outfits' | 'campaigns' | 'analytics'>('closet');
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<OutfitSuggestion[]>([]);
  const [profile, setProfile] = useState<AmbassadorProfile>(apiService.getProfile());
  const [loading, setLoading] = useState(true);

  // Filters for closet
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<ItemStatus | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);
  const [manageTagsType, setManageTagsType] = useState<'categories' | 'statuses' | 'occasions' | null>(null);
  const [targetOutfitId, setTargetOutfitId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Check login state and listen for session expiration
  useEffect(() => {
    setIsLoggedIn(apiService.isLoggedIn());

    const handleAuthExpired = () => {
      setIsLoggedIn(false);
      showToast('Session expired. Please sign in to continue.');
    };

    window.addEventListener('closet_pr_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('closet_pr_auth_expired', handleAuthExpired);
    };
  }, []);

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      const [itemsData, outfitsData, profileData] = await Promise.all([
        apiService.getItems(),
        apiService.getOutfits(),
        apiService.fetchProfile()
      ]);
      setItems(itemsData);
      setOutfits(outfitsData);
      setProfile(profileData);
    } catch (err) {
      console.error('Failed to load wardrobe data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  // Compute unique seeded brands count
  const seededBrandsCount = useMemo(() => {
    return new Set(items.map(i => i.brand)).size;
  }, [items]);

  // Merge default and custom options (preserving custom order if saved)
  const allCategories = useMemo(() => {
    if (profile.custom_categories) {
      return profile.custom_categories.split(',').map(s => s.trim()).filter(Boolean);
    }
    return ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories', 'Dresses'];
  }, [profile.custom_categories]);

  const allStatuses = useMemo(() => {
    if (profile.custom_statuses) {
      return profile.custom_statuses.split(',').map(s => s.trim()).filter(Boolean);
    }
    return ['Unworn', 'Worn', 'Posted', 'Needs Returning'];
  }, [profile.custom_statuses]);

  // Compute Stats
  const stats: WardrobeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    allStatuses.forEach(s => {
      counts[s] = 0;
    });
    items.forEach(i => {
      if (counts[i.status] !== undefined) {
        counts[i.status]++;
      } else {
        counts[i.status] = 1;
      }
    });
    return {
      total: items.length,
      statusCounts: counts,
    };
  }, [items, allStatuses]);

  // Filter closet items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'All' && item.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (selectedStatus !== 'All' && item.status.toLowerCase() !== selectedStatus.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const brandMatch = item.brand.toLowerCase().includes(q);
        const tagMatch = item.campaign_tag?.toLowerCase().includes(q) || false;
        const notesMatch = item.notes?.toLowerCase().includes(q) || false;
        if (!brandMatch && !tagMatch && !notesMatch) return false;
      }
      return true;
    });
  }, [items, selectedCategory, selectedStatus, searchQuery]);

  // Clothing Item Actions
  const handleUploadItem = async (data: {
    brand: string;
    category: Category;
    status: ItemStatus;
    image_url: string;
    campaign_tag?: string;
    notes?: string;
    return_deadline?: string;
  }) => {
    const newItem = await apiService.uploadItem(data);
    setItems(prev => [newItem, ...prev]);
    showToast(`Logged ${newItem.brand} into your closet`);
  };

  const handleUpdateStatus = async (id: string, newStatus: ItemStatus) => {
    const updated = await apiService.updateItemStatus(id, newStatus);
    if (updated) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
      if (selectedItem?.id === id) {
        setSelectedItem(prev => prev ? { ...prev, status: newStatus } : null);
      }
      showToast(`Marked as ${newStatus}`);
    }
  };

  const handleUpdateItem = async (id: string, updates: Partial<ClothingItem>) => {
    const updated = await apiService.updateItem(id, updates);
    if (updated) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
      if (selectedItem?.id === id) {
        setSelectedItem(prev => prev ? { ...prev, ...updates } : null);
      }
      showToast('Piece updated successfully');
    }
  };

  const handleDeleteItem = async (id: string) => {
    await apiService.deleteItem(id);
    setItems(prev => prev.filter(item => item.id !== id));
    showToast('Item removed');
  };

  // Outfit Actions
  const handleSaveOutfit = async (data: {
    title: string;
    occasion: string;
    model_image_url: string;
    item_ids: string[];
    styling_notes?: string;
    is_custom_fit_pic?: boolean;
  }) => {
    const newOutfit = await apiService.saveOutfit(data);
    setOutfits(prev => [newOutfit, ...prev]);
    showToast(`Saved outfit: "${newOutfit.title}"`);
  };

  const handleOutfitGenerated = (newOutfit: OutfitSuggestion) => {
    setOutfits(prev => [newOutfit, ...prev]);
    showToast(`AI suggested look: "${newOutfit.title}"`);
  };

  const handleUpdateFitPic = async (outfitId: string, photoUrl: string) => {
    const updated = await apiService.updateOutfitFitPic(outfitId, photoUrl);
    if (updated) {
      setOutfits(prev => prev.map(o => o.id === outfitId ? updated : o));
      showToast('Fit picture updated! Now displaying you in this outfit.');
    }
  };

  const handleBatchStatusChange = async (itemIds: string[], status: ItemStatus) => {
    await apiService.batchUpdateOutfitItemStatus(itemIds, status);
    setItems(prev => prev.map(item => itemIds.includes(item.id) ? { ...item, status } : item));
    showToast(`Marked all outfit pieces as ${status}`);
  };

  const handleDeleteOutfit = async (outfitId: string) => {
    await apiService.deleteOutfit(outfitId);
    setOutfits(prev => prev.filter(o => o.id !== outfitId));
    showToast('Outfit removed');
  };

  // Account & Profile Handlers
  const handleUpdateProfile = async (updates: Partial<AmbassadorProfile>) => {
    const updated = await apiService.updateProfile(updates);
    setProfile(updated);
    showToast('Profile updated successfully');
  };

  const handleChangePassword = async (curr: string, next: string) => {
    return await apiService.changePassword(curr, next);
  };

  const handleSignOut = () => {
    apiService.logout();
    setIsLoggedIn(false);
    showToast('Signed out of ClosetPR');
  };

  const handleSignIn = (email: string) => {
    setIsLoggedIn(true);
    // Profile will be re-fetched properly from loadData -> apiService.getProfile()
  };



  // If signed out, display minimalist authentication screen
  if (!isLoggedIn) {
    return <AuthScreen onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 pb-20 sm:pb-12">
      {/* Top Header with Switcher & Account Button */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        profile={profile}
        unwornCount={stats.statusCounts['Unworn'] || 0}
        returnDueCount={stats.statusCounts['Needs Returning'] || 0}
        outfitsCount={outfits.length}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-7">
        {/* View Header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-normal text-neutral-900 font-sans">
              {currentTab === 'closet'
                ? 'Virtual Closet'
                : currentTab === 'outfits'
                ? 'Outfits'
                : currentTab === 'campaigns'
                ? 'Campaigns Board'
                : 'Analytics & Reports'}
            </h1>
            <p className="text-sm text-neutral-500 mt-1">
              {currentTab === 'closet'
                ? 'Track seeded PR packages, worn campaign looks, and showroom returns.'
                : currentTab === 'outfits'
                ? 'Manage your styled looks, explore AI outfit suggestions, and track ambassador fit pics.'
                : currentTab === 'campaigns'
                ? 'Track brand deliverables, campaign deadlines, and linked outfits.'
                : 'Executive dashboards, customizable reports, and fashion gifting intelligence.'}
            </p>
          </div>
        </div>

        {/* Tab Content */}
        {currentTab === 'analytics' ? (
          <ErrorBoundary>
            <AnalyticsHub
              items={items}
              outfits={outfits}
              allCategories={allCategories}
              allStatuses={allStatuses}
            />
          </ErrorBoundary>
        ) : currentTab === 'campaigns' ? (
          <ErrorBoundary>
            <CampaignBoard
              profile={profile}
              outfits={outfits}
              clothingItems={items}
              onUpdateProfile={handleUpdateProfile}
            />
          </ErrorBoundary>
        ) : currentTab === 'outfits' ? (
          <OutfitStudio
            outfits={outfits}
            clothingItems={items}
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onSaveOutfit={handleSaveOutfit}
            onUpdateFitPic={handleUpdateFitPic}
            onBatchStatusChange={handleBatchStatusChange}
            onDeleteOutfit={handleDeleteOutfit}
            onSelectPiece={setSelectedItem}
            onOutfitGenerated={handleOutfitGenerated}
            onManageOccasions={() => setManageTagsType('occasions')}
            targetOutfitId={targetOutfitId}
            onClearTargetOutfit={() => setTargetOutfitId(null)}
          />
        ) : (
          <>
            {/* Ambassador Stats Summary Banner */}
            <StatsBanner
              stats={stats}
              allStatuses={allStatuses}
              statusIcons={profile.status_icons_json ? JSON.parse(profile.status_icons_json) : {}}
              activeStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
            />

            {/* Filter Bar (Category tabs & status controls) */}
            <FilterBar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedStatus={selectedStatus}
              onSelectStatus={setSelectedStatus}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              totalFilteredCount={filteredItems.length}
              allCategories={allCategories}
              allStatuses={allStatuses}
              onManageCategories={() => setManageTagsType('categories')}
              onManageStatuses={() => setManageTagsType('statuses')}
            />

            {/* Pinterest-style Closet Grid */}
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-medium">Opening Closet...</p>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredItems.map((item) => (
                  <ClothingCard
                    key={item.id}
                    item={item}
                    onSelect={setSelectedItem}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 sm:py-20 px-4 text-center bg-white rounded-2xl border border-dashed border-neutral-200 max-w-md mx-auto my-6">
                <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-3 text-neutral-500">
                  <PackageOpen className="w-6 h-6 stroke-[1.7]" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 font-['Syne',sans-serif]">
                  No clothing items found
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                  {searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All'
                    ? 'Try broadening your category or status filter parameters.'
                    : 'Your PR wardrobe is empty. Log your first seeded package!'}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {(searchQuery || selectedCategory !== 'All' || selectedStatus !== 'All') && (
                    <button
                      onClick={() => {
                        setSelectedCategory('All');
                        setSelectedStatus('All');
                        setSearchQuery('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  )}
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-18 sm:bottom-6 right-6 z-50 bg-neutral-900 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-xl border border-neutral-800 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}

      {/* Manage Account Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
        onChangePassword={handleChangePassword}
        onSignOut={handleSignOut}
        seededBrandsCount={seededBrandsCount}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadItem}
        allCategories={allCategories}
        allStatuses={allStatuses}
      />

      {/* Item Detail Sheet */}
      <ItemDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdateItem={handleUpdateItem}
        onDelete={handleDeleteItem}
        relatedOutfits={selectedItem ? outfits.filter(o => o.item_ids.includes(selectedItem.id)) : []}
        onNavigateToOutfit={(outfitId) => {
          setSelectedItem(null);
          setCurrentTab('outfits');
          setTargetOutfitId(outfitId);
        }}
      />

      {/* Mobile-First Bottom Navigation Bar */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        profile={profile}
        unwornCount={stats.statusCounts['Unworn'] || 0}
        outfitsCount={outfits.length}
      />

      {/* Manage Tags Modal */}
      <ManageTagsModal
        isOpen={manageTagsType !== null}
        onClose={() => setManageTagsType(null)}
        title={manageTagsType === 'categories' ? 'Categories' : manageTagsType === 'statuses' ? 'Statuses' : 'Occasions'}
        defaultTags={
          manageTagsType === 'categories' ? ['Tops', 'Bottoms', 'Outerwear', 'Footwear', 'Accessories', 'Dresses'] :
          manageTagsType === 'statuses' ? ['Unworn', 'Worn', 'Posted', 'Needs Returning'] :
          manageTagsType === 'occasions' ? ['Streetwear Editorial', 'Campaign Shoot', 'Daily GRWM', 'VIP Event Launch'] : []
        }
        customTagsStr={
          manageTagsType === 'categories' ? profile.custom_categories || '' :
          manageTagsType === 'statuses' ? profile.custom_statuses || '' :
          manageTagsType === 'occasions' ? profile.custom_occasions || '' : ''
        }
        showIcons={manageTagsType === 'statuses'}
        initialIcons={profile.status_icons_json ? JSON.parse(profile.status_icons_json) : {}}
        onSave={async (newTagsStr, iconsMap) => {
          if (!manageTagsType) return;
          const updates: any = {};
          if (manageTagsType === 'categories') updates.custom_categories = newTagsStr;
          if (manageTagsType === 'statuses') {
            updates.custom_statuses = newTagsStr;
            if (iconsMap) {
              updates.status_icons_json = JSON.stringify(iconsMap);
            }
          }
          if (manageTagsType === 'occasions') updates.custom_occasions = newTagsStr;
          await handleUpdateProfile({ ...profile, ...updates });
        }}
      />
    </div>
  );
};
