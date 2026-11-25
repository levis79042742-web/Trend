import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { analyzeTrendWithGemini, generateShortVideoWithGemini } from './server/aiService.js';
import { BLUEPRINT_FILES } from './server/blueprintSource.js';
import { buildZipBuffer } from './server/zipBuilder.js';
import {
  addSearchHistory,
  clearSearchHistory,
  getCommerceOpportunities,
  getTrendsPayload,
  getUserState,
  incrementAiQuota,
  markAllAlertsRead,
  removeSavedScript,
  saveGeneratedScript,
  startHourlyTrendScheduler,
  syncRegionTrends,
  toggleSavedProduct,
  toggleSavedTrend,
  toggleTrackedKeyword,
  updateUserPreferences,
} from './server/trendEngine.js';
import type { RegionCode, ThemeId, TimeRange } from './src/types/trend.js';

const VALID_REGIONS = new Set<RegionCode>(['TW', 'JP', 'KR', 'US', 'GLOBAL']);
const VALID_RANGES = new Set<TimeRange>(['today', '24h', '7d', '30d']);
const VALID_THEMES = new Set<ThemeId>(['cyber-night', 'clean-white', 'trend-purple', 'future-blue']);

function parseRegion(raw: unknown): RegionCode {
  if (typeof raw === 'string' && VALID_REGIONS.has(raw as RegionCode)) {
    return raw as RegionCode;
  }
  return 'TW';
}

function parseRange(raw: unknown): TimeRange {
  if (typeof raw === 'string' && VALID_RANGES.has(raw as TimeRange)) {
    return raw as TimeRange;
  }
  return 'today';
}

const REGION_LABEL: Record<RegionCode, string> = {
  TW: '台灣',
  JP: '日本',
  KR: '韓國',
  US: '美國',
  GLOBAL: '全球',
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '1mb' }));

  // Live Trends & History API
  app.get('/api/trends', async (req, res) => {
    try {
      const region = parseRegion(req.query.region);
      const timeRange = parseRange(req.query.range);
      const payload = await getTrendsPayload(region, timeRange);
      const opportunities = getCommerceOpportunities(region, payload.items);
      res.json({ ...payload, opportunities });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : '取得熱門趨勢資料失敗',
      });
    }
  });

  app.post('/api/trends/refresh', async (req, res) => {
    try {
      const region = parseRegion(req.body?.region);
      const payload = await syncRegionTrends(region, true);
      const opportunities = getCommerceOpportunities(region, payload.items);
      res.json({ ...payload, opportunities });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : '手動更新即時趨勢失敗',
      });
    }
  });

  // AI Smart Analysis (Server-side Gemini API)
  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const topicTitle = typeof req.body?.topicTitle === 'string' ? req.body.topicTitle.trim() : '';
      const contextSummary = typeof req.body?.contextSummary === 'string' ? req.body.contextSummary.trim() : '';
      const categoryLabel = typeof req.body?.categoryLabel === 'string' ? req.body.categoryLabel.trim() : '熱門趨勢';
      const region = parseRegion(req.body?.region);

      if (!topicTitle) {
        res.status(400).json({ error: '請提供欲分析的熱門話題名稱。' });
        return;
      }

      const quota = incrementAiQuota();
      if (!quota.allowed) {
        res.status(429).json({
          error: '免費版每日 AI 分析額度已達上限（10 次），可於設定頁切換為 Trend7 Pro 預覽體驗完整額度。',
          userState: quota.userState,
        });
        return;
      }

      const analysis = await analyzeTrendWithGemini({
        topicTitle,
        contextSummary: contextSummary || topicTitle,
        regionLabel: REGION_LABEL[region],
        categoryLabel,
      });

      res.json({ analysis, userState: quota.userState });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'AI 分析請求失敗，請稍後重試。',
      });
    }
  });

  // Short Video Creator Assistant (Server-side Gemini API)
  app.post('/api/ai/short-video', async (req, res) => {
    try {
      const topicTitle = typeof req.body?.topicTitle === 'string' ? req.body.topicTitle.trim() : '';
      const productFocus = typeof req.body?.productFocus === 'string' ? req.body.productFocus.trim() : '';
      const tone = typeof req.body?.tone === 'string' ? req.body.tone.trim() : '';
      const region = parseRegion(req.body?.region);

      if (!topicTitle) {
        res.status(400).json({ error: '請輸入或選擇一個熱門話題以生成短影音腳本。' });
        return;
      }

      const quota = incrementAiQuota();
      if (!quota.allowed) {
        res.status(429).json({
          error: '免費版 AI 創作額度已達上限，可於設定頁升級為 Trend7 Pro 預覽版。',
          userState: quota.userState,
        });
        return;
      }

      const scriptPackage = await generateShortVideoWithGemini({
        topicTitle,
        productFocus: productFocus || undefined,
        tone: tone || undefined,
        regionLabel: REGION_LABEL[region],
      });

      res.json({ scriptPackage, userState: quota.userState });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : '短影音腳本生成失敗，請稍後重試。',
      });
    }
  });

  // User State, Preferences, Bookmarks & Alerts
  app.get('/api/user', (_req, res) => {
    res.json(getUserState());
  });

  app.patch('/api/user/preferences', (req, res) => {
    const theme = VALID_THEMES.has(req.body?.theme) ? (req.body.theme as ThemeId) : undefined;
    const region = VALID_REGIONS.has(req.body?.region) ? (req.body.region as RegionCode) : undefined;
    const plan = req.body?.plan === 'free' || req.body?.plan === 'pro' ? req.body.plan : undefined;
    const notifications = req.body?.notifications && typeof req.body.notifications === 'object'
      ? req.body.notifications
      : undefined;

    const updated = updateUserPreferences({ theme, region, plan, notifications });
    res.json(updated);
  });

  app.post('/api/user/search-history', (req, res) => {
    const keyword = typeof req.body?.keyword === 'string' ? req.body.keyword : '';
    res.json(addSearchHistory(keyword));
  });

  app.delete('/api/user/search-history', (_req, res) => {
    res.json(clearSearchHistory());
  });

  app.post('/api/user/tracked-keywords', (req, res) => {
    const keyword = typeof req.body?.keyword === 'string' ? req.body.keyword : '';
    res.json(toggleTrackedKeyword(keyword));
  });

  app.post('/api/user/bookmarks/trends', (req, res) => {
    const item = req.body?.item;
    if (!item || typeof item.title !== 'string') {
      res.status(400).json({ error: '無效的話題資料' });
      return;
    }
    res.json(toggleSavedTrend(item));
  });

  app.post('/api/user/bookmarks/products', (req, res) => {
    const product = req.body?.product;
    if (!product || typeof product.id !== 'string') {
      res.status(400).json({ error: '無效的商品資料' });
      return;
    }
    res.json(toggleSavedProduct(product));
  });

  app.post('/api/user/bookmarks/scripts', (req, res) => {
    const pkg = req.body?.scriptPackage;
    if (!pkg || typeof pkg.id !== 'string') {
      res.status(400).json({ error: '無效的腳本資料' });
      return;
    }
    res.json(saveGeneratedScript(pkg));
  });

  app.delete('/api/user/bookmarks/scripts/:id', (req, res) => {
    res.json(removeSavedScript(req.params.id));
  });

  app.post('/api/user/alerts/read', (_req, res) => {
    res.json(markAllAlertsRead());
  });

  // Flutter + FastAPI + Codemagic Blueprint Files
  app.get('/api/blueprint', (_req, res) => {
    res.json({ files: BLUEPRINT_FILES });
  });

  app.get('/api/blueprint/download', (_req, res) => {
    const entries: Array<{ path: string; content: string | Buffer }> = BLUEPRINT_FILES.map((file) => ({
      path: file.filename,
      content: file.code,
    }));
    const logoPath = path.resolve(
      process.cwd(),
      'public',
      'assets',
      'aistudio',
      'file_000000001cb481fd82c66beb10659b10_b14ed9f1.png'
    );
    if (fs.existsSync(logoPath)) {
      entries.push({
        path: 'flutter_app/assets/images/trend7_logo.png',
        content: fs.readFileSync(logoPath),
      });
    }
    const zipBuffer = buildZipBuffer(entries);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="trend7_flutter_fastapi_source.zip"');
    res.send(zipBuffer);
  });

  // Vite Dev Middleware or Production Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trend7 server listening on http://0.0.0.0:${PORT}`);
    startHourlyTrendScheduler();
  });
}

startServer().catch((err) => {
  console.error('Failed to start Trend7 server:', err);
  process.exit(1);
});
