import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Bookmark,
  Clock,
  Flame,
  Minus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Video,
  X,
} from 'lucide-react';
import {
  CATEGORIES,
  REGIONS,
  type CategoryId,
  type CommerceOpportunity,
  type RegionCode,
  type TimeRange,
  type TrendItem,
  type TrendsPayload,
} from '../types/trend';
import { HeatLineChart } from './TrendCharts';

interface HomeViewProps {
  payload: TrendsPayload | null;
  opportunities: CommerceOpportunity[];
  loading: boolean;
  refreshing: boolean;
  region: RegionCode;
  timeRange: TimeRange;
  selectedCategory: CategoryId;
  searchQuery: string;
  searchHistory: string[];
  savedTrendTitles: Set<string>;
  savedProductIds: Set<string>;
  onRegionChange: (r: RegionCode) => void;
  onTimeRangeChange: (t: TimeRange) => void;
  onCategoryChange: (c: CategoryId) => void;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onClearSearchHistory: () => void;
  onManualRefresh: () => void;
  onOpenAnalysis: (item: TrendItem) => void;
  onToggleSaveTrend: (item: TrendItem) => void;
  onToggleSaveProduct: (product: CommerceOpportunity) => void;
  onCreateShortVideo: (topicTitle: string, productFocus?: string) => void;
  onGoToTrends: () => void;
}

const TIME_RANGES: Array<{ id: TimeRange; label: string }> = [
  { id: 'today', label: '今日熱門' },
  { id: '24h', label: '24小時' },
  { id: '7d', label: '最近7天' },
  { id: '30d', label: '最近30天' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  payload,
  opportunities,
  loading,
  refreshing,
  region,
  timeRange,
  selectedCategory,
  searchQuery,
  searchHistory,
  savedTrendTitles,
  savedProductIds,
  onRegionChange,
  onTimeRangeChange,
  onCategoryChange,
  onSearchChange,
  onSearchSubmit,
  onClearSearchHistory,
  onManualRefresh,
  onOpenAnalysis,
  onToggleSaveTrend,
  onToggleSaveProduct,
  onCreateShortVideo,
  onGoToTrends,
}) => {
  const [searchFocused, setSearchFocused] = useState(false);

  const items = payload?.items ?? [];
  const filteredItems = items.filter((item) => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  const top10 = filteredItems.slice(0, 10);
  const spotlightTrend = top10[0] ?? items[0] ?? null;
  const hotKeywords = items.slice(0, 5).map((i) => i.title);

  const lastUpdatedLabel = payload?.lastUpdatedAt
    ? new Date(payload.lastUpdatedAt).toLocaleString('zh-TW', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    : '同步中';

  return (
    <div className="space-y-6">
      {/* Hero / Search & Region Control Strip */}
      <section
        className="rounded-2xl p-5 border"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium" style={{ color: 'var(--accent-primary)' }}>
              社群媒體 · 熱門美食 · 美妝保養 · 熱門影片
            </p>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mt-1 text-balance" style={{ color: 'var(--text-primary)' }}>
              本週社群・美食・美妝・影片熱榜
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              <span>資料來源：Google Trends RSS · Google News 四大主題專題</span>
              <span aria-hidden="true">/</span>
              <span className="font-mono-num">最後更新 {lastUpdatedLabel}（每小時自動排程）</span>
            </div>
          </div>

          {/* Region Switcher + Sync */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              className="flex items-center p-1 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-hairline)',
              }}
              role="group"
              aria-label="選擇地區"
            >
              {REGIONS.map((r) => {
                const active = r.code === region;
                return (
                  <button
                    key={r.code}
                    type="button"
                    onClick={() => onRegionChange(r.code)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
                    style={{
                      backgroundColor: active ? 'var(--accent-primary)' : 'transparent',
                      color: active ? 'var(--accent-primary-fg)' : 'var(--text-secondary)',
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={onManualRefresh}
              disabled={refreshing}
              className="px-3.5 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? '更新中' : '立即同步'}
            </button>
          </div>
        </div>

        {/* Search Bar + Suggestions Dropdown */}
        <div className="relative mt-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearchSubmit(searchQuery);
              setSearchFocused(false);
            }}
            className="flex items-center gap-2"
          >
            <div
              className="flex-1 flex items-center gap-2.5 px-3.5 rounded-xl border min-h-[46px]"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: searchFocused ? 'var(--accent-primary)' : 'var(--border-hairline)',
              }}
            >
              <Search className="w-4 h-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="搜尋社群話題、美食甜點、美妝保養或爆紅影片…"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-1.5 rounded-lg"
                  aria-label="清除搜尋"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 min-h-[46px]"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-fg)',
              }}
            >
              搜尋趨勢
            </button>
          </form>

          {searchFocused && (hotKeywords.length > 0 || searchHistory.length > 0) && (
            <div
              className="absolute left-0 right-0 top-full mt-2 rounded-2xl border p-4 z-30 shadow-xl space-y-3"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-strong)',
              }}
            >
              {hotKeywords.length > 0 && (
                <div>
                  <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                    即時熱門搜尋推薦
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hotKeywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onMouseDown={() => {
                          onSearchChange(kw);
                          onSearchSubmit(kw);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs border transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-hairline)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {searchHistory.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      最近搜尋紀錄
                    </span>
                    <button
                      type="button"
                      onMouseDown={onClearSearchHistory}
                      className="text-xs underline"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      清除紀錄
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.map((h) => (
                      <button
                        key={h}
                        type="button"
                        onMouseDown={() => {
                          onSearchChange(h);
                          onSearchSubmit(h);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border"
                        style={{
                          backgroundColor: 'var(--bg-canvas)',
                          borderColor: 'var(--border-hairline)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <Clock className="w-3 h-3" />
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Timeframe + Categories */}
        <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: 'var(--border-hairline)' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex items-center gap-1 p-1 rounded-xl border"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border-hairline)',
              }}
              role="tablist"
              aria-label="時間範圍切換"
            >
              {TIME_RANGES.map((tr) => {
                const active = tr.id === timeRange;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => onTimeRangeChange(tr.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[36px]"
                    style={{
                      backgroundColor: active ? 'var(--bg-surface-elevated)' : 'transparent',
                      color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {tr.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs font-mono-num" style={{ color: 'var(--text-muted)' }}>
              顯示 {filteredItems.length} 筆即時追蹤話題
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => {
              const active = cat.id === selectedCategory;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategoryChange(cat.id)}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap shrink-0 min-h-[38px]"
                  style={{
                    backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                    borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
                    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {payload?.fetchError && (
        <div
          className="rounded-xl px-4 py-3 border text-xs"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--warning)',
            color: 'var(--warning)',
          }}
        >
          部分外部資料源通知：{payload.fetchError}
        </div>
      )}

      {/* Main Grid: Top 10 Leaderboard + Right Spotlight & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: 本週爆紅 TOP 10 */}
        <section
          className="lg:col-span-7 rounded-2xl border overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between gap-3"
            style={{ borderColor: 'var(--border-hairline)' }}
          >
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                本週爆紅 TOP 10 排行榜
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                點擊任意話題即可展開 AI 深度解析與商機預測
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToTrends}
              className="text-xs font-medium whitespace-nowrap shrink-0 underline"
              style={{ color: 'var(--accent-primary)' }}
            >
              完整圖表與歷史排行
            </button>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-muted)' }} />
              ))}
            </div>
          ) : top10.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                目前篩選條件下沒有符合的即時趨勢話題。
              </p>
              <button
                type="button"
                onClick={() => {
                  onCategoryChange('all');
                  onSearchChange('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-fg)',
                }}
              >
                顯示全部領域
              </button>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {top10.map((item) => {
                const isSaved = savedTrendTitles.has(item.title);
                return (
                  <div
                    key={item.id}
                    className="px-5 py-3.5 transition-colors hover:bg-white/[0.02] flex items-start justify-between gap-3"
                    style={{ borderColor: 'var(--border-hairline)' }}
                  >
                    <button
                      type="button"
                      onClick={() => onOpenAnalysis(item)}
                      className="flex items-start gap-3.5 text-left min-w-0 flex-1 group"
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono-num shrink-0 mt-0.5"
                        style={{
                          backgroundColor: item.rank <= 3 ? 'var(--accent-soft)' : 'var(--bg-muted)',
                          color: item.rank <= 3 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {item.rank}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-sm font-semibold truncate group-hover:underline"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.title}
                          </span>
                          {item.isEmergingViral && (
                            <span
                              className="text-[11px] font-semibold shrink-0"
                              style={{ color: 'var(--accent-primary)' }}
                            >
                              新興爆紅
                            </span>
                          )}
                        </div>

                        <div
                          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs mt-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <span>{item.categoryLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>{item.source}</span>
                          {item.trafficLabel && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-num">{item.trafficLabel}</span>
                            </>
                          )}
                          <span aria-hidden="true">·</span>
                          <RankChangeText delta={item.rankDelta} amount={item.rankChangeAmount} />
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right mr-1">
                        <div className="text-sm font-bold font-mono-num" style={{ color: 'var(--text-primary)' }}>
                          {item.heatScore}
                        </div>
                        <div className="text-[11px] font-mono-num" style={{ color: 'var(--positive)' }}>
                          +{item.growthPct}%
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenAnalysis(item)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-colors"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-hairline)',
                          color: 'var(--accent-primary)',
                        }}
                        title="AI 深度分析"
                        aria-label={`AI 分析 ${item.title}`}
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleSaveTrend(item)}
                        className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-colors"
                        style={{
                          backgroundColor: isSaved ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                          borderColor: isSaved ? 'var(--accent-primary)' : 'var(--border-hairline)',
                          color: isSaved ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        }}
                        title={isSaved ? '取消收藏' : '收藏話題'}
                        aria-label={`收藏 ${item.title}`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right 5 cols: AI 精選熱門話題 + 7天趨勢圖 + 短影音靈感 */}
        <div className="lg:col-span-5 space-y-6">
          {spotlightTrend && (
            <section
              className="rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                <img
                  src="/src/assets/images/hero_trend_spotlight_1795588167482.jpg"
                  alt="Trend7 趨勢分析工作台"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="text-xs font-medium text-orange-300">
                    AI 精選熱門話題 · 熱度指數 {spotlightTrend.heatScore}
                  </div>
                  <h3 className="text-lg font-bold leading-snug mt-0.5 line-clamp-2">
                    {spotlightTrend.title}
                  </h3>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                  {spotlightTrend.summary}
                </p>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenAnalysis(spotlightTrend)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[42px]"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-primary-fg)',
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI 爆紅推估解析
                  </button>
                  <button
                    type="button"
                    onClick={() => onCreateShortVideo(spotlightTrend.title)}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[42px]"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Video className="w-3.5 h-3.5" />
                    短影音創作靈感
                  </button>
                </div>
              </div>
            </section>
          )}

          {spotlightTrend && (
            <HeatLineChart
              title={`「${spotlightTrend.title}」七天熱度走勢`}
              subtitle="依據已記錄快照與公開熱度基準繪製"
              data={spotlightTrend.history7d}
              height={185}
            />
          )}
        </div>
      </div>

      {/* 爆紅商品與商機推薦 + 短影音靈感 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              美食・美妝・影音爆款商機推薦
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              精選熱門美食、美妝口碑好物與創作者帶貨切角（未串接電商銷量 API 時提供 AI 推估參考）
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToTrends}
            className="text-xs font-medium underline whitespace-nowrap shrink-0"
            style={{ color: 'var(--accent-primary)' }}
          >
            探索更多商機
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {opportunities.slice(0, 3).map((opp) => {
            const isSaved = savedProductIds.has(opp.id);
            return (
              <div
                key={opp.id}
                className="rounded-2xl border overflow-hidden flex flex-col"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="h-44 w-full overflow-hidden relative" style={{ backgroundColor: 'var(--bg-muted)' }}>
                  {opp.imageUrl ? (
                    <img
                      src={opp.imageUrl}
                      alt={opp.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TrendingUp className="w-8 h-8" style={{ color: 'var(--text-muted)' }} />
                    </div>
                  )}
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {opp.categoryLabel} · 關注指標 {opp.consumerInterestIndex}
                    </div>
                    <h3 className="text-base font-bold mt-1 leading-snug" style={{ color: 'var(--text-primary)' }}>
                      {opp.title}
                    </h3>
                    <p className="text-xs mt-2 leading-relaxed line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
                      {opp.demandAnalysis}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                    <button
                      type="button"
                      onClick={() => onCreateShortVideo(opp.linkedTrendTitle, opp.title)}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 min-h-[40px]"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--accent-primary-fg)',
                      }}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      生成帶貨腳本
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSaveProduct(opp)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border"
                      style={{
                        backgroundColor: isSaved ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                        borderColor: isSaved ? 'var(--accent-primary)' : 'var(--border-hairline)',
                        color: isSaved ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      }}
                      aria-label={`收藏商品 ${opp.title}`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

const RankChangeText: React.FC<{ delta: TrendItem['rankDelta']; amount: number }> = ({ delta, amount }) => {
  if (delta === 'new') {
    return (
      <span className="inline-flex items-center gap-0.5 font-medium" style={{ color: 'var(--accent-primary)' }}>
        <Flame className="w-3 h-3" /> 新進榜
      </span>
    );
  }
  if (delta === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 font-medium font-mono-num" style={{ color: 'var(--positive)' }}>
        <ArrowUpRight className="w-3 h-3" /> 上升 {amount || 1}
      </span>
    );
  }
  if (delta === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 font-medium font-mono-num" style={{ color: 'var(--negative)' }}>
        <ArrowDownRight className="w-3 h-3" /> 下降 {amount || 1}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
      <Minus className="w-3 h-3" /> 持平
    </span>
  );
};
