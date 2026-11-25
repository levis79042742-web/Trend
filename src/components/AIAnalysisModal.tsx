import React from 'react';
import {
  Bookmark,
  Check,
  ExternalLink,
  Flame,
  Info,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Video,
  X,
} from 'lucide-react';
import type { AIAnalysisResult, TrendItem } from '../types/trend';
import { HeatLineChart } from './TrendCharts';

interface AIAnalysisModalProps {
  trend: TrendItem | null;
  analysis: AIAnalysisResult | null;
  loading: boolean;
  error: string | null;
  isSaved: boolean;
  isTracked: boolean;
  onClose: () => void;
  onRetry: () => void;
  onToggleSave: (trend: TrendItem) => void;
  onToggleTrackKeyword: (keyword: string) => void;
  onCreateShortVideo: (topicTitle: string) => void;
  onSelectSimilarTopic: (keyword: string) => void;
  onShare: (title: string, text: string) => void;
}

export const AIAnalysisModal: React.FC<AIAnalysisModalProps> = ({
  trend,
  analysis,
  loading,
  error,
  isSaved,
  isTracked,
  onClose,
  onRetry,
  onToggleSave,
  onToggleTrackKeyword,
  onCreateShortVideo,
  onSelectSimilarTopic,
  onShare,
}) => {
  if (!trend) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm p-0 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`AI 趨勢深度分析：${trend.title}`}
    >
      <div
        className="w-full md:max-w-3xl max-h-[92vh] rounded-t-3xl md:rounded-2xl border overflow-hidden flex flex-col shadow-2xl"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-strong)',
        }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--border-hairline)' }}
        >
          <div className="min-w-0">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              #{trend.rank} · {trend.categoryLabel} · {trend.source}
            </div>
            <h2 className="text-lg font-bold truncate mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {trend.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border transition-colors shrink-0"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-primary)',
            }}
            aria-label="關閉視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onCreateShortVideo(trend.title)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap shrink-0"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-fg)',
              }}
            >
              <Video className="w-4 h-4" />
              一鍵生成短影音腳本
            </button>

            <button
              type="button"
              onClick={() => onToggleSave(trend)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap shrink-0"
              style={{
                backgroundColor: isSaved ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                borderColor: isSaved ? 'var(--accent-primary)' : 'var(--border-hairline)',
                color: isSaved ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}
            >
              <Bookmark className="w-4 h-4" />
              {isSaved ? '已收藏話題' : '收藏話題'}
            </button>

            <button
              type="button"
              onClick={() => onToggleTrackKeyword(trend.title)}
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap shrink-0"
              style={{
                backgroundColor: isTracked ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                borderColor: isTracked ? 'var(--accent-primary)' : 'var(--border-hairline)',
                color: isTracked ? 'var(--accent-primary)' : 'var(--text-primary)',
              }}
            >
              {isTracked ? <Check className="w-4 h-4" /> : <Target className="w-4 h-4" />}
              {isTracked ? '已追蹤關鍵字' : '追蹤關鍵字'}
            </button>

            <button
              type="button"
              onClick={() =>
                onShare(
                  `這週紅什麼 Trend7｜${trend.title}`,
                  analysis
                    ? `${trend.title}\n爆紅原因：${analysis.viralReason}\nAI 趨勢推估：${analysis.futurePrediction}`
                    : `${trend.title}（熱度指數 ${trend.heatScore}，成長 +${trend.growthPct}%）`
                )
              }
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap shrink-0"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <Share2 className="w-4 h-4" />
              分享
            </button>

            <a
              href={trend.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2.5 rounded-xl text-sm font-medium border flex items-center gap-2 transition-colors min-h-[44px] whitespace-nowrap shrink-0"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-secondary)',
              }}
            >
              <ExternalLink className="w-4 h-4" />
              查看原始來源
            </a>
          </div>

          {/* 7-day chart */}
          <HeatLineChart
            title="七天熱度變化曲線"
            subtitle={`目前熱度指數 ${trend.heatScore} · 成長 +${trend.growthPct}%`}
            data={trend.history7d}
            height={175}
          />

          {/* AI Disclaimer */}
          <div
            className="rounded-xl p-3.5 border flex items-start gap-3 text-xs leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-secondary)',
            }}
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>AI 推估聲明：</strong>
              以下爆紅解析、趨勢預測與商業機會評估皆由 AI 根據目前公開趨勢資訊推估生成，僅供內容創作與選品決策參考，非確定事實。
            </span>
          </div>

          {/* Loading / Error / Content */}
          {loading && (
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                <Sparkles className="w-4 h-4 animate-spin" />
                正在呼叫 Gemini AI 進行趨勢拆解與商機推估…
              </div>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl animate-pulse"
                  style={{ backgroundColor: 'var(--bg-muted)' }}
                />
              ))}
            </div>
          )}

          {!loading && error && (
            <div
              className="rounded-xl p-4 border space-y-3"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--negative)',
              }}
            >
              <div className="text-sm font-medium" style={{ color: 'var(--negative)' }}>
                {error}
              </div>
              <button
                type="button"
                onClick={onRetry}
                className="px-4 py-2 rounded-lg text-xs font-semibold"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary-fg)',
                }}
              >
                重新分析
              </button>
            </div>
          )}

          {!loading && !error && analysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnalysisBlock icon={<Flame className="w-4 h-4" />} title="爆紅原因分析" text={analysis.viralReason} />
                <AnalysisBlock icon={<Info className="w-4 h-4" />} title="熱門事件摘要" text={analysis.summary} />
                <AnalysisBlock icon={<TrendingUp className="w-4 h-4" />} title="七天人氣變化" text={analysis.sevenDayTrajectory} />
                <AnalysisBlock
                  icon={<Sparkles className="w-4 h-4" />}
                  title="未來趨勢預測（AI 推估）"
                  text={analysis.futurePrediction}
                />
                <AnalysisBlock icon={<Target className="w-4 h-4" />} title="目標客群分析" text={analysis.targetAudience} />
                <AnalysisBlock icon={<TrendingUp className="w-4 h-4" />} title="商品行銷建議" text={analysis.marketingAdvice} />
              </div>

              <AnalysisBlock
                icon={<Sparkles className="w-4 h-4" />}
                title="潛在商業機會（AI 推估）"
                text={analysis.businessOpportunities}
              />

              {analysis.similarTopics.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2.5" style={{ color: 'var(--text-primary)' }}>
                    相似熱門話題推薦（點擊立即搜尋）
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.similarTopics.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => onSelectSimilarTopic(topic)}
                        className="px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors min-h-[38px]"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-hairline)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AnalysisBlock: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({
  icon,
  title,
  text,
}) => (
  <div
    className="rounded-xl p-4 border"
    style={{
      backgroundColor: 'var(--bg-surface-elevated)',
      borderColor: 'var(--border-hairline)',
    }}
  >
    <div className="flex items-center gap-2 text-xs font-semibold mb-2" style={{ color: 'var(--accent-primary)' }}>
      {icon}
      <span>{title}</span>
    </div>
    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
      {text}
    </p>
  </div>
);
