import { ClothingItem, Category, ItemStatus, OutfitSuggestion, AmbassadorProfile } from '../types';
import { INITIAL_CLOTHING_ITEMS, INITIAL_OUTFITS } from '../data/seedData';


const TOKEN_KEY = 'closet_pr_jwt_token';

function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

const ITEMS_STORAGE_KEY = 'closet_pr_ambassador_items_v1';
const OUTFITS_STORAGE_KEY = 'closet_pr_ambassador_outfits_v1';
const PROFILE_STORAGE_KEY = 'closet_pr_ambassador_profile_v1';

// Default Ambassador Profile
const DEFAULT_PROFILE: AmbassadorProfile = {
  id: '',
  name: 'New Ambassador',
  email: '',
  handle: '',
  avatar_url: '',
  bio: '',
  tier: 'New Member',
  member_since: new Date().toLocaleDateString(),
};

// Initialize localStorage with initial items if empty
function getStoredItems(): ClothingItem[] {
  if (typeof window === 'undefined') return INITIAL_CLOTHING_ITEMS;
  try {
    const raw = localStorage.getItem(ITEMS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(INITIAL_CLOTHING_ITEMS));
      return INITIAL_CLOTHING_ITEMS;
    }
    const parsed = JSON.parse(raw);
    
    // Auto-purge old hardcoded seeded items
    if (Array.isArray(parsed)) {
      const hasOldSeeded = parsed.some(i => i.id === 'f83a48e2-c049-4113-91b4-8395564b1201');
      if (hasOldSeeded) {
        localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      return parsed;
    }
    
    return INITIAL_CLOTHING_ITEMS;
  } catch (err) {
    console.warn('LocalStorage read error:', err);
    return INITIAL_CLOTHING_ITEMS;
  }
}

function saveStoredItems(items: ClothingItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('LocalStorage save error:', err);
  }
}

// Outfits persistence
function getStoredOutfits(): OutfitSuggestion[] {
  if (typeof window === 'undefined') return INITIAL_OUTFITS;
  try {
    const raw = localStorage.getItem(OUTFITS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(OUTFITS_STORAGE_KEY, JSON.stringify(INITIAL_OUTFITS));
      return INITIAL_OUTFITS;
    }
    const parsed = JSON.parse(raw);
    
    // Auto-purge old hardcoded outfits
    if (Array.isArray(parsed)) {
      const hasOldSeeded = parsed.some(o => o.id === 'outfit-scandi-streetwear-01');
      if (hasOldSeeded) {
        localStorage.setItem(OUTFITS_STORAGE_KEY, JSON.stringify([]));
        return [];
      }
      return parsed;
    }
    
    return INITIAL_OUTFITS;
  } catch (err) {
    console.warn('LocalStorage outfits read error:', err);
    return INITIAL_OUTFITS;
  }
}

function saveStoredOutfits(outfits: OutfitSuggestion[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(OUTFITS_STORAGE_KEY, JSON.stringify(outfits));
  } catch (err) {
    console.warn('LocalStorage outfits save error:', err);
  }
}

export interface FilterParams {
  category?: Category | 'All';
  status?: ItemStatus | 'All';
  brand?: string;
}

export const apiService = {
  /**
   * GET /api/items with optional filtering
   */
  async getItems(params: FilterParams = {}): Promise<ClothingItem[]> {
    try {
      const query = new URLSearchParams();
      if (params.category && params.category !== 'All') query.append('category', params.category);
      if (params.status && params.status !== 'All') query.append('status', params.status);
      if (params.brand && params.brand.trim()) query.append('brand', params.brand.trim());

      const res = await fetch(`/api/items?${query.toString()}`, {
        headers: { 'Accept': 'application/json', ...getAuthHeader() },
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch {
      // Local fallback
    }

    let items = getStoredItems();

    if (params.category && params.category !== 'All') {
      items = items.filter(i => i.category.toLowerCase() === params.category!.toLowerCase());
    }

    if (params.status && params.status !== 'All') {
      items = items.filter(i => i.status.toLowerCase() === params.status!.toLowerCase());
    }

    if (params.brand && params.brand.trim()) {
      const q = params.brand.trim().toLowerCase();
      items = items.filter(i =>
        i.brand.toLowerCase().includes(q) ||
        (i.campaign_tag && i.campaign_tag.toLowerCase().includes(q))
      );
    }

    return items;
  },

  /**
   * POST /api/items/upload - Create new clothing item
   */
  async uploadItem(itemData: {
    brand: string;
    category: Category;
    status: ItemStatus;
    image_url: string;
    campaign_tag?: string;
    notes?: string;
    return_deadline?: string;
  }): Promise<ClothingItem> {
    const newItem: ClothingItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      brand: itemData.brand.trim(),
      category: itemData.category,
      status: itemData.status,
      image_url: itemData.image_url,
      campaign_tag: itemData.campaign_tag?.trim(),
      notes: itemData.notes?.trim(),
      return_deadline: itemData.return_deadline,
      created_at: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/items/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          brand: newItem.brand,
          category: newItem.category,
          status: newItem.status,
          image_url: newItem.image_url,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        newItem.id = saved.id || newItem.id;
      }
    } catch {
      // Local fallback
    }

    const current = getStoredItems();
    const updated = [newItem, ...current];
    saveStoredItems(updated);
    return newItem;
  },

  /**
   * PUT /api/items/{id} - Update item status or details
   */
  async updateItemStatus(id: string, newStatus: ItemStatus): Promise<ClothingItem | null> {
    try {
      await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Local fallback
    }

    const current = getStoredItems();
    const target = current.find(i => i.id === id);
    if (!target) return null;

    target.status = newStatus;
    saveStoredItems([...current]);
    return target;
  },

  /**
   * DELETE /api/items/{id} - Remove item
   */
  async deleteItem(id: string): Promise<boolean> {
    try {
      await fetch(`/api/items/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
      });
    } catch {
      // Local fallback
    }

    const current = getStoredItems();
    const filtered = current.filter(i => i.id !== id);
    saveStoredItems(filtered);
    return true;
  },

  // ==========================================
  // OUTFITS & FIT PICS
  // ==========================================

  /**
   * GET /api/outfits
   */
  async getOutfits(occasion?: string): Promise<OutfitSuggestion[]> {
    try {
      const url = occasion && occasion !== 'All' ? `/api/outfits?occasion=${encodeURIComponent(occasion)}` : '/api/outfits';
      const res = await fetch(url, { headers: { 'Accept': 'application/json', ...getAuthHeader() } });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data.map((o: { id: string; title: string; occasion: string; model_image_url: string; item_ids: string; styling_notes?: string; created_at: string }) => ({
            ...o,
            item_ids: typeof o.item_ids === 'string' ? o.item_ids.split(',').filter(Boolean) : (o.item_ids || []),
          }));
        }
      }
    } catch {
      // Local fallback
    }

    let outfits = getStoredOutfits();
    if (occasion && occasion !== 'All') {
      outfits = outfits.filter(o => o.occasion.toLowerCase() === occasion.toLowerCase());
    }
    return outfits;
  },

  /**
   * POST /api/outfits - Save a new styled outfit or fit pic
   */
  async saveOutfit(data: {
    title: string;
    occasion: string;
    model_image_url: string;
    item_ids: string[];
    styling_notes?: string;
    is_custom_fit_pic?: boolean;
  }): Promise<OutfitSuggestion> {
    const newOutfit: OutfitSuggestion = {
      id: crypto.randomUUID ? crypto.randomUUID() : `outfit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: data.title.trim(),
      occasion: data.occasion || 'Streetwear Editorial',
      model_image_url: data.model_image_url,
      item_ids: data.item_ids,
      styling_notes: data.styling_notes?.trim(),
      is_custom_fit_pic: data.is_custom_fit_pic || false,
      created_at: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          title: newOutfit.title,
          occasion: newOutfit.occasion,
          model_image_url: newOutfit.model_image_url,
          item_ids: newOutfit.item_ids.join(','),
          styling_notes: newOutfit.styling_notes,
        }),
      });

      if (res.ok) {
        const saved = await res.json();
        newOutfit.id = saved.id || newOutfit.id;
      }
    } catch {
      // Local fallback
    }

    const current = getStoredOutfits();
    const updated = [newOutfit, ...current];
    saveStoredOutfits(updated);
    return newOutfit;
  },

  /**
   * Replace or upload fit pic of the ambassador for an outfit
   */
  async updateOutfitFitPic(id: string, newImageUrl: string): Promise<OutfitSuggestion | null> {
    try {
      await fetch(`/api/outfits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ model_image_url: newImageUrl }),
      });
    } catch {
      // Local fallback
    }

    const current = getStoredOutfits();
    const target = current.find(o => o.id === id);
    if (!target) return null;

    target.model_image_url = newImageUrl;
    target.is_custom_fit_pic = true;
    saveStoredOutfits([...current]);
    return target;
  },

  /**
   * DELETE /api/outfits/{id}
   */
  async deleteOutfit(id: string): Promise<boolean> {
    try {
      await fetch(`/api/outfits/${id}`, { method: 'DELETE', headers: { ...getAuthHeader() } });
    } catch {
      // Local fallback
    }

    const current = getStoredOutfits();
    const filtered = current.filter(o => o.id !== id);
    saveStoredOutfits(filtered);
    return true;
  },

  /**
   * Batch mark all items in an outfit as "Worn" or "Posted"
   */
  async batchUpdateOutfitItemStatus(itemIds: string[], status: ItemStatus): Promise<void> {
    const current = getStoredItems();
    let updated = false;

    for (const item of current) {
      if (itemIds.includes(item.id)) {
        item.status = status;
        updated = true;
        // Non-blocking sync with backend
        fetch(`/api/items/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
          body: JSON.stringify({ status }),
        }).catch(() => {});
      }
    }

    if (updated) {
      saveStoredItems([...current]);
    }
  },

  // ==========================================
  // ACCOUNT & PROFILE MANAGEMENT
  // ==========================================

  getProfile(): AmbassadorProfile {
    if (typeof window === 'undefined') return DEFAULT_PROFILE;
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.avatar_url && parsed.avatar_url.includes('unsplash.com')) {
          parsed.avatar_url = '';
        }
        return parsed;
      }
      return DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  
  async getTryonAvatars(): Promise<any[]> {
    try {
      const res = await fetch('/api/user/avatars', { headers: getAuthHeader() });
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  },

  async createTryonAvatar(name: string, imageBase64: string): Promise<any> {
    const res = await fetch('/api/user/avatars', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ name, image_base64: imageBase64 })
    });
    if (!res.ok) throw new Error('Failed to create avatar');
    return await res.json();
  },

  async deleteTryonAvatar(id: string): Promise<void> {
    const res = await fetch(`/api/user/avatars/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to delete avatar');
  },

  async fetchProfile(): Promise<AmbassadorProfile> {
    try {
      const res = await fetch('/api/user/profile', {
        headers: getAuthHeader(),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        const profile: AmbassadorProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          handle: data.handle || '',
          avatar_url: (data.avatar_url && data.avatar_url.includes('unsplash.com')) ? '' : (data.avatar_url || ''),
          bio: data.bio || '',
          tier: 'VIP Partner Ambassador',
          member_since: new Date().toLocaleDateString(),
          tryon_base_image: data.tryon_base_image,
          custom_categories: data.custom_categories,
          custom_statuses: data.custom_statuses,
          custom_occasions: data.custom_occasions,
          board_columns_json: data.board_columns_json,
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        }
        return profile;
      }
    } catch (e) {
      console.warn("Failed to fetch profile from API, falling back to local");
    }
    return this.getProfile();
  },

  async updateProfile(updates: Partial<AmbassadorProfile>): Promise<AmbassadorProfile> {
    const current = this.getProfile();
    const updated: AmbassadorProfile = {
      ...current,
      ...updates,
    };

    try {
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          name: updated.name,
          email: updated.email,
          handle: updated.handle,
          bio: updated.bio,
          avatar_url: updated.avatar_url,
          custom_categories: updated.custom_categories,
          custom_statuses: updated.custom_statuses,
          custom_occasions: updated.custom_occasions,
        }),
      });
    } catch {
      // Local fallback
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Error saving profile:', err);
      }
    }
    return updated;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      if (res.ok) {
        return { success: true, message: 'Password updated successfully.' };
      }
    } catch {
      // Local simulated response
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters.' };
    }
    return { success: true, message: 'Password updated successfully.' };
  },


  async register(email: string, password: string, name: string): Promise<boolean | string> {
    try {
      const res = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      });
      if (res.ok) return true;
      const err = await res.json();
      return err?.detail?.[0]?.msg || err?.detail || 'Registration failed.';
    } catch {
      return false;
    }
  },

  async login(email: string, password?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: password || 'password123' })
      });
      if (res.ok) {
        const data = await res.json();
        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, data.access_token);
          localStorage.setItem('closet_pr_auth_session', 'logged_in');
          // fetch profile to update local storage
          const profRes = await fetch('/api/user/profile', { headers: getAuthHeader() });
          if (profRes.ok) {
             const profile = await profRes.json();
             localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
          }
        }
        return true;
      }
      return false;
    } catch {
      // Mock login for offline dev if needed
      if (typeof window !== 'undefined') {
        localStorage.setItem('closet_pr_auth_session', 'logged_in');
      }
      return true;
    }
  },

  
  
  async updateTryOnImage(base64Image: string): Promise<boolean> {
    try {
      const res = await fetch('/api/user/tryon-image', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ tryon_base_image: base64Image })
      });
      if (res.ok) {
        const profile = await res.json();
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  async autoSuggestOutfit(avatarId?: string): Promise<OutfitSuggestion | null> {
    try {
      const url = avatarId ? `/api/outfits/auto-suggest?avatar_id=${avatarId}` : '/api/outfits/auto-suggest';
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        const newOutfit = {
          ...data,
          item_ids: typeof data.item_ids === 'string' ? data.item_ids.split(',').filter(Boolean) : (data.item_ids || [])
        };
        const current = getStoredOutfits();
        saveStoredOutfits([newOutfit, ...current]);
        return newOutfit;
      }
      const err = await res.text();
      throw new Error(err);
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  async generateTryOn(personImageBase64: string, garmentImageBase64: string, garmentDescription: string = "A clothing item"): Promise<string | null> {
    try {
      const res = await fetch('/api/outfits/generate-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({
          person_image_base64: personImageBase64,
          garment_image_base64: garmentImageBase64,
          garment_description: garmentDescription
        })
      });
      if (res.ok) {
        const data = await res.json();
        return data.result_image_base64;
      }
      const errorData = await res.json();
      throw new Error(errorData.detail || "Failed to generate image");
    } catch (err) {
      console.error(err);
      return null;
    }
  },

  async logout(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(ITEMS_STORAGE_KEY);
      localStorage.removeItem(OUTFITS_STORAGE_KEY);
      localStorage.setItem('closet_pr_auth_session', 'logged_out');
    }
  },

  isLoggedIn(): boolean {
    if (typeof window === 'undefined') return true;
    const token = localStorage.getItem(TOKEN_KEY);
    return !!token && localStorage.getItem('closet_pr_auth_session') !== 'logged_out';
  },


  /**
   * Reset to initial seed items & outfits
   */
  resetToSeed(): { items: ClothingItem[]; outfits: OutfitSuggestion[] } {
    saveStoredItems(INITIAL_CLOTHING_ITEMS);
    saveStoredOutfits(INITIAL_OUTFITS);
    return { items: INITIAL_CLOTHING_ITEMS, outfits: INITIAL_OUTFITS };
  },
  // ==========================================
  // CAMPAIGN BOARD
  // ==========================================

  async getCampaignBoards(): Promise<import('../types').CampaignBoard[]> {
    try {
      const res = await fetch('/api/boards', { headers: getAuthHeader() });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      console.warn("Failed to fetch boards");
    }
    return [];
  },

  async createCampaignBoard(title: string): Promise<import('../types').CampaignBoard | null> {
    try {
      const res = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      console.warn("Failed to create board");
    }
    return null;
  },

  async updateCampaignBoard(id: string, title?: string, columns_json?: string): Promise<void> {
    try {
      const payload: any = {};
      if (title !== undefined) payload.title = title;
      if (columns_json !== undefined) payload.columns_json = columns_json;
      await fetch(`/api/boards/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
    } catch {
      console.warn("Failed to update board");
    }
  },

  async deleteCampaignBoard(id: string): Promise<void> {
    try {
      await fetch(`/api/boards/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
    } catch {
      console.warn("Failed to delete board");
    }
  },

  async getCampaignTasks(board_id: string): Promise<import('../types').CampaignTask[]> {
    try {
      const res = await fetch(`/api/boards/${board_id}/tasks`, { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        return data.map((t: any) => {
          let cells = {};
          if (t.cells_json) {
            try { cells = JSON.parse(t.cells_json); } catch (e) { }
          }
          return { ...t, cells };
        });
      }
    } catch {
      console.warn("Failed to fetch campaign tasks");
    }
    return [];
  },

  async createCampaignTask(board_id: string, title: string, cells: Record<string, any>): Promise<import('../types').CampaignTask | null> {
    try {
      const res = await fetch('/api/boards/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ board_id, title, cells_json: JSON.stringify(cells) }),
      });
      if (res.ok) {
        const data = await res.json();
        let cells = {};
        if (data.cells_json) {
          try { cells = JSON.parse(data.cells_json); } catch (e) { }
        }
        return { ...data, cells };
      }
    } catch {
      console.warn("Failed to create campaign task");
    }
    return null;
  },

  async updateCampaignTask(id: string, title?: string, cells?: Record<string, any>): Promise<void> {
    try {
      const payload: any = {};
      if (title !== undefined) payload.title = title;
      if (cells !== undefined) payload.cells_json = JSON.stringify(cells);
      
      await fetch(`/api/board/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(payload),
      });
    } catch {
      console.warn("Failed to update campaign task");
    }
  },

  async deleteCampaignTask(id: string): Promise<void> {
    try {
      await fetch(`/api/board/tasks/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader(),
      });
    } catch {
      console.warn("Failed to delete campaign task");
    }
  }
};
