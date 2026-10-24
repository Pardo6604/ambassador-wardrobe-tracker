import React from 'react';
import { Sparkles, TrendingUp, ArrowUpRight, Shirt, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

// ==========================================
// 1. KPI SCORECARD WIDGET
// ==========================================
interface KpiWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: 'positive' | 'neutral' | 'attention';
  icon?: React.ReactNode;
}

export const KpiWidget: React.FC<KpiWidgetProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendType = 'neutral',
  icon,
}) => {
  const trendBg =
    trendType === 'positive'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : trendType === 'attention'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : 'bg-neutral-100 text-neutral-600 border-neutral-200';

  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-neutral-500 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
        {icon && <div className="p-1.5 rounded-lg bg-neutral-100 text-neutral-700">{icon}</div>}
      </div>
      <div>
        <div
          className="text-3xl sm:text-4xl font-bold text-neutral-900 kpi-number leading-tight py-0.5"
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
            fontVariantNumeric: 'normal',
            fontStretch: '100%',
            letterSpacing: '-0.02em',
          }}
        >
          {value}
        </div>
        <div className="flex items-center gap-2 mt-2">
          {trend && (
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${trendBg}`}>
              {trend}
            </span>
          )}
          {subtitle && <span className="text-xs text-neutral-500">{subtitle}</span>}
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 2. DONUT CHART WIDGET (Native SVG)
// ==========================================
interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title: string;
  subtitle?: string;
  data: DonutSlice[];
  totalLabel?: string;
}

const PALETTE = ['#18181B', '#E11D48', '#F59E0B', '#10B981', '#6366F1', '#EC4899', '#8B5CF6', '#14B8A6'];

export const DonutChartWidget: React.FC<DonutChartProps> = ({
  title,
  subtitle,
  data,
  totalLabel = 'Total',
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  // Calculate SVG arc paths
  let accumulatedAngle = 0;
  const radius = 64;
  const strokeWidth = 24;
  const center = 80;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-neutral-900 font-['Syne',sans-serif]">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
        {/* SVG Donut */}
        <div className="relative w-40 h-40 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {total === 0 ? (
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#E5E7EB"
                strokeWidth={strokeWidth}
              />
            ) : (
              data.map((slice, i) => {
                if (slice.value === 0) return null;
                const strokeDasharray = `${(slice.value / total) * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedAngle;
                accumulatedAngle += (slice.value / total) * circumference;

                return (
                  <circle
                    key={slice.label}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={slice.color || PALETTE[i % PALETTE.length]}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-500 hover:opacity-85"
                  />
                );
              })
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span
              className="text-3xl font-bold text-neutral-900 kpi-number leading-none"
              style={{
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                fontVariantNumeric: 'normal',
                fontStretch: '100%',
              }}
            >
              {total}
            </span>
            <span className="text-[10px] uppercase font-semibold text-neutral-400 mt-1">{totalLabel}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 w-full max-w-[200px]">
          {data.map((slice, i) => {
            const percentage = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            return (
              <div key={slice.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color || PALETTE[i % PALETTE.length] }}
                  />
                  <span className="text-neutral-700 truncate font-medium">{slice.label}</span>
                </div>
                <div className="flex items-center gap-2 font-semibold tabular-nums shrink-0">
                  <span className="text-neutral-900">{slice.value}</span>
                  <span className="text-neutral-400 text-[11px] w-8 text-right">{percentage}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


// ==========================================
// 3. BAR CHART WIDGET (Horizontal with Status Splits)
// ==========================================
interface BarRow {
  label: string;
  total: number;
  segments?: { label: string; count: number; color: string }[];
}

interface BarChartProps {
  title: string;
  subtitle?: string;
  data: BarRow[];
}

export const BarChartWidget: React.FC<BarChartProps> = ({ title, subtitle, data }) => {
  const maxVal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-neutral-900 font-['Syne',sans-serif]">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-3.5 my-auto">
        {data.length === 0 ? (
          <p className="text-xs text-neutral-400 text-center py-6">No data matching current filters</p>
        ) : (
          data.map(row => {
            const widthPct = Math.max(Math.round((row.total / maxVal) * 100), 4);
            return (
              <div key={row.label} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-neutral-800 truncate">{row.label}</span>
                  <span className="text-neutral-500 tabular-nums">{row.total} items</span>
                </div>
                <div className="h-4 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                  {row.segments && row.segments.length > 0 ? (
                    row.segments.map((seg, idx) => {
                      if (seg.count === 0) return null;
                      const segWidth = (seg.count / row.total) * 100;
                      return (
                        <div
                          key={idx}
                          style={{ width: `${segWidth}%`, backgroundColor: seg.color }}
                          className="h-full first:rounded-l-full last:rounded-r-full transition-all duration-300"
                          title={`${seg.label}: ${seg.count}`}
                        />
                      );
                    })
                  ) : (
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full bg-neutral-900 rounded-full transition-all duration-300"
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Optional segment legend */}
      {data[0]?.segments && data[0].segments.length > 0 && (
        <div className="flex items-center gap-4 pt-4 mt-3 border-t border-neutral-100 text-[11px] text-neutral-600">
          {data[0].segments.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


// ==========================================
// 4. DELIVERABLE PIPELINE FUNNEL WIDGET
// ==========================================
interface FunnelStage {
  label: string;
  count: number;
  description: string;
  color: string;
  icon?: React.ReactNode;
}

interface FunnelChartProps {
  title: string;
  subtitle?: string;
  stages: FunnelStage[];
}

export const FunnelWidget: React.FC<FunnelChartProps> = ({ title, subtitle, stages }) => {
  const maxCount = Math.max(...stages.map(s => s.count), 1);

  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-neutral-900 font-['Syne',sans-serif]">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stage, idx) => {
          const conversion = idx > 0 && stages[idx - 1].count > 0
            ? Math.round((stage.count / stages[idx - 1].count) * 100)
            : 100;

          return (
            <div
              key={stage.label}
              className="relative p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  Step {idx + 1}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
              </div>

              <div>
                <div
                  className="text-2xl sm:text-3xl font-bold text-neutral-900 kpi-number leading-none py-0.5"
                  style={{
                    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                    fontVariantNumeric: 'normal',
                    fontStretch: '100%',
                  }}
                >
                  {stage.count}
                </div>
                <div className="text-xs font-semibold text-neutral-800 mt-1.5">{stage.label}</div>
                <p className="text-[11px] text-neutral-500 mt-1">{stage.description}</p>
              </div>

              {idx > 0 && (
                <div className="mt-3 pt-2.5 border-t border-neutral-200/60 flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Conversion</span>
                  <span className="font-semibold text-neutral-800">{conversion}%</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


// ==========================================
// 5. MATRIX SUMMARY TABLE (Salesforce Style)
// ==========================================
interface MatrixCell {
  row: string;
  col: string;
  count: number;
}

interface MatrixTableProps {
  title: string;
  subtitle?: string;
  rowHeader: string;
  colHeader: string;
  rows: string[];
  cols: string[];
  cells: MatrixCell[];
}

export const MatrixTableWidget: React.FC<MatrixTableProps> = ({
  title,
  subtitle,
  rowHeader,
  colHeader,
  rows,
  cols,
  cells,
}) => {
  // Helper to get count for a row and col
  const getCount = (r: string, c: string) => {
    const match = cells.find(cell => cell.row === r && cell.col === c);
    return match ? match.count : 0;
  };

  const getRowTotal = (r: string) => {
    return cols.reduce((sum, c) => sum + getCount(r, c), 0);
  };

  const getColTotal = (c: string) => {
    return rows.reduce((sum, r) => sum + getCount(r, c), 0);
  };

  const grandTotal = rows.reduce((sum, r) => sum + getRowTotal(r), 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-neutral-900 font-['Syne',sans-serif]">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-neutral-100/80 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">{rowHeader} \ {colHeader}</th>
              {cols.map(c => (
                <th key={c} className="py-2.5 px-3 text-center">{c}</th>
              ))}
              <th className="py-2.5 px-3 text-right bg-neutral-200/50">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-neutral-800">
            {rows.map(r => {
              const rowTotal = getRowTotal(r);
              return (
                <tr key={r} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-neutral-900">{r}</td>
                  {cols.map(c => {
                    const count = getCount(r, c);
                    return (
                      <td key={c} className="py-2.5 px-3 text-center tabular-nums">
                        {count > 0 ? (
                          <span className={`inline-block px-2 py-0.5 rounded font-medium ${
                            c.toLowerCase().includes('unworn')
                              ? 'bg-amber-100/80 text-amber-900 font-bold'
                              : 'bg-neutral-100 text-neutral-800'
                          }`}>
                            {count}
                          </span>
                        ) : (
                          <span className="text-neutral-300">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-3 text-right font-bold tabular-nums bg-neutral-50 text-neutral-900">
                    {rowTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-neutral-300 font-bold text-neutral-900 bg-neutral-100/60 text-xs">
              <td className="py-2.5 px-3">Total</td>
              {cols.map(c => (
                <td key={c} className="py-2.5 px-3 text-center tabular-nums">
                  {getColTotal(c)}
                </td>
              ))}
              <td className="py-2.5 px-3 text-right tabular-nums bg-neutral-200/70 font-extrabold text-sm">
                {grandTotal}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
