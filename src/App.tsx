/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Bookmark,
  Flame,
  LineChart,
  Settings,
  Sparkles,
  Video,
  X,
} from 'lucide-react';
import { AIAnalysisModal } from './components/AIAnalysisModal';
import { CreatorStudioView } from './components/CreatorStudioView';
import { HomeView } from './components/HomeView';
import { SavedView } from './components/SavedView';
import { SettingsView } from './components/SettingsView';
import { TrendsAnalyticsView } from './components/TrendsAnalyticsView';
import {
  THEMES,
  type AIAnalysisResult,
  type CategoryId,
  type CommerceOpportunity,
  type MainTab,
  type NotificationSettings,
  type RegionCode,
  type ShortVideoPackage,
  type ThemeId,
  type TimeRange,
  type TrendItem,
  type TrendsPayload,
  type UserState,
} from './types/trend';

interface TrendsApiResponse extends TrendsPayload {
  opportunities: CommerceOpportunity[];
}

const DEFAULT_USER: UserState = {
  userEmail: 'creator@trend7.app',
  displayName: 'Trend7 創作者',
  plan: 'free',
  aiQuotaUsed: 0,
  aiQuotaLimit: 10,
  theme: 'cyber-night',
  region: 'TW',
  searchHistory: [],
  trackedKeywords: [],
  savedTrends: [],
  savedProducts: [],
  savedScripts: [],
  notifications: {
    enabled: true,
    viralAlerts: true,
    dailyDigest: true,
    weeklyReport: true,
    rapidRiseAlert: true,
    notifyTime: '09:00',
  },
  alerts: [],
};

const NAV_ITEMS: Array<{ id: MainTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'home', label: '首頁', icon: Flame },
  { id: 'trends', label: '趨勢', icon: LineChart },
  { id: 'creator', label: 'AI 創作', icon: Video },
  { id: 'saved', label: '收藏', icon: Bookmark },
  { id: 'settings', label: '設定', icon: Settings },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [userState, setUserState] = useState<UserState>(DEFAULT_USER);
  const [region, setRegion] = useState<RegionCode>('TW');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [payload, setPayload] = useState<TrendsApiResponse | null>(null);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // AI Analysis Modal State
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Short Video Studio State
  const [creatorTopic, setCreatorTopic] = useState('');
  const [creatorProduct, setCreatorProduct] = useState('');
  const [videoPackage, setVideoPackage] = useState<ShortVideoPackage | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Notifications Drawer & Toast
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2800);
  }, []);

  // Apply theme attribute to <html>
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', userState.theme);
  }, [userState.theme]);

  // Initial load of user preferences
  useEffect(() => {
    fetch('/api/user')
      .then((res) => res.json())
      .then((data: UserState) => {
        if (data && data.theme) {
          setUserState(data);
          setRegion(data.region || 'TW');
        }
      })
      .catch(() => {});
  }, []);

  // Fetch trends whenever region or timeRange changes
  const fetchTrends = useCallback(async (targetRegion: RegionCode, targetRange: TimeRange) => {
    setLoadingTrends(true);
    try {
      const res = await fetch(`/api/trends?region=${targetRegion}&range=${targetRange}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '載入趨勢失敗');
      setPayload(data);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '無法載入即時趨勢資料');
    } finally {
      setLoadingTrends(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTrends(region, timeRange);
  }, [region, timeRange, fetchTrends]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/trends/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '同步失敗');
      setPayload(data);
      // Also refresh user alerts in case tracked keywords matched
      const userRes = await fetch('/api/user');
      if (userRes.ok) setUserState(await userRes.json());
      showToast('已同步最新即時熱門趨勢與快照');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '同步失敗，請稍後重試');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRegionChange = async (newRegion: RegionCode) => {
    setRegion(newRegion);
    setSelectedCategory('all');
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ region: newRegion }),
      });
      if (res.ok) setUserState(await res.json());
    } catch {
      // non-blocking
    }
  };

  const handleThemeChange = async (theme: ThemeId) => {
    setUserState((prev) => ({ ...prev, theme }));
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      if (res.ok) setUserState(await res.json());
      const themeName = THEMES.find((t) => t.id === theme)?.name ?? theme;
      showToast(`已切換為「${themeName}」`);
    } catch {
      // non-blocking
    }
  };

  const handlePlanChange = async (plan: 'free' | 'pro') => {
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (res.ok) {
        setUserState(await res.json());
        showToast(plan === 'pro' ? '已切換為 Trend7 Pro 預覽方案' : '已切換為免費版方案');
      }
    } catch {
      showToast('切換方案失敗');
    }
  };

  const handleUpdateNotifications = async (patch: Partial<NotificationSettings>) => {
    setUserState((prev) => ({
      ...prev,
      notifications: { ...prev.notifications, ...patch },
    }));
    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: patch }),
      });
      if (res.ok) setUserState(await res.json());
    } catch {
      // non-blocking
    }
  };

  const handleSearchSubmit = async (keyword: string) => {
    const clean = keyword.trim();
    if (!clean) return;
    try {
      const res = await fetch('/api/user/search-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: clean }),
      });
      if (res.ok) setUserState(await res.json());
    } catch {
      // ignore
    }
  };

  const handleClearSearchHistory = async () => {
    try {
      const res = await fetch('/api/user/search-history', { method: 'DELETE' });
      if (res.ok) {
        setUserState(await res.json());
        showToast('已清除搜尋紀錄');
      }
    } catch {
      // ignore
    }
  };

  const runAnalysis = async (item: TrendItem) => {
    setAnalysisLoading(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitle: item.title,
          contextSummary: item.summary,
          categoryLabel: item.categoryLabel,
          region: item.region,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.userState) setUserState(data.userState);
        throw new Error(data.error || 'AI 分析失敗');
      }
      setAnalysisResult(data.analysis);
      if (data.userState) setUserState(data.userState);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : '無法連線至 AI 分析服務');
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleOpenAnalysis = (item: TrendItem) => {
    setSelectedTrend(item);
    runAnalysis(item);
  };

  const handleGenerateShortVideo = async (topicTitle: string, productFocus = '', tone = '') => {
    setVideoLoading(true);
    setVideoError(null);
    try {
      const res = await fetch('/api/ai/short-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicTitle,
          productFocus,
          tone,
          region,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.userState) setUserState(data.userState);
        throw new Error(data.error || '腳本生成失敗');
      }
      setVideoPackage(data.scriptPackage);
      if (data.userState) setUserState(data.userState);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : '短影音創作服務暫時無法使用');
    } finally {
      setVideoLoading(false);
    }
  };

  const handleJumpToCreator = (topicTitle: string, productFocus = '') => {
    setSelectedTrend(null);
    setCreatorTopic(topicTitle);
    setCreatorProduct(productFocus);
    setActiveTab('creator');
    handleGenerateShortVideo(topicTitle, productFocus);
  };

  const handleToggleSaveTrend = async (item: TrendItem) => {
    try {
      const res = await fetch('/api/user/bookmarks/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      });
      if (res.ok) {
        const updated: UserState = await res.json();
        setUserState(updated);
        const savedNow = updated.savedTrends.some((t) => t.title === item.title);
        showToast(savedNow ? `已收藏「${item.title}」` : `已取消收藏「${item.title}」`);
      }
    } catch {
      showToast('收藏操作失敗');
    }
  };

  const handleToggleSaveProduct = async (product: CommerceOpportunity) => {
    try {
      const res = await fetch('/api/user/bookmarks/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product }),
      });
      if (res.ok) {
        const updated: UserState = await res.json();
        setUserState(updated);
        const savedNow = updated.savedProducts.some((p) => p.id === product.id);
        showToast(savedNow ? '已收藏商品商機' : '已移除商品收藏');
      }
    } catch {
      showToast('操作失敗');
    }
  };

  const handleSaveScript = async (pkg: ShortVideoPackage) => {
    try {
      const res = await fetch('/api/user/bookmarks/scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptPackage: pkg }),
      });
      if (res.ok) {
        setUserState(await res.json());
        showToast('已將短影音企劃包存入「收藏」');
      }
    } catch {
      showToast('儲存失敗');
    }
  };

  const handleDeleteScript = async (id: string) => {
    try {
      const res = await fetch(`/api/user/bookmarks/scripts/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUserState(await res.json());
        showToast('已刪除文案');
      }
    } catch {
      showToast('刪除失敗');
    }
  };

  const handleToggleTrackedKeyword = async (keyword: string) => {
    try {
      const res = await fetch('/api/user/tracked-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      if (res.ok) {
        const updated: UserState = await res.json();
        setUserState(updated);
        const trackedNow = updated.trackedKeywords.includes(keyword);
        showToast(trackedNow ? `已追蹤關鍵字「${keyword}」` : `已停止追蹤「${keyword}」`);
      }
    } catch {
      showToast('更新追蹤失敗');
    }
  };

  const handleOpenNotifications = async () => {
    setNotificationsOpen(true);
    try {
      const res = await fetch('/api/user/alerts/read', { method: 'POST' });
      if (res.ok) setUserState(await res.json());
    } catch {
      // ignore
    }
  };

  const handleCopyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`已複製${label}`);
    } catch {
      showToast('瀏覽器未授權剪貼簿，請手動選取複製');
    }
  };

  const handleShare = async (title: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    await handleCopyText('分享內容', `${title}\n\n${text}`);
  };

  const savedTrendTitles = useMemo(
    () => new Set(userState.savedTrends.map((t) => t.title)),
    [userState.savedTrends]
  );
  const savedProductIds = useMemo(
    () => new Set(userState.savedProducts.map((p) => p.id)),
    [userState.savedProducts]
  );
  const savedScriptIds = useMemo(
    () => new Set(userState.savedScripts.map((s) => s.id)),
    [userState.savedScripts]
  );
  const unreadAlertsCount = userState.alerts.filter((a) => !a.read).length;

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Desktop / Large Tablet Sidebar */}
      <aside
        className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r z-30"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="p-5 border-b flex items-center gap-3" style={{ borderColor: 'var(--border-hairline)' }}>
          <img
            src="/assets/aistudio/file_000000001cb481fd82c66beb10659b10_b14ed9f1.png"
            alt="這週紅什麼 Trend7"
            referrerPolicy="no-referrer"
            className="w-11 h-11 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0">
            <div className="text-base font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              這週紅什麼
            </div>
            <div className="text-xs font-semibold tracking-wide" style={{ color: 'var(--accent-primary)' }}>
              Trend7
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3.5 space-y-1" aria-label="主要導覽">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors min-h-[44px]"
                style={{
                  backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-3" style={{ borderColor: 'var(--border-hairline)' }}>
          <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            快速切換風格
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                title={t.name}
                aria-label={t.name}
                className="h-8 rounded-lg border flex items-center justify-center"
                style={{
                  backgroundColor: t.swatch[0],
                  borderColor: userState.theme === t.id ? 'var(--accent-primary)' : 'var(--border-hairline)',
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.swatch[2] }} />
              </button>
            ))}
          </div>
          <div className="text-xs flex items-center justify-between pt-1" style={{ color: 'var(--text-secondary)' }}>
            <span>{userState.plan === 'pro' ? 'Trend7 Pro' : '免費版方案'}</span>
            <span className="font-mono-num">
              AI {userState.aiQuotaUsed}/{userState.aiQuotaLimit}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Bar (Strict 3-zone contract; compact <= 52px on mobile) */}
        <header
          className="sticky top-0 z-30 h-13 lg:h-16 px-4 lg:px-8 border-b backdrop-blur-md flex items-center justify-between gap-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--bg-surface) 88%, transparent)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          {/* Zone 1: Brand / Active context */}
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/assets/aistudio/file_000000001cb481fd82c66beb10659b10_b14ed9f1.png"
              alt="Trend7"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover lg:hidden shrink-0"
            />
            <span className="text-sm lg:text-base font-bold whitespace-nowrap shrink-0" style={{ color: 'var(--text-primary)' }}>
              {activeTab === 'home'
                ? '這週紅什麼 Trend7'
                : NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </span>
          </div>

          {/* Zone 2: Clean Desktop Text Nav */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className="whitespace-nowrap shrink-0 transition-colors hover:underline py-1"
                style={{
                  color: activeTab === item.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Notification Center + Single Primary CTA */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleOpenNotifications}
              className="relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border transition-colors"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
              aria-label="開啟智慧通知中心"
            >
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold font-mono-num flex items-center justify-center"
                  style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary-fg)',
                  }}
                >
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('creator')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 min-h-[40px]"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-fg)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI 腳本創作
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-6 pb-24 lg:pb-10">
          {activeTab === 'home' && (
            <HomeView
              payload={payload}
              opportunities={payload?.opportunities ?? []}
              loading={loadingTrends}
              refreshing={refreshing}
              region={region}
              timeRange={timeRange}
              selectedCategory={selectedCategory}
              searchQuery={searchQuery}
              searchHistory={userState.searchHistory}
              savedTrendTitles={savedTrendTitles}
              savedProductIds={savedProductIds}
              onRegionChange={handleRegionChange}
              onTimeRangeChange={setTimeRange}
              onCategoryChange={setSelectedCategory}
              onSearchChange={setSearchQuery}
              onSearchSubmit={handleSearchSubmit}
              onClearSearchHistory={handleClearSearchHistory}
              onManualRefresh={handleManualRefresh}
              onOpenAnalysis={handleOpenAnalysis}
              onToggleSaveTrend={handleToggleSaveTrend}
              onToggleSaveProduct={handleToggleSaveProduct}
              onCreateShortVideo={handleJumpToCreator}
              onGoToTrends={() => setActiveTab('trends')}
            />
          )}

          {activeTab === 'trends' && (
            <TrendsAnalyticsView
              payload={payload}
              opportunities={payload?.opportunities ?? []}
              activeRegion={region}
              savedProductIds={savedProductIds}
              onSelectRegion={handleRegionChange}
              onOpenAnalysis={handleOpenAnalysis}
              onToggleSaveProduct={handleToggleSaveProduct}
              onCreateShortVideo={handleJumpToCreator}
            />
          )}

          {activeTab === 'creator' && (
            <CreatorStudioView
              trends={payload?.items ?? []}
              initialTopic={creatorTopic}
              initialProduct={creatorProduct}
              currentPackage={videoPackage}
              loading={videoLoading}
              error={videoError}
              savedScriptIds={savedScriptIds}
              onGenerate={handleGenerateShortVideo}
              onSavePackage={handleSaveScript}
              onCopyText={handleCopyText}
              onShare={handleShare}
            />
          )}

          {activeTab === 'saved' && (
            <SavedView
              savedTrends={userState.savedTrends}
              savedProducts={userState.savedProducts}
              savedScripts={userState.savedScripts}
              trackedKeywords={userState.trackedKeywords}
              searchHistory={userState.searchHistory}
              onOpenAnalysis={handleOpenAnalysis}
              onToggleSaveTrend={handleToggleSaveTrend}
              onToggleSaveProduct={handleToggleSaveProduct}
              onDeleteScript={handleDeleteScript}
              onToggleTrackedKeyword={handleToggleTrackedKeyword}
              onSearchKeyword={(kw) => {
                setSearchQuery(kw);
                setActiveTab('home');
              }}
              onClearSearchHistory={handleClearSearchHistory}
              onCreateShortVideo={handleJumpToCreator}
              onCopyText={handleCopyText}
              onShare={handleShare}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              userState={userState}
              sources={payload?.sources ?? []}
              onThemeChange={handleThemeChange}
              onPlanChange={handlePlanChange}
              onUpdateNotifications={handleUpdateNotifications}
              onCopyText={handleCopyText}
            />
          )}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (5 Tabs: 首頁｜趨勢｜AI 創作｜收藏｜設定) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 border-t backdrop-blur-md grid grid-cols-5 items-center"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--bg-surface) 92%, transparent)',
          borderColor: 'var(--border-hairline)',
        }}
        aria-label="行動版底部導覽列"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className="flex flex-col items-center justify-center min-h-[48px] gap-1"
              style={{
                color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
              }}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* AI Analysis Modal */}
      <AIAnalysisModal
        trend={selectedTrend}
        analysis={analysisResult}
        loading={analysisLoading}
        error={analysisError}
        isSaved={selectedTrend ? savedTrendTitles.has(selectedTrend.title) : false}
        isTracked={selectedTrend ? userState.trackedKeywords.includes(selectedTrend.title) : false}
        onClose={() => setSelectedTrend(null)}
        onRetry={() => selectedTrend && runAnalysis(selectedTrend)}
        onToggleSave={handleToggleSaveTrend}
        onToggleTrackKeyword={handleToggleTrackedKeyword}
        onCreateShortVideo={(topic) => handleJumpToCreator(topic)}
        onSelectSimilarTopic={(kw) => {
          setSelectedTrend(null);
          setSearchQuery(kw);
          setActiveTab('home');
        }}
        onShare={handleShare}
      />

      {/* Notification Center Drawer */}
      {notificationsOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="智慧通知中心"
        >
          <div
            className="w-full max-w-md h-full border-l flex flex-col"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-strong)',
            }}
          >
            <div
              className="px-5 py-4 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-hairline)' }}
            >
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  智慧通知中心
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  新興爆紅提醒 · 追蹤關鍵字命中紀錄
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
                aria-label="關閉通知中心"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {userState.alerts.length === 0 ? (
                <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  目前尚無新通知
                </p>
              ) : (
                userState.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl p-3.5 border space-y-1"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-hairline)',
                    }}
                  >
                    <div className="text-xs font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {alert.title}
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {alert.body}
                    </p>
                    <div className="text-[11px] font-mono-num" style={{ color: 'var(--text-muted)' }}>
                      {new Date(alert.createdAt).toLocaleString('zh-TW', { hour12: false })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen(false);
                  setActiveTab('settings');
                }}
                className="w-full py-2.5 rounded-xl border text-xs font-semibold min-h-[44px]"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              >
                管理通知時間與追蹤關鍵字
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-semibold whitespace-nowrap"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--accent-primary)',
            color: 'var(--text-primary)',
          }}
          role="status"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
