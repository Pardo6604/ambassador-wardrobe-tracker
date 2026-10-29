import React, { useState, useEffect } from 'react';
import { ClothingItem, OutfitSuggestion, CustomReport, CustomDashboard, AIGeneratedAnalyticsResult } from '../../types';
import { apiService } from '../../services/api';
import { DashboardView } from './DashboardView';
import { ReportBuilder } from './ReportBuilder';
import { AskAIModal } from './AskAIModal';
import { LayoutDashboard, FileText, Sparkles, Plus, Share2 } from 'lucide-react';

interface AnalyticsHubProps {
  items: ClothingItem[];
  outfits: OutfitSuggestion[];
  allCategories: string[];
  allStatuses: string[];
}

export const AnalyticsHub: React.FC<AnalyticsHubProps> = ({
  items,
  outfits,
  allCategories,
  allStatuses,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'dashboards' | 'reports'>('dashboards');
  const [savedReports, setSavedReports] = useState<CustomReport[]>([]);
  const [savedDashboards, setSavedDashboards] = useState<CustomDashboard[]>([]);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Extract all unique brands from inventory
  const allBrands = React.useMemo(() => {
    return Array.from(new Set(items.map(i => i.brand))).filter(Boolean).sort();
  }, [items]);

  // Load existing reports and dashboards
  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const [reps, dashes] = await Promise.all([
        apiService.getReports(),
        apiService.getDashboards(),
      ]);
      setSavedReports(reps);
      setSavedDashboards(dashes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Handlers for Reports
  const handleSaveReport = async (reportData: { title: string; description?: string; report_type: string; dataset: string; config_json: string }) => {
    const created = await apiService.createReport(reportData);
    if (created) {
      setSavedReports(prev => [created, ...prev.filter(r => r.id !== created.id)]);
      return created;
    }
  };

  const handleDeleteReport = async (id: string) => {
    await apiService.deleteReport(id);
    setSavedReports(prev => prev.filter(r => r.id !== id));
  };

  // Handlers for Dashboards
  const handleSaveDashboard = async (dashData: { title: string; description?: string; is_default?: boolean; layout_json: string }) => {
    const created = await apiService.createDashboard(dashData);
    if (created) {
      setSavedDashboards(prev => [created, ...prev.filter(d => d.id !== created.id)]);
      return created;
    }
  };

  const handleDeleteDashboard = async (id: string) => {
    await apiService.deleteDashboard(id);
    setSavedDashboards(prev => prev.filter(d => d.id !== id));
  };

  const handleToggleShare = async (id: string, is_public?: boolean) => {
    const res = await apiService.toggleDashboardShare(id, is_public);
    if (res) {
      setSavedDashboards(prev => prev.map(d => d.id === id ? { ...d, is_public: res.is_public, share_token: res.share_token } : d));
    }
    return res;
  };

  // Handler for AI Generated result
  const handleApplyAIResult = async (result: AIGeneratedAnalyticsResult) => {
    if (result.type === 'report') {
      setActiveSubTab('reports');
      await handleSaveReport({
        title: result.title,
        description: result.description,
        report_type: result.config.report_type || 'summary',
        dataset: 'wardrobe',
        config_json: JSON.stringify(result.config),
      });
    } else {
      setActiveSubTab('dashboards');
      await handleSaveDashboard({
        title: result.title,
        description: result.description,
        is_default: false,
        layout_json: JSON.stringify(result.config),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Hub Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200/80">
        <div className="flex items-center gap-1.5 p-1 bg-neutral-200/60 rounded-xl w-fit">
          <button
            onClick={() => setActiveSubTab('dashboards')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'dashboards'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-neutral-700" />
            <span>Dashboards</span>
          </button>

          <button
            onClick={() => setActiveSubTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeSubTab === 'reports'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <FileText className="w-4 h-4 text-neutral-700" />
            <span>Reports Library</span>
            {savedReports.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded-full font-bold tabular-nums">
                {savedReports.length}
              </span>
            )}
          </button>
        </div>

        {/* Quick AI Trigger */}
        <button
          onClick={() => setIsAIModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-neutral-900 bg-amber-300 hover:bg-amber-400 rounded-xl transition-all shadow-xs cursor-pointer w-fit"
        >
          <Sparkles className="w-4 h-4 text-neutral-900" />
          <span>✨ Ask AI for Reports & Dashboards</span>
        </button>
      </div>

      {/* Main Sub-view */}
      {activeSubTab === 'dashboards' ? (
        <DashboardView
          items={items}
          outfits={outfits}
          allCategories={allCategories}
          allStatuses={allStatuses}
          allBrands={allBrands}
          savedDashboards={savedDashboards}
          onSaveDashboard={handleSaveDashboard}
          onDeleteDashboard={handleDeleteDashboard}
          onToggleShare={handleToggleShare}
          onOpenAI={() => setIsAIModalOpen(true)}
        />
      ) : (
        <ReportBuilder
          items={items}
          allCategories={allCategories}
          allStatuses={allStatuses}
          allBrands={allBrands}
          savedReports={savedReports}
          onSaveReport={handleSaveReport}
          onDeleteReport={handleDeleteReport}
        />
      )}

      {/* Ask AI Modal */}
      <AskAIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        items={items}
        outfits={outfits}
        onApplyResult={handleApplyAIResult}
      />
    </div>
  );
};
