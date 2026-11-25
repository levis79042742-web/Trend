import React, { useState } from 'react';
import {
  Bookmark,
  Clock,
  Copy,
  Plus,
  Share2,
  Sparkles,
  Trash2,
  Video,
} from 'lucide-react';
import type { CommerceOpportunity, ShortVideoPackage, TrendItem } from '../types/trend';

interface SavedViewProps {
  savedTrends: TrendItem[];
  savedProducts: CommerceOpportunity[];
  savedScripts: ShortVideoPackage[];
  trackedKeywords: string[];
  searchHistory: string[];
  onOpenAnalysis: (item: TrendItem) => void;
  onToggleSaveTrend: (item: TrendItem) => void;
  onToggleSaveProduct: (product: CommerceOpportunity) => void;
  onDeleteScript: (id: string) => void;
  onToggleTrackedKeyword: (kw: string) => void;
  onSearchKeyword: (kw: string) => void;
  onClearSearchHistory: () => void;
  onCreateShortVideo: (topicTitle: string, productFocus?: string) => void;
  onCopyText: (label: string, text: string) => void;
  onShare: (title: string, text: string) => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  savedTrends,
  savedProducts,
  savedScripts,
  trackedKeywords,
  searchHistory,
  onOpenAnalysis,
  onToggleSaveTrend,
  onToggleSaveProduct,
  onDeleteScript,
  onToggleTrackedKeyword,
  onSearchKeyword,
  onClearSearchHistory,
  onCreateShortVideo,
  onCopyText,
  onShare,
}) => {
  const [tab, setTab] = useState<'trends' | 'products' | 'scripts' | 'keywords'>('trends');
  const [newKeyword, setNewKeyword] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          我的收藏與追蹤中心
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          集中管理已收藏的熱門話題、商機選品、AI 生成短影音腳本與追蹤關鍵字
        </p>
      </div>

      {/* Sub Tabs */}
      <div
        className="flex items-center gap-1 p-1 rounded-xl border overflow-x-auto no-scrollbar"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        {[
          { id: 'trends', label: `熱門話題 (${savedTrends.length})` },
          { id: 'products', label: `爆紅商品 (${savedProducts.length})` },
          { id: 'scripts', label: `AI 文案庫 (${savedScripts.length})` },
          { id: 'keywords', label: `關鍵字與歷史 (${trackedKeywords.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as typeof tab)}
            className="px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 min-h-[38px]"
            style={{
              backgroundColor: tab === t.id ? 'var(--accent-primary)' : 'transparent',
              color: tab === t.id ? 'var(--accent-primary-fg)' : 'var(--text-secondary)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Saved Trends */}
      {tab === 'trends' && (
        <section className="space-y-3">
          {savedTrends.length === 0 ? (
            <EmptyBox
              title="尚未收藏任何熱門話題"
              desc="在首頁排行榜點擊話題右側的書籤圖示，即可將關注話題存放在這裡隨時追蹤。"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedTrends.map((item) => (
                <div
                  key={item.id + item.title}
                  className="rounded-2xl p-4 border flex flex-col justify-between gap-3"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {item.categoryLabel} · {item.source} · 熱度 {item.heatScore}
                    </div>
                    <h3 className="text-base font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {item.summary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                    <button
                      type="button"
                      onClick={() => onOpenAnalysis(item)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
                      style={{
                        backgroundColor: 'var(--accent-primary)',
                        color: 'var(--accent-primary-fg)',
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI 分析
                    </button>
                    <button
                      type="button"
                      onClick={() => onCreateShortVideo(item.title)}
                      className="px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 min-h-[38px]"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Video className="w-3.5 h-3.5" />
                      創作腳本
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleSaveTrend(item)}
                      className="ml-auto p-2 rounded-xl border min-h-[38px] min-w-[38px] flex items-center justify-center"
                      style={{
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--negative)',
                      }}
                      aria-label={`移除收藏 ${item.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Saved Products */}
      {tab === 'products' && (
        <section className="space-y-3">
          {savedProducts.length === 0 ? (
            <EmptyBox
              title="尚未收藏任何爆紅商品與商機"
              desc="前往「趨勢」或「首頁」的爆紅商品專區，點擊收藏即可建立您的個人選品清單。"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-2xl p-4 border space-y-3"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs" style={{ color: 'var(--accent-primary)' }}>
                        {prod.categoryLabel} · 關注度 {prod.consumerInterestIndex}
                      </div>
                      <h3 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {prod.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleSaveProduct(prod)}
                      className="p-2 rounded-xl border"
                      style={{ borderColor: 'var(--border-hairline)', color: 'var(--negative)' }}
                      aria-label={`移除商品 ${prod.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {prod.ecommerceAdvice}
                  </p>
                  <button
                    type="button"
                    onClick={() => onCreateShortVideo(prod.linkedTrendTitle, prod.title)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                    style={{
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--accent-primary-fg)',
                    }}
                  >
                    <Video className="w-3.5 h-3.5" />
                    生成帶貨腳本
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Saved AI Scripts */}
      {tab === 'scripts' && (
        <section className="space-y-4">
          {savedScripts.length === 0 ? (
            <EmptyBox
              title="尚未收藏 AI 短影音腳本"
              desc="在「AI 創作」生成企劃包後點擊「收藏文案包」，所有腳本與提示詞都會永久保存在此。"
            />
          ) : (
            savedScripts.map((pkg) => (
              <div
                key={pkg.id}
                className="rounded-2xl p-5 border space-y-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      建立時間：{new Date(pkg.generatedAt).toLocaleString('zh-TW', { hour12: false })}
                    </div>
                    <h3 className="text-base font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                      {pkg.topicTitle}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onCopyText('30秒腳本', pkg.scripts.sec30)}
                      className="px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                      複製腳本
                    </button>
                    <button
                      type="button"
                      onClick={() => onShare(pkg.topicTitle, pkg.scripts.sec30)}
                      className="px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5"
                      style={{
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderColor: 'var(--border-hairline)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      分享
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteScript(pkg.id)}
                      className="p-2 rounded-xl border"
                      style={{ borderColor: 'var(--border-hairline)', color: 'var(--negative)' }}
                      aria-label="刪除腳本"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {pkg.scripts.sec30}
                </p>
              </div>
            ))
          )}
        </section>
      )}

      {/* Tab 4: Tracked Keywords & Search History */}
      {tab === 'keywords' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <section
            className="rounded-2xl p-5 border space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                自訂關鍵字追蹤清單
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                當每小時同步的即時熱榜出現您追蹤的關鍵字時，系統將主動產生通知提醒
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newKeyword.trim()) return;
                onToggleTrackedKeyword(newKeyword.trim());
                setNewKeyword('');
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="輸入想追蹤的關鍵字（如：Switch 2）"
                className="flex-1 px-3 py-2 rounded-xl border text-xs outline-none min-h-[40px]"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 min-h-[40px]"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-fg)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                新增
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {trackedKeywords.map((kw) => (
                <div
                  key={kw}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-hairline)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <button type="button" onClick={() => onSearchKeyword(kw)} className="hover:underline">
                    {kw}
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleTrackedKeyword(kw)}
                    style={{ color: 'var(--text-muted)' }}
                    aria-label={`移除追蹤 ${kw}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section
            className="rounded-2xl p-5 border space-y-4"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-hairline)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  搜尋歷史紀錄
                </h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  點擊關鍵字可快速回到首頁查詢
                </p>
              </div>
              {searchHistory.length > 0 && (
                <button
                  type="button"
                  onClick={onClearSearchHistory}
                  className="text-xs underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  全部清除
                </button>
              )}
            </div>

            {searchHistory.length === 0 ? (
              <p className="text-xs py-4" style={{ color: 'var(--text-muted)' }}>
                尚無搜尋紀錄
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => onSearchKeyword(kw)}
                    className="px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <Clock className="w-3 h-3" />
                    {kw}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const EmptyBox: React.FC<{ title: string; desc: string }> = ({ title, desc }) => (
  <div
    className="rounded-2xl p-10 border text-center space-y-2"
    style={{
      backgroundColor: 'var(--bg-surface)',
      borderColor: 'var(--border-hairline)',
    }}
  >
    <Bookmark className="w-8 h-8 mx-auto" style={{ color: 'var(--text-muted)' }} />
    <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
      {title}
    </h3>
    <p className="text-xs max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
      {desc}
    </p>
  </div>
);
