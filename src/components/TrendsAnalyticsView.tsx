import React, { useState } from 'react';
import { Bookmark, History, Sparkles, TrendingUp, Video } from 'lucide-react';
import type { CommerceOpportunity, RegionCode, TrendItem, TrendsPayload } from '../types/trend';
import {
  CategoryDonutChart,
  GrowthBarChart,
  HeatLineChart,
  RegionComparisonChart,
} from './TrendCharts';

interface TrendsAnalyticsViewProps {
  payload: TrendsPayload | null;
  opportunities: CommerceOpportunity[];
  activeRegion: RegionCode;
  savedProductIds: Set<string>;
  onSelectRegion: (r: RegionCode) => void;
  onOpenAnalysis: (item: TrendItem) => void;
  onToggleSaveProduct: (opp: CommerceOpportunity) => void;
  onCreateShortVideo: (topicTitle: string, productFocus?: string) => void;
}

export const TrendsAnalyticsView: React.FC<TrendsAnalyticsViewProps> = ({
  payload,
  opportunities,
  activeRegion,
  savedProductIds,
  onSelectRegion,
  onOpenAnalysis,
  onToggleSaveProduct,
  onCreateShortVideo,
}) => {
  const [chartWindow, setChartWindow] = useState<'7d' | '30d'>('7d');
  const [selectedTrendIdx, setSelectedTrendIdx] = useState(0);
  const [oppFilter, setOppFilter] = useState<'all' | 'food' | 'beauty' | 'social_video'>('all');
  const [selectedSnapshotIdx, setSelectedSnapshotIdx] = useState(0);

  const items = payload?.items ?? [];
  const activeTrend = items[selectedTrendIdx] ?? items[0];
  const snapshots = payload?.historySnapshots ?? [];
  const activeSnapshot = snapshots[selectedSnapshotIdx] ?? snapshots[0];

  const filteredOpps = opportunities.filter((o) => oppFilter === 'all' || o.kind === oppFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            趨勢圖表與商機洞察中心
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            七天與三十天熱度曲線 · 分類佔比 · 成長排行 · 多地區對比 · 歷史排行榜查詢
          </p>
        </div>

        <div
          className="flex items-center gap-1 p-1 rounded-xl border self-start"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <button
            type="button"
            onClick={() => setChartWindow('7d')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium min-h-[36px]"
            style={{
              backgroundColor: chartWindow === '7d' ? 'var(--accent-primary)' : 'transparent',
              color: chartWindow === '7d' ? 'var(--accent-primary-fg)' : 'var(--text-secondary)',
            }}
          >
            七天熱度折線
          </button>
          <button
            type="button"
            onClick={() => setChartWindow('30d')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium min-h-[36px]"
            style={{
              backgroundColor: chartWindow === '30d' ? 'var(--accent-primary)' : 'transparent',
              color: chartWindow === '30d' ? 'var(--accent-primary-fg)' : 'var(--text-secondary)',
            }}
          >
            三十天趨勢分析
          </button>
        </div>
      </div>

      {/* Topic Selector + Line Chart */}
      {items.length > 0 && activeTrend && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {items.slice(0, 8).map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedTrendIdx(idx)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium border whitespace-nowrap shrink-0 min-h-[38px]"
                style={{
                  backgroundColor: selectedTrendIdx === idx ? 'var(--accent-soft)' : 'var(--bg-surface)',
                  borderColor: selectedTrendIdx === idx ? 'var(--accent-primary)' : 'var(--border-hairline)',
                  color: selectedTrendIdx === idx ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                #{item.rank} {item.title}
              </button>
            ))}
          </div>

          <HeatLineChart
            title={`「${activeTrend.title}」${chartWindow === '7d' ? '七天熱度折線圖' : '三十天趨勢分析'}`}
            subtitle={`${activeTrend.categoryLabel} · 來源 ${activeTrend.source} · 成長 +${activeTrend.growthPct}%`}
            data={chartWindow === '7d' ? activeTrend.history7d : activeTrend.history30d}
            height={220}
          />
        </div>
      )}

      {/* 3-Card Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <CategoryDonutChart data={payload?.categoryBreakdown ?? []} />
        <GrowthBarChart items={items} />
        <RegionComparisonChart
          data={payload?.regionComparison ?? []}
          activeRegion={activeRegion}
          onSelectRegion={onSelectRegion}
        />
      </div>

      {/* Historical Rankings Lookup */}
      <section
        className="rounded-2xl p-5 border space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                歷史排行榜資料庫查詢
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                每次排程自動記錄快照，可回溯比較不同時段之熱門排行變化
              </p>
            </div>
          </div>

          {snapshots.length > 0 && (
            <select
              value={selectedSnapshotIdx}
              onChange={(e) => setSelectedSnapshotIdx(Number(e.target.value))}
              className="px-3 py-2 rounded-xl border text-xs outline-none min-h-[40px]"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
              aria-label="選擇歷史快照時間"
            >
              {snapshots.map((snap, idx) => (
                <option key={snap.id} value={idx}>
                  {snap.region} · {new Date(snap.capturedAt).toLocaleString('zh-TW', { hour12: false })}
                </option>
              ))}
            </select>
          )}
        </div>

        {activeSnapshot ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b text-xs" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>
                  <th className="py-2.5 pr-3 font-medium">名次</th>
                  <th className="py-2.5 px-3 font-medium">話題關鍵字</th>
                  <th className="py-2.5 px-3 font-medium">分類</th>
                  <th className="py-2.5 px-3 font-medium">來源</th>
                  <th className="py-2.5 pl-3 text-right font-medium">熱度 / 成長</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
                {activeSnapshot.topItems.map((row) => (
                  <tr key={row.rank + row.title} style={{ borderColor: 'var(--border-hairline)' }}>
                    <td className="py-2.5 pr-3 font-mono-num font-semibold" style={{ color: 'var(--accent-primary)' }}>
                      #{row.rank}
                    </td>
                    <td className="py-2.5 px-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {row.title}
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {row.categoryLabel}
                    </td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {row.source}
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono-num text-xs">
                      <span style={{ color: 'var(--text-primary)' }}>{row.heatScore}</span>
                      <span className="ml-2" style={{ color: 'var(--positive)' }}>
                        +{row.growthPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            系統已開始寫入即時快照，稍後即可查閱多筆歷史對比紀錄。
          </div>
        )}
      </section>

      {/* 爆紅商品與商機專區 */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              熱門美食・美妝・影音商機分析
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              熱門美食 · 美妝保養 · 社群與短影音變現建議
            </p>
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-xl border self-start"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            {[
              { id: 'all', label: '全部商機' },
              { id: 'food', label: '熱門美食' },
              { id: 'beauty', label: '美妝保養' },
              { id: 'social_video', label: '社群與影片' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setOppFilter(tab.id as typeof oppFilter)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px]"
                style={{
                  backgroundColor: oppFilter === tab.id ? 'var(--accent-primary)' : 'transparent',
                  color: oppFilter === tab.id ? 'var(--accent-primary-fg)' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOpps.map((opp) => {
            const isSaved = savedProductIds.has(opp.id);
            const matchedTrend = items.find((i) => i.title === opp.linkedTrendTitle) ?? items[0];
            return (
              <div
                key={opp.id}
                className="rounded-2xl border p-5 space-y-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs" style={{ color: 'var(--accent-primary)' }}>
                      {opp.categoryLabel} · 消費者關注度 {opp.consumerInterestIndex}
                    </div>
                    <h3 className="text-base font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                      {opp.title}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleSaveProduct(opp)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border shrink-0"
                    style={{
                      backgroundColor: isSaved ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                      borderColor: isSaved ? 'var(--accent-primary)' : 'var(--border-hairline)',
                      color: isSaved ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                    aria-label={`收藏 ${opp.title}`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2.5 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  <p>
                    <strong style={{ color: 'var(--text-primary)' }}>市場需求分析：</strong>
                    {opp.demandAnalysis}
                  </p>
                  <p>
                    <strong style={{ color: 'var(--text-primary)' }}>電商行銷建議：</strong>
                    {opp.ecommerceAdvice}
                  </p>
                  <p>
                    <strong style={{ color: 'var(--text-primary)' }}>創業切入點：</strong>
                    {opp.startupAngle}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    資料說明：{opp.sourceAttribution}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                  <button
                    type="button"
                    onClick={() => onCreateShortVideo(opp.linkedTrendTitle, opp.title)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[40px]"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-primary-fg)',
                    }}
                  >
                    <Video className="w-3.5 h-3.5" />
                    生成帶貨短影音腳本
                  </button>
                  {matchedTrend && (
                    <button
                      type="button"
                      onClick={() => onOpenAnalysis(matchedTrend)}
                      className="px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 min-h-[40px]"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      解析關聯熱詞
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
