import React, { useState } from 'react';
import type { HistoryPoint, RegionCode } from '../types/trend';

interface LineChartProps {
  title: string;
  subtitle: string;
  data: HistoryPoint[];
  height?: number;
}

export const HeatLineChart: React.FC<LineChartProps> = ({
  title,
  subtitle,
  data,
  height = 200,
}) => {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const safeData = data.length > 0 ? data : [{ label: '今日', score: 50 }];
  const width = 560;
  const padX = 36;
  const padY = 24;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const scores = safeData.map((d) => d.score);
  const minVal = Math.max(0, Math.min(...scores) - 10);
  const maxVal = Math.min(100, Math.max(...scores) + 8);
  const range = Math.max(10, maxVal - minVal);

  const points = safeData.map((d, i) => {
    const x = padX + (safeData.length === 1 ? chartW / 2 : (i / (safeData.length - 1)) * chartW);
    const y = padY + chartH - ((d.score - minVal) / range) * chartH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padY + chartH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padY + chartH).toFixed(1)} Z`;

  const activePoint = hoverIdx !== null ? points[hoverIdx] : points[points.length - 1];

  return (
    <div
      className="rounded-2xl p-5 border transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {activePoint.label}
          </div>
          <div className="text-lg font-bold font-mono-num" style={{ color: 'var(--accent-primary)' }}>
            {activePoint.score}
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto block select-none" role="img" aria-label={title}>
          <defs>
            <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-stroke)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--chart-stroke)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((t) => {
            const y = padY + chartH * t;
            const val = Math.round(maxVal - range * t);
            return (
              <g key={t}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="var(--border-hairline)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padX - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-muted)"
                  className="font-mono-num"
                >
                  {val}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#trendAreaGrad)" />
          <path d={linePath} fill="none" stroke="var(--chart-stroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {points.map((pt, idx) => {
            const isHovered = hoverIdx === idx || (hoverIdx === null && idx === points.length - 1);
            return (
              <g
                key={pt.label + idx}
                onMouseEnter={() => setHoverIdx(idx)}
                onMouseLeave={() => setHoverIdx(null)}
                className="cursor-pointer"
              >
                <rect x={pt.x - 18} y={padY} width={36} height={chartH + 20} fill="transparent" />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3}
                  fill={isHovered ? 'var(--accent-primary)' : 'var(--bg-surface)'}
                  stroke="var(--chart-stroke)"
                  strokeWidth="2"
                />
                <text
                  x={pt.x}
                  y={height - 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill={isHovered ? 'var(--text-primary)' : 'var(--text-muted)'}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

interface CategoryDonutProps {
  data: Array<{ category: string; label: string; count: number; avgHeat: number }>;
}

const DONUT_COLORS = ['#ff4d1c', '#06b6d4', '#a855f7', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899'];

export const CategoryDonutChart: React.FC<CategoryDonutProps> = ({ data }) => {
  const topSlices = data.slice(0, 6);
  const total = topSlices.reduce((sum, item) => sum + item.count, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        熱門分類佔比圖
      </h3>
      <p className="text-xs mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
        依目前即時抓取話題分類統計
      </p>

      {topSlices.length === 0 ? (
        <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          尚無分類統計資料
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
              {topSlices.map((slice, idx) => {
                const pct = slice.count / total;
                const strokeLength = pct * circumference;
                const dashArray = `${strokeLength} ${circumference - strokeLength}`;
                const dashOffset = -offset;
                offset += strokeLength;
                return (
                  <circle
                    key={slice.category}
                    cx="70"
                    cy="70"
                    r={radius}
                    fill="transparent"
                    stroke={DONUT_COLORS[idx % DONUT_COLORS.length]}
                    strokeWidth="16"
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                總話題
              </span>
              <span className="text-xl font-bold font-mono-num" style={{ color: 'var(--text-primary)' }}>
                {total}
              </span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            {topSlices.map((slice, idx) => {
              const pct = Math.round((slice.count / total) * 100);
              return (
                <div key={slice.category} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                    />
                    <span className="truncate" style={{ color: 'var(--text-primary)' }}>
                      {slice.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono-num shrink-0" style={{ color: 'var(--text-secondary)' }}>
                    {slice.count} 筆 · {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

interface GrowthBarProps {
  items: Array<{ title: string; growthPct: number; heatScore: number }>;
}

export const GrowthBarChart: React.FC<GrowthBarProps> = ({ items }) => {
  const top = items.slice(0, 6);
  const maxGrowth = Math.max(100, ...top.map((i) => i.growthPct));

  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        人氣成長柱狀圖
      </h3>
      <p className="text-xs mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
        短時段搜尋增幅最快話題排行
      </p>

      <div className="space-y-3.5">
        {top.map((item, idx) => {
          const widthPct = Math.max(10, Math.round((item.growthPct / maxGrowth) * 100));
          return (
            <div key={item.title + idx}>
              <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                <span className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                  {idx + 1}. {item.title}
                </span>
                <span className="font-mono-num shrink-0" style={{ color: 'var(--positive)' }}>
                  +{item.growthPct}%
                </span>
              </div>
              <div
                className="h-2.5 w-full rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--bg-muted)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: idx === 0 ? 'var(--accent-primary)' : 'var(--chart-secondary)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface RegionCompareProps {
  data: Array<{ region: RegionCode; label: string; avgHeat: number; topKeyword: string; itemCount: number }>;
  activeRegion: RegionCode;
  onSelectRegion: (r: RegionCode) => void;
}

export const RegionComparisonChart: React.FC<RegionCompareProps> = ({
  data,
  activeRegion,
  onSelectRegion,
}) => {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-hairline)',
      }}
    >
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        不同地區趨勢比較
      </h3>
      <p className="text-xs mt-1 mb-4" style={{ color: 'var(--text-muted)' }}>
        點選地區可直接同步並切換該地即時熱榜
      </p>

      <div className="space-y-3">
        {data.map((row) => {
          const isActive = row.region === activeRegion;
          return (
            <button
              key={row.region}
              type="button"
              onClick={() => onSelectRegion(row.region)}
              className="w-full text-left p-3 rounded-xl border transition-colors min-h-[44px]"
              style={{
                backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-hairline)',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {row.label}
                    </span>
                    <span className="text-xs font-mono-num" style={{ color: 'var(--text-muted)' }}>
                      {row.itemCount > 0 ? `${row.itemCount} 筆已同步` : '尚未同步'}
                    </span>
                  </div>
                  <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    焦點熱詞：{row.topKeyword}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    平均熱度
                  </div>
                  <div
                    className="text-base font-bold font-mono-num"
                    style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)' }}
                  >
                    {row.avgHeat > 0 ? row.avgHeat : '--'}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
