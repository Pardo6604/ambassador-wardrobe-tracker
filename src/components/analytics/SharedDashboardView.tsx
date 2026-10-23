import React, { useState, useEffect } from 'react';
import { SharedDashboardData } from '../../types';
import { apiService } from '../../services/api';
import { KpiWidget, DonutChartWidget, BarChartWidget, MatrixTableWidget } from './charts/ChartWidgets';
import { Shirt, Printer, Shield, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';

interface SharedDashboardViewProps {
  shareToken: string;
  onExit: () => void;
}

export const SharedDashboardView: React.FC<SharedDashboardViewProps> = ({ shareToken, onExit }) => {
  const [data, setData] = useState<SharedDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    apiService.getSharedDashboard(shareToken).then(res => {
      if (!isMounted) return;
      if (res) {
        setData(res);
      } else {
        setError('This shared dashboard link is either invalid, private, or has expired.');
      }
      setLoading(false);
    });
    return () => { isMounted = false; };
  }, [shareToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-neutral-600 font-semibold">Loading live shared lookbook analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-neutral-900 font-['Syne',sans-serif]">
          Dashboard Unavailable
        </h2>
        <p className="text-xs text-neutral-500 max-w-sm mt-1 mb-4">
          {error || 'Unable to access shared dashboard.'}
        </p>
        <button
          onClick={onExit}
          className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
        >
          Return to ClosetPR
        </button>
      </div>
    );
  }

  // Format chart data from shared stats
  const catSlices = Object.entries(data.stats.category_distribution || {}).map(([label, value]) => ({
    label,
    value: value as number,
    color: '',
  }));

  const brandRows = Object.entries(data.stats.brand_distribution || {})
    .map(([label, total]) => ({
      label,
      total: total as number,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const total = data.stats.total_items || 0;
  const unworn = data.stats.unworn_count || 0;
  const worn = data.stats.worn_count || 0;
  const posted = data.stats.posted_count || 0;
  const fulfillment = total > 0 ? Math.round(((worn + posted) / total) * 100) : 100;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-neutral-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Banner */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {data.ambassador_avatar ? (
              <img
                src={data.ambassador_avatar}
                alt={data.ambassador_name}
                className="w-12 h-12 rounded-full object-cover border-2 border-neutral-900"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center font-bold">
                {data.ambassador_name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-neutral-900 font-['Syne',sans-serif]">
                  {data.ambassador_name}
                </h1>
                {data.ambassador_handle && (
                  <span className="text-xs text-neutral-400 font-semibold">{data.ambassador_handle}</span>
                )}
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Verified Ambassador
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                {data.title} · Executive PR & Lookbook Brief
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Brief</span>
            </button>
            <button
              onClick={onExit}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to App</span>
            </button>
          </div>
        </div>

        {/* KPI Scorecards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiWidget
            title="Total Seeded Garments"
            value={total}
            subtitle="PR gifts received"
            trend={`${brandRows.length} brand relationships`}
            trendType="neutral"
          />
          <KpiWidget
            title="Unworn PR Pieces"
            value={unworn}
            subtitle="Awaiting lookbook styling"
            trend={unworn > 0 ? "Pending deliverables" : "All cleared"}
            trendType={unworn > 0 ? "attention" : "positive"}
          />
          <KpiWidget
            title="Styled Lookbook Outfits"
            value={data.outfits_count}
            subtitle="Curated look combinations"
            trend="Active lookbook studio"
            trendType="positive"
          />
          <KpiWidget
            title="PR Fulfillment Rate"
            value={`${fulfillment}%`}
            subtitle="Items worn or posted"
            trend="High reliability"
            trendType="positive"
          />
        </div>

        {/* Charts Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <DonutChartWidget
              title="Garment Category Distribution"
              subtitle="Breakdown of wardrobe categories"
              data={catSlices}
              totalLabel="Garments"
            />
          </div>
          <div className="lg:col-span-7">
            <BarChartWidget
              title="Top Gifting Fashion Houses"
              subtitle="Pieces received by brand partner"
              data={brandRows}
            />
          </div>
        </div>

        {/* Shared Footer Notice */}
        <div className="p-4 rounded-xl bg-neutral-100/70 border border-neutral-200 text-center text-xs text-neutral-500">
          <span>This read-only dashboard was securely generated via ClosetPR for talent representation and PR reporting.</span>
        </div>
      </div>
    </div>
  );
};
