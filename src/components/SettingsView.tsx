import React, { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  Code2,
  Copy,
  Crown,
  Database,
  Download,
  Palette,
  Smartphone,
} from 'lucide-react';
import {
  THEMES,
  type DataSourceStatus,
  type NotificationSettings,
  type ThemeId,
  type UserState,
} from '../types/trend';

interface BlueprintFile {
  id: string;
  filename: string;
  stack: string;
  description: string;
  code: string;
}

interface SettingsViewProps {
  userState: UserState;
  sources: DataSourceStatus[];
  onThemeChange: (theme: ThemeId) => void;
  onPlanChange: (plan: 'free' | 'pro') => void;
  onUpdateNotifications: (patch: Partial<NotificationSettings>) => void;
  onCopyText: (label: string, text: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  userState,
  sources,
  onThemeChange,
  onPlanChange,
  onUpdateNotifications,
  onCopyText,
}) => {
  const [blueprintFiles, setBlueprintFiles] = useState<BlueprintFile[]>([]);
  const [activeCodeId, setActiveCodeId] = useState<string>('flutter-main');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  useEffect(() => {
    fetch('/api/blueprint')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.files)) {
          setBlueprintFiles(data.files);
          if (data.files[0]) setActiveCodeId(data.files[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const res = await fetch('/api/blueprint/download');
      if (!res.ok) throw new Error('下載失敗');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trend7_flutter_fastapi_source.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      onCopyText('下載連結', `${window.location.origin}/api/blueprint/download`);
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleCopyAllSource = () => {
    if (blueprintFiles.length === 0) return;
    const merged = blueprintFiles
      .map((f) => `========== ${f.filename} ==========\n${f.code}`)
      .join('\n\n');
    onCopyText('全部專案原始碼', merged);
  };

  const activeFile = blueprintFiles.find((f) => f.id === activeCodeId) ?? blueprintFiles[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            個人化設定與平台架構
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            四款視覺主題切換 · 智慧推播排程 · 合法資料源狀態 · Flutter 與 Codemagic 雲端編譯原始碼下載
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadZip}
          disabled={downloadingZip}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap shrink-0 min-h-[44px] disabled:opacity-60"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: 'var(--accent-primary-fg)',
          }}
        >
          <Download className="w-4 h-4" />
          {downloadingZip ? '打包壓縮中…' : '下載 Flutter + FastAPI 原始碼 (.zip)'}
        </button>
      </div>

      {/* 1. 4 Themes Switcher */}
      <section
        className="rounded-2xl p-5 border space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              介面視覺主題（四款風格自由切換）
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              切換後將即時套用至全站版面與數據圖表，並自動記憶您的偏好
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {THEMES.map((t) => {
            const active = userState.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onThemeChange(t.id)}
                className="p-4 rounded-2xl border text-left transition-all space-y-2.5 min-h-[110px]"
                style={{
                  backgroundColor: active ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                  borderColor: active ? 'var(--accent-primary)' : 'var(--border-hairline)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {t.swatch.map((hex) => (
                      <span
                        key={hex}
                        className="w-4 h-4 rounded-md border border-white/20"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  {active && <Check className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />}
                </div>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {t.name}
                  </div>
                  <div className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                    {t.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Smart Notifications + Membership */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section
          className="rounded-2xl p-5 border space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                智慧通知中心設定
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                設定爆紅話題推播、每日摘要與關鍵字急速竄升提醒
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { key: 'viralAlerts', label: '新興爆紅話題即時通知' },
              { key: 'dailyDigest', label: '每日熱門資訊摘要推播' },
              { key: 'weeklyReport', label: '每週趨勢分析與商機報告' },
              { key: 'rapidRiseAlert', label: '熱度快速上升（+120% 以上）提醒' },
            ].map((item) => {
              const checked = Boolean(userState.notifications[item.key as keyof NotificationSettings]);
              return (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer min-h-[48px]"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-hairline)',
                  }}
                >
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      onUpdateNotifications({ [item.key]: e.target.checked })
                    }
                    className="w-4 h-4 accent-[var(--accent-primary)]"
                  />
                </label>
              );
            })}

            <div
              className="flex items-center justify-between gap-3 p-3 rounded-xl border min-h-[48px]"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-hairline)',
              }}
            >
              <label htmlFor="notify-time" className="text-sm" style={{ color: 'var(--text-primary)' }}>
                自訂每日摘要通知時間
              </label>
              <input
                id="notify-time"
                type="time"
                value={userState.notifications.notifyTime}
                onChange={(e) => onUpdateNotifications({ notifyTime: e.target.value })}
                className="px-2.5 py-1.5 rounded-lg border text-xs font-mono-num"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-hairline)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          </div>
        </section>

        {/* Membership & Monetization */}
        <section
          className="rounded-2xl p-5 border space-y-4"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-hairline)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
              <div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                  會員方案與營利架構
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  已用 AI 額度：{userState.aiQuotaUsed} / {userState.aiQuotaLimit} 次
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onPlanChange('free')}
              className="p-4 rounded-xl border text-left space-y-2"
              style={{
                backgroundColor: userState.plan === 'free' ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                borderColor: userState.plan === 'free' ? 'var(--accent-primary)' : 'var(--border-hairline)',
              }}
            >
              <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                免費版 Free
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                基本熱門排行榜 · 每日 10 次 AI 分析與腳本生成 · 支援 Google AdMob 橫幅／原生廣告位架構
              </div>
            </button>

            <button
              type="button"
              onClick={() => onPlanChange('pro')}
              className="p-4 rounded-xl border text-left space-y-2"
              style={{
                backgroundColor: userState.plan === 'pro' ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                borderColor: userState.plan === 'pro' ? 'var(--accent-primary)' : 'var(--border-hairline)',
              }}
            >
              <div className="text-sm font-bold" style={{ color: 'var(--accent-primary)' }}>
                Trend7 Pro 進階會員
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                200 次 AI 額度 · 完整趨勢圖表 · 無限關鍵字追蹤 · 去除廣告（預留 Google Play 內購訂閱介面）
              </div>
            </button>
          </div>

          <div
            className="rounded-xl p-3.5 border text-xs leading-relaxed"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-hairline)',
              color: 'var(--text-secondary)',
            }}
          >
            商業串接說明：本版本提供方案切換預覽；實際上架 Google Play 時，可於 Flutter 專案中啟用{' '}
            <code className="font-mono-num">google_mobile_ads</code> 與{' '}
            <code className="font-mono-num">in_app_purchase</code> 套件進行正式收費驗證。
          </div>
        </section>
      </div>

      {/* 3. Data Sources Status */}
      <section
        className="rounded-2xl p-5 border space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
              資料來源授權與 API 串接狀態
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              嚴格遵守各平台官方使用條款；未取得授權金鑰之平台明確標示為未串接，絕不虛構即時榜單
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border-hairline)', color: 'var(--text-muted)' }}>
                <th className="py-2.5 pr-3 font-medium">資料來源平台</th>
                <th className="py-2.5 px-3 font-medium">領域</th>
                <th className="py-2.5 px-3 font-medium">連線狀態</th>
                <th className="py-2.5 px-3 font-medium">授權與設定說明</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-hairline)' }}>
              {sources.map((src) => (
                <tr key={src.id} style={{ borderColor: 'var(--border-hairline)' }}>
                  <td className="py-3 pr-3 font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {src.name}
                  </td>
                  <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>
                    {src.category}
                  </td>
                  <td
                    className="py-3 px-3 font-semibold whitespace-nowrap"
                    style={{ color: src.status === 'connected' ? 'var(--positive)' : 'var(--warning)' }}
                  >
                    {src.status === 'connected' ? `即時連線中 (${src.itemCount})` : '尚未串接金鑰'}
                  </td>
                  <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>
                    <div>{src.authRequirement}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {src.note}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Flutter + FastAPI + GitHub + Codemagic Mobile Build Blueprint */}
      <section
        className="rounded-2xl p-5 border space-y-4"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-hairline)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Flutter Android 原生專案原始碼與 Codemagic 雲端編譯教學
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                只用 Android 手機也能完成：GitHub 推送程式碼 → Codemagic 雲端建置 → 下載安裝 APK
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyAllSource}
              className="px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 whitespace-nowrap min-h-[42px]"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-hairline)',
                color: 'var(--text-primary)',
              }}
            >
              <Copy className="w-3.5 h-3.5" />
              複製全部檔案
            </button>
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap min-h-[42px] disabled:opacity-60"
              style={{
                backgroundColor: 'var(--accent-primary)',
                color: 'var(--accent-primary-fg)',
              }}
            >
              <Download className="w-4 h-4" />
              {downloadingZip ? '打包中…' : '下載完整專案 (.zip)'}
            </button>
          </div>
        </div>

        <ol
          className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          <li
            className="p-3.5 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-hairline)' }}
          >
            <strong className="block mb-1" style={{ color: 'var(--text-primary)' }}>
              步驟 1：建立 GitHub 儲存庫
            </strong>
            使用手機瀏覽器登入 GitHub 建立新 Repository，將下方 Flutter 前端、FastAPI 後端與 codemagic.yaml 上傳至 main 分支。
          </li>
          <li
            className="p-3.5 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-hairline)' }}
          >
            <strong className="block mb-1" style={{ color: 'var(--text-primary)' }}>
              步驟 2：綁定 Codemagic 雲端編譯
            </strong>
            登入 Codemagic 選擇該 GitHub 專案，系統會自動讀取根目錄的 codemagic.yaml 並於雲端 macOS 主機執行 flutter build apk。
          </li>
          <li
            className="p-3.5 rounded-xl border"
            style={{ backgroundColor: 'var(--bg-surface-elevated)', borderColor: 'var(--border-hairline)' }}
          >
            <strong className="block mb-1" style={{ color: 'var(--text-primary)' }}>
              步驟 3：手機下載 APK 安裝測試
            </strong>
            建置完成後直接於手機點擊 Artifacts 產出的 app-release.apk 下載並安裝，後端 FastAPI 可部署於 Cloud Run / Render。
          </li>
        </ol>

        {blueprintFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {blueprintFiles.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveCodeId(file.id)}
                  className="px-3.5 py-2 rounded-xl border text-xs font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5 min-h-[38px]"
                  style={{
                    backgroundColor: activeCodeId === file.id ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                    borderColor: activeCodeId === file.id ? 'var(--accent-primary)' : 'var(--border-hairline)',
                    color: activeCodeId === file.id ? 'var(--accent-primary-fg)' : 'var(--text-secondary)',
                  }}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  {file.filename}
                </button>
              ))}
            </div>

            {activeFile && (
              <div
                className="rounded-xl border overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderColor: 'var(--border-hairline)',
                }}
              >
                <div
                  className="px-4 py-2.5 border-b flex items-center justify-between gap-3"
                  style={{ borderColor: 'var(--border-hairline)' }}
                >
                  <div className="text-xs">
                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {activeFile.stack}
                    </span>
                    <span className="mx-2" style={{ color: 'var(--text-muted)' }}>·</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{activeFile.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onCopyText(activeFile.filename, activeFile.code);
                      setCopiedId(activeFile.id);
                      setTimeout(() => setCopiedId(null), 1600);
                    }}
                    className="px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 shrink-0"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-hairline)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {copiedId === activeFile.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === activeFile.id ? '已複製' : '複製原始碼'}
                  </button>
                </div>
                <pre
                  className="p-4 text-xs font-mono-num overflow-x-auto max-h-80 leading-relaxed"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {activeFile.code}
                </pre>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
