export type Category = string;

export type ItemStatus = string;

export interface ClothingItem {
  id: string;
  user_id?: string;
  image_url: string;
  category: Category;
  brand: string;
  status?: ItemStatus;
  description?: string;
  created_at: string;
  campaign_tag?: string;
  notes?: string;
  return_deadline?: string;
}

export interface WardrobeStats {
  total: number;
  statusCounts: Record<string, number>;
}

export interface OutfitSuggestion {
  id: string;
  title: string;
  occasion: string; // e.g. "Streetwear Editorial", "VIP Showroom Event", "TikTok GRWM Casual", "Editorial Lookbook"
  status?: string;
  model_image_url: string; // Full-body fit pic of ambassador or styled lookbook model
  item_ids: string[];
  styling_notes?: string;
  created_at: string;
  is_custom_fit_pic?: boolean;
}

export interface AmbassadorProfile {
  id: string;
  name: string;
  email: string;
  handle: string;
  avatar_url: string;
  bio?: string;
  tier?: string;
  member_since?: string;
  default_model_image?: string;
  tryon_base_image?: string;
  custom_categories?: string;
  custom_statuses?: string;
  status_icons_json?: string;
  custom_occasions?: string;
  board_columns_json?: string;
}

export type ColumnType = 'text' | 'url' | 'status' | 'image' | 'outfits' | 'clothing' | 'date';

export interface CampaignColumn {
  id: string;
  name: string;
  type: ColumnType;
  options?: string[]; // For 'status' columns
  width?: number;
}

export interface CampaignBoard {
  id: string;
  title: string;
  columns_json: string;
}

export interface CampaignTask {
  id: string;
  board_id: string;
  title: string;
  cells: Record<string, any>; // Parsed from JSON
  created_at: string;
}
