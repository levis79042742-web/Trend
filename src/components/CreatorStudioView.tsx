import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Check,
  Copy,
  Hash,
  Image,
  Share2,
  Sparkles,
  Video,
} from 'lucide-react';
import type { ShortVideoPackage, TrendItem } from '../types/trend';

interface CreatorStudioViewProps {
  trends: TrendItem[];
  initialTopic?: string;
  initialProduct?: string;
  currentPackage: ShortVideoPackage | null;
  loading: boolean;
  error: string | null;
  savedScriptIds: Set<string>;
  onGenerate: (topicTitle: string, productFocus: string, tone: string) => void;
  onSavePackage: (pkg: ShortVideoPackage) => void;
  onCopyText: (label: string, text: string) => void;
  onShare: (title: string, text: string) => void;
}

const TONES = [
  '節奏明快・高留存網感口語',
  '專業拆解・商業洞察型',
  '開箱實測・真實帶貨型',
  '幽默反轉・社群討論型',
];

export const CreatorStudioView: React.FC<CreatorStudioViewProps> = ({
  trends,
  initialTopic = '',
  initialProduct = '',
  currentPackage,
  loading,
  error,
  savedScriptIds,
  onGenerate,
  onSavePackage,
  onCopyText,
  onShare,
}) => {
  const [topicInput, setTopicInput] = useState(initialTopic);
  const [productInput, setProductInput] = useState(initialProduct);
  const [tone, setTone] = useState(TONES[0]);
  const [scriptLengthTab, setScriptLengthTab] = useState<'sec15' | 'sec30' | 'sec60'>('sec30');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialTopic) setTopicInput(initialTopic);
  }, [initialTopic]);

  useEffect(() => {
    if (initialProduct) setProductInput(initialProduct);
  }, [initialProduct]);

  const handleCopy = (key: string, label: string, text: string) => {
    onCopyText(label, text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  const isSaved = currentPackage ? savedScriptIds.has(currentPackage.id) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          AI 短影音創作助手
        </h1>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          輸入或挑選本週熱門話題，自動生成 15s / 30s / 60s 腳本、吸睛開場、社群文案與 AI 生圖／生影提示詞
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Input Panel */}
        <section
          className="lg:col-span-5 rounded-2xl p-5 border space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              快速帶入即時熱榜話題
            </label>
            <div className="flex flex-wrap gap-2">
              {trends.slice(0, 6).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopicInput(t.title)}
                  className="px-3 py-1.5 rounded-xl border text-xs transition-colors"
                  style={{
                    backgroundColor: topicInput === t.title ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                    borderColor: topicInput === t.title ? 'var(--accent-primary)' : 'var(--border-hairline)',
                    color: topicInput === t.title ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  #{t.rank} {t.title}
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onGenerate(topicInput, productInput, tone);
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="creator-topic" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                創作主題或熱門關鍵字
              </label>
              <input
                id="creator-topic"
                type="text"
                required
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="例如：宇治抹茶開心果巴斯克、韓系水光肌精華、Threads 迷因挑戰…"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none min-h-[44px]"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label htmlFor="creator-product" className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                欲結合推廣的美食、美妝單品或社群服務（選填）
              </label>
              <input
                id="creator-product"
                type="text"
                value={productInput}
                onChange={(e) => setProductInput(e.target.value)}
                placeholder="例如：B5 保濕修護安瓶、手作巴斯克宅配、Vlog 無線麥克風…"
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none min-h-[44px]"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                影片風格與口氣
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTone(t)}
                    className="px-3 py-2.5 rounded-xl border text-xs text-left transition-colors min-h-[40px]"
                    style={{
                      backgroundColor: tone === t ? 'var(--accent-soft)' : 'var(--bg-canvas)',
                      borderColor: tone === t ? 'var(--accent-primary)' : 'var(--border-hairline)',
                      color: tone === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !topicInput.trim()}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 min-h-[48px] transition-opacity disabled:opacity-50"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-fg)',
              }}
            >
              <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? '正在生成完整創作企劃包…' : '生成 15s / 30s / 60s 短影音企劃'}
            </button>
          </form>

          {error && (
            <div
              className="rounded-xl p-3.5 border text-xs"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--negative)',
                color: 'var(--negative)',
              }}
            >
              {error}
            </div>
          )}
        </section>

        {/* Right Output Panel */}
        <section className="lg:col-span-7 space-y-5">
          {!currentPackage && !loading && (
            <div
              className="rounded-2xl p-10 border text-center space-y-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <Video className="w-10 h-10 mx-auto" style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                準備好打造下一支爆款短影音了嗎？
              </h2>
              <p className="text-xs max-w-md mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                左側挑選目前即時爆紅話題或輸入產品名稱，點擊生成即可取得三種秒數分鏡腳本、黃金 3 秒開場 Hook、Threads/IG/TikTok 文案與 AI 視覺提示詞。
              </p>
            </div>
          )}

          {loading && (
            <div
              className="rounded-2xl p-6 border space-y-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--accent-primary)' }}>
                <Sparkles className="w-4 h-4 animate-spin" />
                AI 導演正在撰寫分鏡腳本與社群爆款文案…
              </div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: 'var(--bg-muted)' }} />
              ))}
            </div>
          )}

          {!loading && currentPackage && (
            <div className="space-y-5">
              {/* Top actions */}
              <div
                className="rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    企劃主題
                  </div>
                  <div className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    {currentPackage.topicTitle}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSavePackage(currentPackage)}
                    className="px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 min-h-[40px]"
                    style={{
                      backgroundColor: isSaved ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                      borderColor: isSaved ? 'var(--accent-primary)' : 'var(--border-hairline)',
                      color: isSaved ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    {isSaved ? '已存入文案庫' : '收藏文案包'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onShare(
                        `Trend7 短影音腳本｜${currentPackage.topicTitle}`,
                        `標題：${currentPackage.catchyTitles[0] ?? currentPackage.topicTitle}\n\n30秒腳本：\n${currentPackage.scripts.sec30}\n\nHashtag：${currentPackage.hashtags.join(' ')}`
                      )
                    }
                    className="px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 min-h-[40px]"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    分享企劃
                  </button>
                </div>
              </div>

              {/* Titles & Hooks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CopyableCard
                  title="吸引人的影片標題"
                  copyKey="titles"
                  copiedKey={copiedKey}
                  content={currentPackage.catchyTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}
                  onCopy={handleCopy}
                />
                <CopyableCard
                  title="前 3 秒開場吸睛 Hook"
                  copyKey="hooks"
                  copiedKey={copiedKey}
                  content={currentPackage.hooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}
                  onCopy={handleCopy}
                />
              </div>

              {/* 15s / 30s / 60s Script Tabs */}
              <div
                className="rounded-2xl p-5 border space-y-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="flex items-center gap-1 p-1 rounded-xl border"
                    style={{
                      backgroundColor: 'var(--bg-canvas)',
                      borderColor: 'var(--border-hairline)',
                    }}
                  >
                    {[
                      { id: 'sec15', label: '15秒極速版' },
                      { id: 'sec30', label: '30秒黃金版' },
                      { id: 'sec60', label: '60秒深度版' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setScriptLengthTab(tab.id as typeof scriptLengthTab)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium min-h-[36px]"
                        style={{
                          backgroundColor: scriptLengthTab === tab.id ? 'var(--accent-primary)' : 'transparent',
                          color: scriptLengthTab === tab.id ? 'var(--accent-primary-fg)' : 'var(--text-secondary)',
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopy('active-script', '短影音腳本', currentPackage.scripts[scriptLengthTab])}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 min-h-[36px]"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {copiedKey === 'active-script' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedKey === 'active-script' ? '已複製' : '一鍵複製腳本'}
                  </button>
                </div>

                <pre
                  className="whitespace-pre-wrap text-sm leading-relaxed font-sans"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentPackage.scripts[scriptLengthTab]}
                </pre>
              </div>

              {/* Social Captions + Product Ad Copy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CopyableCard
                  title="Threads / IG / TikTok 社群貼文"
                  copyKey="social"
                  copiedKey={copiedKey}
                  content={`【Threads】\n${currentPackage.socialCaptions.threads}\n\n【Instagram】\n${currentPackage.socialCaptions.instagram}\n\n【TikTok】\n${currentPackage.socialCaptions.tiktok}`}
                  onCopy={handleCopy}
                />
                <CopyableCard
                  title="商品介紹與廣告轉換文案"
                  copyKey="adcopy"
                  copiedKey={copiedKey}
                  content={currentPackage.productAdCopy}
                  onCopy={handleCopy}
                />
              </div>

              {/* Hashtags & AI Image/Video Prompts */}
              <div
                className="rounded-2xl p-5 border space-y-4"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    <Hash className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                    熱門推薦 Hashtag
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('tags', 'Hashtag', currentPackage.hashtags.join(' '))}
                    className="px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {copiedKey === 'tags' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    複製全部標籤
                  </button>
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
                  {currentPackage.hashtags.join('  ')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t" style={{ borderColor: 'var(--border-hairline)' }}>
                  <CopyableCard
                    title="AI 圖片生成提示詞"
                    icon={<Image className="w-3.5 h-3.5" />}
                    copyKey="img-prompt"
                    copiedKey={copiedKey}
                    content={currentPackage.aiImagePrompt}
                    onCopy={handleCopy}
                  />
                  <CopyableCard
                    title="AI 影片生成提示詞"
                    icon={<Video className="w-3.5 h-3.5" />}
                    copyKey="vid-prompt"
                    copiedKey={copiedKey}
                    content={currentPackage.aiVideoPrompt}
                    onCopy={handleCopy}
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const CopyableCard: React.FC<{
  title: string;
  content: string;
  copyKey: string;
  copiedKey: string | null;
  icon?: React.ReactNode;
  onCopy: (key: string, label: string, text: string) => void;
}> = ({ title, content, copyKey, copiedKey, icon, onCopy }) => (
  <div
    className="rounded-2xl p-4 border space-y-2.5"
    style={{
      backgroundColor: 'var(--bg-surface)',
      borderColor: 'var(--border-hairline)',
    }}
  >
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
        {icon}
        <span>{title}</span>
      </div>
      <button
        type="button"
        onClick={() => onCopy(copyKey, title, content)}
        className="px-2.5 py-1 rounded-lg border text-xs flex items-center gap-1 min-h-[32px]"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          borderColor: 'var(--border-hairline)',
          color: 'var(--text-primary)',
        }}
      >
        {copiedKey === copyKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        {copiedKey === copyKey ? '已複製' : '複製'}
      </button>
    </div>
    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>
      {content}
    </p>
  </div>
);
