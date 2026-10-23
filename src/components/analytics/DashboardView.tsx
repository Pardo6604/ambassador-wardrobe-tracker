import React, { useState, useMemo } from 'react';
import { ClothingItem, OutfitSuggestion, CustomDashboard, DashboardWidget } from '../../types';
import { KpiWidget, DonutChartWidget, BarChartWidget, FunnelWidget, MatrixTableWidget } from './charts/ChartWidgets';
import { 
  Share2, Printer, Download, Filter, Plus, Check, Copy, 
  Sparkles, Layers, SlidersHorizontal, ExternalLink, X, Shield 
} from 'lucide-react';

interface DashboardViewProps {
  items: ClothingItem[];
  outfits: OutfitSuggestion[];
  allCategories: string[];
  allStatuses: string[];
  allBrands: string[];
  savedDashboards: CustomDashboard[];
  onSaveDashboard: (dash: { title: string; description?: string; is_default?: boolean; layout_json: string }) => Promise<void>;
  onDeleteDashboard: (id: string) => Promise<void>;
  onToggleShare: (id: string, is_public?: boolean) => Promise<{ is_public: boolean; share_token: string } | null>;
  onOpenAI: () => void;
}

export type DashboardTemplateId = 'category_breakdown' | 'pipeline' | 'brand_finance';

export const DashboardView: React.FC<DashboardViewProps> = ({
  items,
  outfits,
  allCategories,
  allStatuses,
  allBrands,
  savedDashboards,
  onSaveDashboard,
  onDeleteDashboard,
  onToggleShare,
  onOpenAI,
}) => {
  // Active template or custom dashboard
  const [activeTemplate, setActiveTemplate] = useState<string>('category_breakdown');

  // Global Dashboard Filters
  const [globalBrand, setGlobalBrand] = useState<string>('All');
  const [globalCategory, setGlobalCategory] = useState<string>('All');
  const [globalStatus, setGlobalStatus] = useState<string>('All');

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isPublicShared, setIsPublicShared] = useState(false);
  const [shareToken, setShareToken] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSharingLoading, setIsSharingLoading] = useState(false);

  // Filtered dataset according to global dashboard filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (globalBrand !== 'All' && item.brand !== globalBrand) return false;
      if (globalCategory !== 'All' && item.category !== globalCategory) return false;
      if (globalStatus !== 'All' && item.status !== globalStatus) return false;
      return true;
    });
  }, [items, globalBrand, globalCategory, globalStatus]);

  // General Wardrobe Aggregations
  const totalItems = filteredItems.length;
  const unwornItems = filteredItems.filter(i => (i.status || 'Unworn').toLowerCase() === 'unworn').length;
  const wornItems = filteredItems.filter(i => (i.status || '').toLowerCase() === 'worn').length;
  const postedItems = filteredItems.filter(i => (i.status || '').toLowerCase() === 'posted').length;
  const uniqueBrands = Array.from(new Set(filteredItems.map(i => i.brand))).filter(Boolean);
  const unwornPct = totalItems > 0 ? Math.round((unwornItems / totalItems) * 100) : 0;
  const fulfillmentPct = totalItems > 0 ? Math.round(((wornItems + postedItems) / totalItems) * 100) : 100;

  // Category Distribution (for Donut)
  const categorySlices = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredItems.forEach(i => {
      counts[i.category] = (counts[i.category] || 0) + 1;
    });
    const palette = ['#18181B', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'];
    return Object.entries(counts)
      .map(([label, value], i) => ({
        label,
        value,
        color: palette[i % palette.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredItems]);

  // Brand Distribution with Status Segments (for Bar Chart)
  const brandBarRows = useMemo(() => {
    const brandMap: { [key: string]: { total: number; unworn: number; worn: number; posted: number } } = {};
    filteredItems.forEach(i => {
      if (!brandMap[i.brand]) {
        brandMap[i.brand] = { total: 0, unworn: 0, worn: 0, posted: 0 };
      }
      brandMap[i.brand].total += 1;
      const s = (i.status || 'Unworn').toLowerCase();
      if (s.includes('unworn')) brandMap[i.brand].unworn += 1;
      else if (s.includes('posted')) brandMap[i.brand].posted += 1;
      else brandMap[i.brand].worn += 1;
    });

    return Object.entries(brandMap)
      .map(([label, stats]) => ({
        label,
        total: stats.total,
        segments: [
          { label: 'Unworn', count: stats.unworn, color: '#F59E0B' },
          { label: 'Worn', count: stats.worn, color: '#18181B' },
          { label: 'Posted', count: stats.posted, color: '#10B981' },
        ].filter(s => s.count > 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  }, [filteredItems]);

  // Category vs Status Matrix
  const categoryMatrix = useMemo(() => {
    const rows = allCategories.length > 0 ? allCategories : Array.from(new Set(filteredItems.map(i => i.category)));
    const cols = ['Unworn', 'Worn', 'Posted'];
    const cellMap: { [key: string]: number } = {};

    filteredItems.forEach(item => {
      const r = item.category || 'Other';
      const s = (item.status || 'Unworn');
      const c = s.toLowerCase().includes('unworn') ? 'Unworn' : s.toLowerCase().includes('posted') ? 'Posted' : 'Worn';
      const key = `${r}:::${c}`;
      cellMap[key] = (cellMap[key] || 0) + 1;
    });

    const cells = Object.entries(cellMap).map(([key, count]) => {
      const [row, col] = key.split(':::');
      return { row, col, count };
    });

    return { rows, cols, cells };
  }, [filteredItems, allCategories]);

  // Pipeline Funnel Stages
  const pipelineStages = useMemo(() => {
    const fitPicsLogged = outfits.filter(o => o.is_custom_fit_pic).length;
    return [
      { label: 'Seeded PR Received', count: totalItems, description: 'All inventory gifted from fashion houses', color: '#18181B' },
      { label: 'Styled into Outfits', count: outfits.length, description: 'Pieces coordinated into studio looks', color: '#6366F1' },
      { label: 'Fit Pics Captured', count: fitPicsLogged, description: 'Actual ambassador wearing photos', color: '#F59E0B' },
      { label: 'Campaigns Delivered', count: postedItems, description: 'Items fully published and fulfilled', color: '#10B981' },
    ];
  }, [totalItems, outfits, postedItems]);

  // Active dashboard title
  const currentTitle = useMemo(() => {
    if (activeTemplate === 'category_breakdown') return 'Wardrobe Category Breakdown & Health';
    if (activeTemplate === 'pipeline') return 'Brand Campaign & Deliverable Pipeline';
    if (activeTemplate === 'brand_finance') return 'Fashion House Partnerships & Gifting Volume';
    const custom = savedDashboards.find(d => d.id === activeTemplate);
    return custom ? custom.title : 'Custom Analytics Dashboard';
  }, [activeTemplate, savedDashboards]);

  // Open Share Modal
  const handleOpenShare = async () => {
    setIsShareModalOpen(true);
    // Find active custom dashboard or create a shared snapshot
    const custom = savedDashboards.find(d => d.id === activeTemplate);
    if (custom) {
      setIsPublicShared(Boolean(custom.is_public));
      setShareToken(custom.share_token || '');
    } else {
      // Default template: create or find persistent dashboard representation
      const found = savedDashboards.find(d => d.title === currentTitle);
      if (found) {
        setIsPublicShared(Boolean(found.is_public));
        setShareToken(found.share_token || '');
      } else {
        // Create one on the fly so it can have a permanent share token
        setIsSharingLoading(true);
        try {
          const created = await onSaveDashboard({
            title: currentTitle,
            description: 'Automated executive dashboard template',
            is_default: false,
            layout_json: JSON.stringify({ template: activeTemplate }),
          });
          const fresh = savedDashboards.find(d => d.title === currentTitle);
          if (fresh) {
            setIsPublicShared(Boolean(fresh.is_public));
            setShareToken(fresh.share_token || '');
          }
        } finally {
          setIsSharingLoading(false);
        }
      }
    }
  };

  // Toggle Share Status
  const handleTogglePublic = async () => {
    const custom = savedDashboards.find(d => d.id === activeTemplate) || savedDashboards.find(d => d.title === currentTitle);
    if (!custom) return;
    setIsSharingLoading(true);
    try {
      const res = await onToggleShare(custom.id, !isPublicShared);
      if (res) {
        setIsPublicShared(res.is_public);
        setShareToken(res.share_token);
      }
    } finally {
      setIsSharingLoading(false);
    }
  };

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?shared_dashboard=${shareToken}`
    : `/?shared_dashboard=${shareToken}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Dashboard Header & Template Switcher */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-900 font-['Syne',sans-serif]">
              {currentTitle}
            </h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              Live Analytics
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time KPIs, status velocity, and inventory allocation across your wardrobe
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Template Selector Dropdown */}
          <select
            value={activeTemplate}
            onChange={(e) => setActiveTemplate(e.target.value)}
            className="text-xs font-semibold bg-neutral-50 border border-neutral-200 text-neutral-800 px-3 py-2 rounded-lg focus:outline-none cursor-pointer"
          >
            <optgroup label="Standard Templates">
              <option value="category_breakdown">🌟 Wardrobe Category Breakdown</option>
              <option value="pipeline">🚀 Deliverables & Campaign Pipeline</option>
              <option value="brand_finance">💼 Brand Gifting & Volume</option>
            </optgroup>
            {savedDashboards.length > 0 && (
              <optgroup label="Custom Dashboards">
                {savedDashboards.map(d => (
                  <option key={d.id} value={d.id}>📊 {d.title}</option>
                ))}
              </optgroup>
            )}
          </select>

          {/* Ask AI Button */}
          <button
            onClick={onOpenAI}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-900 bg-amber-300 hover:bg-amber-400 rounded-lg transition-all cursor-pointer shadow-2xs"
            title="Ask AI to construct a new report or dashboard"
          >
            <Sparkles className="w-3.5 h-3.5 text-neutral-900" />
            <span>✨ Ask AI</span>
          </button>

          {/* Shareable Link Button */}
          <button
            onClick={handleOpenShare}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            title="Share a private or public read-only link with talent manager or brand partner"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Link</span>
          </button>

          {/* Print / PDF Button */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Print or export dashboard as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Global Dashboard Filters Bar (Salesforce-Style) */}
      <div className="bg-neutral-50/80 rounded-xl p-3 border border-neutral-200/80 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-neutral-600 uppercase tracking-wider text-[11px]">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Global Filter:</span>
        </div>

        {/* Brand Dropdown */}
        <select
          value={globalBrand}
          onChange={(e) => setGlobalBrand(e.target.value)}
          className="bg-white border border-neutral-200 text-neutral-800 px-2.5 py-1.5 rounded-lg cursor-pointer"
        >
          <option value="All">All Brands ({uniqueBrands.length})</option>
          {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
        </select>

        {/* Category Dropdown */}
        <select
          value={globalCategory}
          onChange={(e) => setGlobalCategory(e.target.value)}
          className="bg-white border border-neutral-200 text-neutral-800 px-2.5 py-1.5 rounded-lg cursor-pointer"
        >
          <option value="All">All Categories ({allCategories.length})</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Status Dropdown */}
        <select
          value={globalStatus}
          onChange={(e) => setGlobalStatus(e.target.value)}
          className="bg-white border border-neutral-200 text-neutral-800 px-2.5 py-1.5 rounded-lg cursor-pointer"
        >
          <option value="All">All Statuses</option>
          {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {(globalBrand !== 'All' || globalCategory !== 'All' || globalStatus !== 'All') && (
          <button
            onClick={() => {
              setGlobalBrand('All');
              setGlobalCategory('All');
              setGlobalStatus('All');
            }}
            className="text-[11px] text-neutral-500 hover:text-neutral-900 underline cursor-pointer ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* 3. Top KPI Scorecards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiWidget
          title="Total Wardrobe Inventory"
          value={totalItems}
          subtitle="Seeded pieces in tracker"
          trend={`${uniqueBrands.length} partner brands`}
          trendType="neutral"
        />
        <KpiWidget
          title="Unworn PR Backlog"
          value={unwornItems}
          subtitle={`${unwornPct}% of total garments`}
          trend={unwornItems > 5 ? "Needs styling" : "On schedule"}
          trendType={unwornItems > 5 ? "attention" : "positive"}
        />
        <KpiWidget
          title="Lookbook Outfits"
          value={outfits.length}
          subtitle="Curated styled combinations"
          trend={`${outfits.filter(o => o.is_custom_fit_pic).length} with fit pics`}
          trendType="positive"
        />
        <KpiWidget
          title="Fulfillment Velocity"
          value={`${fulfillmentPct}%`}
          subtitle="Garments worn or posted"
          trend="PR delivery health"
          trendType="positive"
        />
      </div>

      {/* 4. Template-Specific Main Canvas */}
      {activeTemplate === 'pipeline' ? (
        /* Deliverable Funnel View */
        <div className="space-y-6">
          <FunnelWidget
            title="Seeded PR Deliverable Pipeline"
            subtitle="Tracking garments from arrival to lookbook styling and campaign fulfillment"
            stages={pipelineStages}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <BarChartWidget
                title="Top Partner Brands by Deliverable Volume"
                subtitle="Volume of gifted garments and status breakdown per brand"
                data={brandBarRows}
              />
            </div>
            <div className="lg:col-span-4">
              <DonutChartWidget
                title="Status Fulfillment Ratio"
                subtitle="Overall completion proportion"
                data={[
                  { label: 'Unworn', value: unwornItems, color: '#F59E0B' },
                  { label: 'Worn', value: wornItems, color: '#18181B' },
                  { label: 'Posted', value: postedItems, color: '#10B981' },
                ]}
              />
            </div>
          </div>
        </div>
      ) : activeTemplate === 'brand_finance' ? (
        /* Brand Volume & Finance View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <BarChartWidget
                title="Fashion House Volume & Gifting Index"
                subtitle="Top brands sorted by number of seeded pieces received"
                data={brandBarRows}
              />
            </div>
            <div className="lg:col-span-4">
              <DonutChartWidget
                title="Category Allocation"
                subtitle="Distribution of incoming gifts"
                data={categorySlices}
              />
            </div>
          </div>

          <MatrixTableWidget
            title="Category vs Status Distribution Matrix"
            subtitle="Cross-tabulation of garment categories against wear/fulfillment states"
            rowHeader="CATEGORY"
            colHeader="STATUS"
            rows={categoryMatrix.rows}
            cols={categoryMatrix.cols}
            cells={categoryMatrix.cells}
          />
        </div>
      ) : (
        /* Default: Wardrobe Category Breakdown & Utilization */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5">
              <DonutChartWidget
                title="Garment Category Breakdown"
                subtitle="Proportion of Tops, Bottoms, Outerwear, Footwear & Accessories"
                data={categorySlices}
                totalLabel="Pieces"
              />
            </div>
            <div className="lg:col-span-7">
              <BarChartWidget
                title="Brand Partner Allocation & Status"
                subtitle="Top fashion brands and current wear status splits"
                data={brandBarRows}
              />
            </div>
          </div>

          <MatrixTableWidget
            title="Wardrobe Category Health Matrix"
            subtitle="Two-dimensional breakdown showing count of unworn, worn, and posted items per category"
            rowHeader="CATEGORY"
            colHeader="STATUS"
            rows={categoryMatrix.rows}
            cols={categoryMatrix.cols}
            cells={categoryMatrix.cells}
          />
        </div>
      )}

      {/* Shareable Link Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-neutral-200 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-neutral-900 text-white">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 font-['Syne',sans-serif]">
                    Share Dashboard
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Generate a live read-only link for talent managers or PR agency reps
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-900">Public Link Sharing</span>
                  <p className="text-[11px] text-neutral-500">
                    {isPublicShared
                      ? 'Anyone with the link can view real-time charts without signing in'
                      : 'Link is currently private and inactive'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePublic}
                  disabled={isSharingLoading}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                    isPublicShared ? 'bg-neutral-900' : 'bg-neutral-300'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isPublicShared ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {isPublicShared && shareToken && (
                <div className="pt-3 border-t border-neutral-200 space-y-2">
                  <label className="block text-[11px] font-semibold text-neutral-600">
                    Shareable URL
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-700 font-mono focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                    <Shield className="w-3 h-3" />
                    <span>Viewers cannot edit, delete, or access your account credentials.</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 hover:text-neutral-900"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
