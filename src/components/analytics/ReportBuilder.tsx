import React, { useState, useMemo } from 'react';
import { ClothingItem, CustomReport, ReportType, ReportConfig } from '../../types';
import { DonutChartWidget, BarChartWidget, MatrixTableWidget } from './charts/ChartWidgets';
import { 
  Download, Printer, Plus, Filter, Save, Layers, Table, Grid, 
  BarChart2, PieChart, ChevronDown, ChevronRight, Search, Check, Sparkles, X, Trash2, Folder 
} from 'lucide-react';

interface ReportBuilderProps {
  items: ClothingItem[];
  allCategories: string[];
  allStatuses: string[];
  allBrands: string[];
  savedReports: CustomReport[];
  onSaveReport: (report: { title: string; description?: string; report_type: string; dataset: string; config_json: string }) => Promise<CustomReport | void>;
  onDeleteReport: (id: string) => Promise<void>;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  items,
  allCategories,
  allStatuses,
  allBrands,
  savedReports,
  onSaveReport,
  onDeleteReport,
}) => {
  // Report Configuration State
  const [reportType, setReportType] = useState<ReportType>('summary');
  const [reportTitle, setReportTitle] = useState('Wardrobe Inventory by Brand');
  const [rowGroup, setRowGroup] = useState<string>('brand');
  const [colGroup, setColGroup] = useState<string>('status');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chartType, setChartType] = useState<'none' | 'bar' | 'donut'>('bar');
  const [activeReportId, setActiveReportId] = useState<string | null>(null);

  // Column visibility for Tabular & Summary detail
  const [visibleCols, setVisibleCols] = useState<{ [key: string]: boolean }>({
    image: true,
    brand: true,
    category: true,
    status: true,
    description: true,
    created_at: true,
  });

  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({});
  const [isSavingModalOpen, setIsSavingModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Report State
  const [confirmDeleteReport, setConfirmDeleteReport] = useState(false);
  const [isDeletingReport, setIsDeletingReport] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [isDeletingSpecificReport, setIsDeletingSpecificReport] = useState(false);

  const handleDeleteActiveReport = async () => {
    if (!activeReportId) return;
    setIsDeletingReport(true);
    try {
      await onDeleteReport(activeReportId);
      setActiveReportId(null);
      setReportTitle('Wardrobe Inventory by Brand');
      setConfirmDeleteReport(false);
    } catch (err) {
      console.error('Failed to delete report', err);
    } finally {
      setIsDeletingReport(false);
    }
  };

  // Filter items based on active controls
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      if (selectedStatus !== 'All' && item.status !== selectedStatus) return false;
      if (selectedBrand !== 'All' && item.brand !== selectedBrand) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const text = `${item.brand} ${item.category} ${item.status || ''} ${item.description || ''}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [items, selectedCategory, selectedStatus, selectedBrand, searchQuery]);

  // Summary Groupings
  const groupedData = useMemo(() => {
    const groups: { [key: string]: ClothingItem[] } = {};
    filteredItems.forEach(item => {
      const key = (rowGroup === 'brand' ? item.brand : rowGroup === 'category' ? item.category : (item.status || 'Unworn')) || 'Uncategorized';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredItems, rowGroup]);

  // Matrix Groupings (2D)
  const matrixData = useMemo(() => {
    const rowsSet = new Set<string>();
    const colsSet = new Set<string>();
    const cellMap: { [key: string]: number } = {};

    filteredItems.forEach(item => {
      const r = (rowGroup === 'brand' ? item.brand : rowGroup === 'category' ? item.category : (item.status || 'Unworn')) || 'Other';
      const c = (colGroup === 'status' ? (item.status || 'Unworn') : colGroup === 'category' ? item.category : item.brand) || 'Other';
      rowsSet.add(r);
      colsSet.add(c);
      const key = `${r}:::${c}`;
      cellMap[key] = (cellMap[key] || 0) + 1;
    });

    const rows = Array.from(rowsSet).sort();
    const cols = Array.from(colsSet).sort();
    const cells = Object.entries(cellMap).map(([key, count]) => {
      const [row, col] = key.split(':::');
      return { row, col, count };
    });

    return { rows, cols, cells };
  }, [filteredItems, rowGroup, colGroup]);

  // Chart data from current filtered items
  const chartSlices = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredItems.forEach(item => {
      const key = rowGroup === 'brand' ? item.brand : rowGroup === 'category' ? item.category : (item.status || 'Unworn');
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value, color: '' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredItems, rowGroup]);

  const barRows = useMemo(() => {
    const counts: { [key: string]: { total: number; unworn: number; worn: number; posted: number } } = {};
    filteredItems.forEach(item => {
      const key = rowGroup === 'brand' ? item.brand : rowGroup === 'category' ? item.category : (item.status || 'Unworn');
      if (!counts[key]) counts[key] = { total: 0, unworn: 0, worn: 0, posted: 0 };
      counts[key].total += 1;
      const s = (item.status || 'Unworn').toLowerCase();
      if (s.includes('unworn')) counts[key].unworn += 1;
      else if (s.includes('posted')) counts[key].posted += 1;
      else counts[key].worn += 1;
    });

    return Object.entries(counts)
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
  }, [filteredItems, rowGroup]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // CSV Export Functionality
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,Brand,Category,Status,Description,Date Added\n';

    filteredItems.forEach(item => {
      const row = [
        `"${item.id}"`,
        `"${item.brand.replace(/"/g, '""')}"`,
        `"${item.category.replace(/"/g, '""')}"`,
        `"${(item.status || 'Unworn').replace(/"/g, '""')}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        `"${new Date(item.created_at).toLocaleDateString()}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `${reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Browser Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // Save Report Handler
  const handleSaveModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) return;
    setIsSubmitting(true);
    try {
      const config: ReportConfig = {
        title: saveTitle.trim(),
        report_type: reportType,
        row_group: rowGroup,
        col_group: colGroup,
        filters: {
          category: selectedCategory,
          status: selectedStatus,
          brand: selectedBrand,
        },
        chart_type: chartType,
        columns: Object.keys(visibleCols).filter(k => visibleCols[k]),
      };

      const created = await onSaveReport({
        title: saveTitle.trim(),
        description: saveDescription.trim() || undefined,
        report_type: reportType,
        dataset: 'wardrobe',
        config_json: JSON.stringify(config),
      });

      if (created && created.id) {
        setActiveReportId(created.id);
      }
      setReportTitle(saveTitle.trim());
      setIsSavingModalOpen(false);
      setSaveTitle('');
      setSaveDescription('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadSavedReport = (report: CustomReport) => {
    try {
      const config: ReportConfig = JSON.parse(report.config_json);
      setActiveReportId(report.id);
      setReportTitle(report.title);
      if (config.row_group) setRowGroup(config.row_group);
      if (config.col_group) setColGroup(config.col_group);
      if (config.chart_type === 'bar' || config.chart_type === 'donut' || config.chart_type === 'none') {
        setChartType(config.chart_type);
      } else if (config.chart_type) {
        setChartType('bar');
      }
      if (config.filters) {
        if (config.filters.category) setSelectedCategory(config.filters.category);
        if (config.filters.status) setSelectedStatus(config.filters.status);
        if (config.filters.brand) setSelectedBrand(config.filters.brand);
      }
    } catch {
      console.warn("Could not parse saved report config");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar: Title, Saved Reports Selector & Export Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-neutral-900 font-['Syne',sans-serif]">
              {reportTitle}
            </h2>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
              {reportType} format
            </span>
          </div>
          <p className="text-xs text-neutral-500 mt-0.5">
            Displaying {filteredItems.length} of {items.length} total wardrobe items based on active criteria
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Saved Reports Manager Button */}
          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            title="View and delete saved reports"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Saved Reports</span>
            {savedReports.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-neutral-200 text-neutral-800 rounded-full font-bold tabular-nums">
                {savedReports.length}
              </span>
            )}
          </button>

          {/* Saved Reports Menu */}
          {savedReports.length > 0 && (
            <select
              value={activeReportId || ''}
              onChange={(e) => {
                setConfirmDeleteReport(false);
                const val = e.target.value;
                if (!val) {
                  setActiveReportId(null);
                } else {
                  const found = savedReports.find(r => r.id === val);
                  if (found) loadSavedReport(found);
                }
              }}
              className="text-xs font-semibold bg-neutral-50 border border-neutral-200 text-neutral-700 px-3 py-2 rounded-lg focus:outline-none cursor-pointer"
            >
              <option value="">Load Saved Report...</option>
              {savedReports.map(r => (
                <option key={r.id} value={r.id}>{r.title} ({r.report_type})</option>
              ))}
            </select>
          )}

          {/* Delete Saved Report Button */}
          {activeReportId && (
            confirmDeleteReport ? (
              <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={handleDeleteActiveReport}
                  disabled={isDeletingReport}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer"
                  title="Confirm deletion"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingReport ? 'Deleting...' : 'Confirm'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteReport(false)}
                  disabled={isDeletingReport}
                  className="px-2 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-800 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDeleteReport(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 rounded-lg transition-colors cursor-pointer"
                title="Delete this saved report"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete</span>
              </button>
            )
          )}

          <button
            onClick={() => {
              setSaveTitle(reportTitle);
              setIsSavingModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            title="Download CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer shadow-xs"
            title="Print or export as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Salesforce Controls Panel: Format, Groupings, Filters, Chart */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Format Switcher */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Report Format
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-lg">
              <button
                type="button"
                onClick={() => setReportType('tabular')}
                className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  reportType === 'tabular' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Table className="w-3 h-3" />
                <span>Tabular</span>
              </button>
              <button
                type="button"
                onClick={() => setReportType('summary')}
                className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  reportType === 'summary' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Summary</span>
              </button>
              <button
                type="button"
                onClick={() => setReportType('matrix')}
                className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  reportType === 'matrix' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Grid className="w-3 h-3" />
                <span>Matrix</span>
              </button>
            </div>
          </div>

          {/* Group Rows By (Summary & Matrix) */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Group Rows By
            </label>
            <select
              value={rowGroup}
              onChange={(e) => setRowGroup(e.target.value)}
              disabled={reportType === 'tabular'}
              className="w-full text-xs font-semibold bg-white border border-neutral-200 text-neutral-900 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:opacity-40 cursor-pointer"
            >
              <option value="brand">Brand</option>
              <option value="category">Category</option>
              <option value="status">Item Status</option>
            </select>
          </div>

          {/* Group Columns By (Matrix Only) */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Group Columns By (Matrix)
            </label>
            <select
              value={colGroup}
              onChange={(e) => setColGroup(e.target.value)}
              disabled={reportType !== 'matrix'}
              className="w-full text-xs font-semibold bg-white border border-neutral-200 text-neutral-900 p-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900 disabled:opacity-40 cursor-pointer"
            >
              <option value="status">Item Status</option>
              <option value="category">Category</option>
              <option value="brand">Brand</option>
            </select>
          </div>

          {/* Inline Chart Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-1.5">
              Inline Chart Visualization
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-neutral-100 rounded-lg">
              <button
                type="button"
                onClick={() => setChartType('none')}
                className={`py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  chartType === 'none' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                None
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  chartType === 'bar' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <BarChart2 className="w-3 h-3" />
                <span>Bar</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('donut')}
                className={`flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  chartType === 'donut' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <PieChart className="w-3 h-3" />
                <span>Donut</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 text-xs font-bold text-neutral-500 uppercase tracking-wider">
            <Filter className="w-3 h-3" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 text-neutral-700 px-2.5 py-1.5 rounded-lg cursor-pointer"
          >
            <option value="All">All Categories</option>
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 text-neutral-700 px-2.5 py-1.5 rounded-lg cursor-pointer"
          >
            <option value="All">All Statuses</option>
            {allStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="text-xs bg-neutral-50 border border-neutral-200 text-neutral-700 px-2.5 py-1.5 rounded-lg cursor-pointer"
          >
            <option value="All">All Brands</option>
            {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          {/* Search Query */}
          <div className="relative ml-auto w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter text..."
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          {(selectedCategory !== 'All' || selectedStatus !== 'All' || selectedBrand !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSelectedBrand('All');
                setSearchQuery('');
              }}
              className="text-[11px] text-neutral-400 hover:text-neutral-700 underline cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* 3. Inline Chart Visualization (if enabled) */}
      {chartType !== 'none' && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartType === 'bar' && (
            <div className="md:col-span-2">
              <BarChartWidget
                title={`${rowGroup.toUpperCase()} Distribution & Status Ratios`}
                subtitle={`Top volume breakdown across ${filteredItems.length} filtered items`}
                data={barRows}
              />
            </div>
          )}
          {chartType === 'donut' && (
            <div className="md:col-span-2">
              <DonutChartWidget
                title={`${rowGroup.toUpperCase()} Share`}
                subtitle="Volume allocation by category/brand"
                data={chartSlices}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. Report Data Presentation */}
      {reportType === 'matrix' ? (
        <MatrixTableWidget
          title={`${rowGroup.toUpperCase()} by ${colGroup.toUpperCase()} Matrix`}
          subtitle={`Two-dimensional cross-tabulation table with calculated margin totals`}
          rowHeader={rowGroup.toUpperCase()}
          colHeader={colGroup.toUpperCase()}
          rows={matrixData.rows}
          cols={matrixData.cols}
          cells={matrixData.cells}
        />
      ) : reportType === 'summary' ? (
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900 font-['Syne',sans-serif]">
              Summary Grouped by {rowGroup.toUpperCase()} ({Object.keys(groupedData).length} Groups)
            </h3>
            <span className="text-xs text-neutral-500">
              Click any group to expand or collapse items
            </span>
          </div>

          <div className="divide-y divide-neutral-100">
            {Object.keys(groupedData).length === 0 ? (
              <p className="text-xs text-neutral-400 text-center py-8">No records match the active criteria.</p>
            ) : (
              Object.entries(groupedData).map(([groupName, groupItems]) => {
                const isExpanded = expandedGroups[groupName] ?? true;
                const pct = Math.round((groupItems.length / filteredItems.length) * 100);
                const unwornCount = groupItems.filter(i => (i.status || 'Unworn').toLowerCase() === 'unworn').length;

                return (
                  <div key={groupName} className="transition-colors">
                    {/* Group Header Row */}
                    <div
                      onClick={() => toggleGroup(groupName)}
                      className="px-4 py-3 bg-neutral-50/70 hover:bg-neutral-100/70 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-neutral-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-neutral-500" />
                        )}
                        <span className="text-xs font-bold text-neutral-900">{groupName}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-neutral-200 font-semibold text-neutral-700">
                          {groupItems.length} items ({pct}%)
                        </span>
                        {unwornCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                            {unwornCount} unworn
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Group Rows Table */}
                    {isExpanded && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-white text-[10px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
                            <tr>
                              <th className="py-2 px-4 w-12">Piece</th>
                              <th className="py-2 px-4">Brand</th>
                              <th className="py-2 px-4">Category</th>
                              <th className="py-2 px-4">Status</th>
                              <th className="py-2 px-4">Description</th>
                              <th className="py-2 px-4 text-right">Added</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {groupItems.map(item => (
                              <tr key={item.id} className="hover:bg-neutral-50/60 transition-colors">
                                <td className="py-2 px-4">
                                  <img
                                    src={item.image_url}
                                    alt={item.brand}
                                    className="w-8 h-8 rounded-md object-cover border border-neutral-200 bg-neutral-50"
                                  />
                                </td>
                                <td className="py-2 px-4 font-semibold text-neutral-900">{item.brand}</td>
                                <td className="py-2 px-4 text-neutral-700">{item.category}</td>
                                <td className="py-2 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                                    (item.status || 'Unworn').toLowerCase() === 'unworn'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-neutral-100 text-neutral-700'
                                  }`}>
                                    {item.status || 'Unworn'}
                                  </span>
                                </td>
                                <td className="py-2 px-4 text-neutral-500 max-w-xs truncate">
                                  {item.description || '—'}
                                </td>
                                <td className="py-2 px-4 text-right text-neutral-400 tabular-nums">
                                  {new Date(item.created_at).toLocaleDateString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Tabular Format */
        <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-12">Piece</th>
                  <th className="py-3 px-4">Brand</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Added Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-neutral-800">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-neutral-400">
                      No records match the active criteria.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-2.5 px-4">
                        <img
                          src={item.image_url}
                          alt={item.brand}
                          className="w-9 h-9 rounded-md object-cover border border-neutral-200 bg-neutral-50"
                        />
                      </td>
                      <td className="py-2.5 px-4 font-bold text-neutral-900">{item.brand}</td>
                      <td className="py-2.5 px-4 text-neutral-700">{item.category}</td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          (item.status || 'Unworn').toLowerCase() === 'unworn'
                            ? 'bg-amber-100 text-amber-800'
                            : (item.status || '').toLowerCase() === 'posted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {item.status || 'Unworn'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-neutral-600 max-w-sm truncate">
                        {item.description || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-right text-neutral-500 tabular-nums">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Save Report Modal */}
      {isSavingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-neutral-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 font-['Syne',sans-serif]">
                Save Custom Report
              </h3>
              <button
                onClick={() => setIsSavingModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Report Title
                </label>
                <input
                  type="text"
                  required
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="e.g. Unworn PR Pieces by Brand"
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Summary of this report's business intent..."
                  className="w-full px-3 py-2 text-xs bg-white border border-neutral-200 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSavingModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !saveTitle.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save to Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Saved Reports Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg border border-neutral-200 shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-neutral-900" />
                <h3 className="font-bold text-neutral-900 text-base font-['Syne',sans-serif]">
                  Saved Reports Library
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsManageModalOpen(false);
                  setDeletingReportId(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Load or permanently delete any custom report from your wardrobe intelligence library.
            </p>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {savedReports.length === 0 ? (
                <div className="p-8 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-200">
                  <p className="text-xs font-semibold text-neutral-600 mb-1">No saved reports in library yet</p>
                  <p className="text-[11px] text-neutral-400">
                    Configure your report format and click "Save Report" above or use "✨ Ask AI" to generate reports.
                  </p>
                </div>
              ) : (
                savedReports.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 bg-neutral-50/80 hover:bg-neutral-50 border border-neutral-200/80 rounded-xl flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-900 truncate">
                          {rep.title}
                        </span>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-700 shrink-0">
                          {rep.report_type}
                        </span>
                        {rep.id === activeReportId && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Saved {new Date(rep.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          loadSavedReport(rep);
                          setIsManageModalOpen(false);
                          setDeletingReportId(null);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-md transition-colors cursor-pointer"
                      >
                        Load
                      </button>

                      {deletingReportId === rep.id ? (
                        <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-md p-0.5">
                          <button
                            type="button"
                            disabled={isDeletingSpecificReport}
                            onClick={async () => {
                              setIsDeletingSpecificReport(true);
                              try {
                                await onDeleteReport(rep.id);
                                if (activeReportId === rep.id) {
                                  setActiveReportId(null);
                                  setReportTitle('Wardrobe Inventory by Brand');
                                }
                                setDeletingReportId(null);
                              } finally {
                                setIsDeletingSpecificReport(false);
                              }
                            }}
                            className="px-2 py-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded transition-colors cursor-pointer"
                          >
                            {isDeletingSpecificReport ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingReportId(null)}
                            disabled={isDeletingSpecificReport}
                            className="px-1.5 py-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-800 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeletingReportId(rep.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title="Delete this report"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsManageModalOpen(false);
                  setDeletingReportId(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
