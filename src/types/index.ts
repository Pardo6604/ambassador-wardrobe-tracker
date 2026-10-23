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
  ai_styling_instructions?: string;
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

// ==========================================
// ANALYTICS, REPORTS & DASHBOARDS
// ==========================================

export type ReportType = 'tabular' | 'summary' | 'matrix';
export type DatasetType = 'wardrobe' | 'outfits' | 'campaigns';

export interface ReportConfig {
  title: string;
  report_type: ReportType;
  row_group?: string;
  col_group?: string;
  filters?: Record<string, any>;
  columns?: string[];
  chart_type?: 'none' | 'bar' | 'column' | 'donut' | 'line';
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CustomReport {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  report_type: ReportType;
  dataset: DatasetType;
  config_json: string;
  created_at: string;
  updated_at?: string;
}

export type WidgetType = 'kpi' | 'donut' | 'bar' | 'funnel' | 'matrix_table' | 'table' | 'line';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  metric?: string;
  group_by?: string;
  width?: number; // 1-12 columns
  filters?: Record<string, any>;
}

export interface DashboardConfig {
  title: string;
  widgets: DashboardWidget[];
}

export interface CustomDashboard {
  id: string;
  user_id?: string;
  title: string;
  description?: string;
  is_default?: boolean;
  share_token?: string;
  is_public?: boolean;
  layout_json: string;
  created_at: string;
  updated_at?: string;
}

export interface SharedDashboardData {
  id: string;
  title: string;
  description?: string;
  ambassador_name: string;
  ambassador_handle?: string;
  ambassador_avatar?: string;
  layout_json: string;
  stats: {
    total_items: number;
    unworn_count: number;
    worn_count: number;
    posted_count: number;
    category_distribution: Record<string, number>;
    brand_distribution: Record<string, number>;
  };
  items_count: number;
  outfits_count: number;
  updated_at: string;
}

export interface AIGeneratedAnalyticsResult {
  type: 'report' | 'dashboard';
  title: string;
  description: string;
  config: any;
  summary: string;
}

