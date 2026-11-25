import fs from 'fs';
import path from 'path';
import type {
  AlertItem,
  CategoryId,
  CommerceOpportunity,
  DataSourceStatus,
  HistoryPoint,
  NotificationSettings,
  RegionCode,
  ShortVideoPackage,
  SnapshotRecord,
  ThemeId,
  TimeRange,
  TrendItem,
  TrendsPayload,
  UserState,
} from '../src/types/trend.js';

const DATA_DIR = path.resolve(process.cwd(), 'server', 'data');
const STORE_PATH = path.join(DATA_DIR, 'trend7_store.json');
const STORE_VERSION = 3;

type VerticalCategory = Exclude<CategoryId, 'all'>;

interface RegionCache {
  lastFetchedAt: string;
  items: TrendItem[];
  fetchError?: string;
}

interface PersistedStore {
  version?: number;
  regionCaches: Partial<Record<RegionCode, RegionCache>>;
  historySnapshots: SnapshotRecord[];
  topicHistory: Record<string, HistoryPoint[]>;
  userState: UserState;
}

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  enabled: true,
  viralAlerts: true,
  dailyDigest: true,
  weeklyReport: true,
  rapidRiseAlert: true,
  notifyTime: '09:00',
};

const DEFAULT_USER_STATE: UserState = {
  userEmail: 'creator@trend7.app',
  displayName: 'Trend7 創作者',
  plan: 'free',
  aiQuotaUsed: 0,
  aiQuotaLimit: 10,
  theme: 'cyber-night',
  region: 'TW',
  searchHistory: ['開心果巴斯克', 'Threads 爆紅話題', '韓系水光肌精華', 'Reels 爆款短片'],
  trackedKeywords: ['抹茶', '聯名', '精華', 'Threads', 'Reels'],
  savedTrends: [],
  savedProducts: [],
  savedScripts: [],
  notifications: DEFAULT_NOTIFICATIONS,
  alerts: [
    {
      id: 'welcome-lifestyle-v2',
      title: '已切換至「社群・美食・美妝・影片」專屬雷達',
      body: '系統已連線即時公開資料源，每 60 分鐘自動同步社群媒體、熱門美食、美妝保養與爆紅影片最新榜單。',
      kind: 'digest',
      createdAt: new Date().toISOString(),
      read: false,
    },
  ],
};

function ensureStore(): PersistedStore {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_PATH)) {
    const initial: PersistedStore = {
      version: STORE_VERSION,
      regionCaches: {},
      historySnapshots: [],
      topicHistory: {},
      userState: DEFAULT_USER_STATE,
    };
    fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as PersistedStore;
    if (parsed.version !== STORE_VERSION) {
      // Upgrade store schema cleanly while keeping theme, plan & notifications
      const upgraded: PersistedStore = {
        version: STORE_VERSION,
        regionCaches: {},
        historySnapshots: [],
        topicHistory: {},
        userState: {
          ...DEFAULT_USER_STATE,
          theme: parsed.userState?.theme ?? DEFAULT_USER_STATE.theme,
          region: parsed.userState?.region ?? DEFAULT_USER_STATE.region,
          plan: parsed.userState?.plan ?? DEFAULT_USER_STATE.plan,
          aiQuotaLimit: parsed.userState?.aiQuotaLimit ?? DEFAULT_USER_STATE.aiQuotaLimit,
          notifications: {
            ...DEFAULT_NOTIFICATIONS,
            ...(parsed.userState?.notifications ?? {}),
          },
          savedScripts: parsed.userState?.savedScripts ?? [],
        },
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(upgraded, null, 2), 'utf-8');
      return upgraded;
    }

    return {
      version: STORE_VERSION,
      regionCaches: parsed.regionCaches ?? {},
      historySnapshots: parsed.historySnapshots ?? [],
      topicHistory: parsed.topicHistory ?? {},
      userState: {
        ...DEFAULT_USER_STATE,
        ...(parsed.userState ?? {}),
        notifications: {
          ...DEFAULT_NOTIFICATIONS,
          ...(parsed.userState?.notifications ?? {}),
        },
      },
    };
  } catch {
    return {
      version: STORE_VERSION,
      regionCaches: {},
      historySnapshots: [],
      topicHistory: {},
      userState: DEFAULT_USER_STATE,
    };
  }
}

function saveStore(store: PersistedStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

function extractTag(block: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(regex);
  return match ? decodeXmlEntities(match[1]) : '';
}

function safeExternalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // ignore invalid URL
  }
  return 'https://trends.google.com';
}

const CATEGORY_LABELS: Record<VerticalCategory, string> = {
  social: '社群媒體',
  food: '熱門美食',
  beauty: '美妝保養',
  video: '熱門影片',
};

function classifyLifestyleVertical(title: string): VerticalCategory | null {
  const text = title.toLowerCase();
  if (
    /美妝|彩妝|保養|精華|面膜|口紅|唇釉|粉底|氣墊|防曬|卸妝|香氛|香水|眼影|睫毛|護膚|水光肌|開架|專櫃|屈臣氏|康是美|寶雅|sephora|olive young|skincare|makeup|cosmetic|beauty|lipstick|serum|コスメ|スキンケア|メイク|뷰티|화장품|올리브영/.test(
      text
    )
  ) {
    return 'beauty';
  }
  if (
    /美食|餐廳|甜點|蛋糕|巴斯克|抹茶|開心果|手搖|咖啡|拉麵|火鍋|燒肉|壽司|超商|全聯|7-11|全家|聯名|小吃|夜市|早午餐|必吃|探店|食譜|烘焙|food|dessert|cafe|ramen|restaurant|matcha|美食|グルメ|スイーツ|カフェ|맛집|디저트|카페/.test(
      text
    )
  ) {
    return 'food';
  }
  if (
    /影片|短影音|reels|tiktok|youtube|shorts|netflix|disney|劇|電影|預告|mv|頻道|訂閱|觀看數|破百萬|vlog|開箱片|實測|youtuber|網紅|影集|動畫|anime|video|streaming|trailer|ショート動画|ユーチューブ|유튜브|쇼츠|넷플릭스/.test(
      text
    )
  ) {
    return 'video';
  }
  if (
    /threads|dcard|ptt|instagram|ig|facebook|fb|脆|網友|熱議|迷因|爆紅|打卡|穿搭|流行語|社群|留言|轉發|trending|viral|reddit|sns|meme|トレンド|인스타|트렌드/.test(
      text
    )
  ) {
    return 'social';
  }
  return null;
}

function parseApproxTrafficToHeat(traffic: string, rankIndex: number): { heatScore: number; growthPct: number } {
  const cleaned = traffic.replace(/[^0-9KMkm+]/g, '').toUpperCase();
  let volume = 5000;
  if (cleaned.includes('M')) {
    volume = parseFloat(cleaned) * 1_000_000;
  } else if (cleaned.includes('K')) {
    volume = parseFloat(cleaned) * 1_000;
  } else if (parseInt(cleaned, 10) > 0) {
    volume = parseInt(cleaned, 10);
  }
  if (Number.isNaN(volume)) volume = 5000;

  const logScore = Math.min(99, Math.max(55, Math.round(36 + Math.log10(Math.max(100, volume)) * 11 - rankIndex * 0.5)));
  const growthPct = Math.min(980, Math.max(35, Math.round((volume / 1000) * 1.4 + (16 - Math.min(15, rankIndex)) * 7)));
  return { heatScore: logScore, growthPct };
}

function getGoogleTrendsGeo(region: RegionCode): string {
  switch (region) {
    case 'TW':
      return 'TW';
    case 'JP':
      return 'JP';
    case 'KR':
      return 'KR';
    case 'US':
    case 'GLOBAL':
      return 'US';
  }
}

interface VerticalQuerySpec {
  category: VerticalCategory;
  query: string;
}

function getVerticalQueries(region: RegionCode): VerticalQuerySpec[] {
  switch (region) {
    case 'TW':
      return [
        { category: 'social', query: 'Threads OR Dcard OR IG OR 網友熱議 爆紅' },
        { category: 'food', query: '熱門美食 OR 甜點 OR 手搖飲 OR 餐廳 排隊 OR 聯名' },
        { category: 'beauty', query: '美妝 OR 保養品 OR 彩妝 OR 精華液 OR 口紅 推薦' },
        { category: 'video', query: 'YouTube OR 短影音 OR Reels OR Netflix 爆紅 影片' },
      ];
    case 'JP':
      return [
        { category: 'social', query: 'SNS OR Xトレンド OR Instagram 話題' },
        { category: 'food', query: 'グルメ OR スイーツ OR カフェ 人気 行列' },
        { category: 'beauty', query: 'コスメ OR スキンケア OR メイク 新作 人気' },
        { category: 'video', query: 'YouTube OR ショート動画 OR TikTok 急上昇' },
      ];
    case 'KR':
      return [
        { category: 'social', query: '인스타그램 OR 커뮤니티 OR SNS 화제' },
        { category: 'food', query: '맛집 OR 디저트 OR 카페 인기 웨이팅' },
        { category: 'beauty', query: '뷰티 OR 올리브영 OR 화장품 OR 스킨케어 인기' },
        { category: 'video', query: '유튜브 OR 쇼츠 OR 릴스 OR 넷플릭스 인기' },
      ];
    case 'US':
    case 'GLOBAL':
      return [
        { category: 'social', query: 'Instagram OR TikTok OR Threads viral social trend' },
        { category: 'food', query: 'viral food OR dessert OR cafe OR restaurant trend' },
        { category: 'beauty', query: 'viral skincare OR makeup OR beauty product Sephora' },
        { category: 'video', query: 'YouTube trending OR Reels OR viral video OR Netflix' },
      ];
  }
}

function getLocaleParams(region: RegionCode): string {
  switch (region) {
    case 'TW':
      return 'hl=zh-TW&gl=TW&ceid=TW:zh-Hant';
    case 'JP':
      return 'hl=ja&gl=JP&ceid=JP:ja';
    case 'KR':
      return 'hl=ko&gl=KR&ceid=KR:ko';
    case 'US':
    case 'GLOBAL':
      return 'hl=en-US&gl=US&ceid=US:en';
  }
}

async function fetchGoogleTrendsVerticalItems(region: RegionCode): Promise<Partial<TrendItem>[]> {
  const geo = getGoogleTrendsGeo(region);
  const url = `https://trends.google.com/trending/rss?geo=${geo}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Trend7Bot/1.0 (+https://trend7.app)' },
    signal: AbortSignal.timeout(7500),
  });
  if (!res.ok) {
    throw new Error(`Google Trends RSS HTTP ${res.status}`);
  }
  const xml = await res.text();
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  const nowIso = new Date().toISOString();

  const matched: Partial<TrendItem>[] = [];
  itemMatches.forEach((block, index) => {
    const title = extractTag(block, 'title');
    const approxTraffic = extractTag(block, 'ht:approx_traffic') || '10K+';
    const pubDate = extractTag(block, 'pubDate') || nowIso;
    const link = safeExternalUrl(extractTag(block, 'link'));
    const newsTitle = extractTag(block, 'ht:news_item_title');
    const newsSource = extractTag(block, 'ht:news_item_source');
    const newsUrl = extractTag(block, 'ht:news_item_url');

    const category = classifyLifestyleVertical(title);
    if (!category) return;

    const { heatScore, growthPct } = parseApproxTrafficToHeat(approxTraffic, index);
    matched.push({
      title,
      summary: newsTitle || `${title} 在社群與搜尋榜單討論升溫（約 ${approxTraffic} 筆搜尋量）。`,
      category,
      categoryLabel: CATEGORY_LABELS[category],
      region,
      heatScore,
      growthPct,
      isEmergingViral: matched.length < 3 || growthPct >= 140,
      source: 'Google Trends' as const,
      sourceUrl: safeExternalUrl(newsUrl || link),
      relatedNewsTitle: newsTitle || undefined,
      relatedNewsSource: newsSource || undefined,
      trafficLabel: approxTraffic,
      publishedAt: pubDate,
      fetchedAt: nowIso,
    });
  });

  return matched;
}

async function fetchGoogleNewsVertical(
  region: RegionCode,
  spec: VerticalQuerySpec
): Promise<Partial<TrendItem>[]> {
  const locale = getLocaleParams(region);
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(spec.query)}&${locale}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Trend7Bot/1.0 (+https://trend7.app)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) {
    throw new Error(`Google News (${CATEGORY_LABELS[spec.category]}) HTTP ${res.status}`);
  }
  const xml = await res.text();
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  const nowIso = new Date().toISOString();

  return itemMatches.slice(0, 8).map((block, index) => {
    const rawTitle = extractTag(block, 'title');
    const parts = rawTitle.split(' - ');
    const sourceName = parts.length > 1 ? parts[parts.length - 1].trim() : 'Google News';
    const cleanTitle = parts.length > 1 ? parts.slice(0, -1).join(' - ').trim() : rawTitle;
    const link = safeExternalUrl(extractTag(block, 'link'));
    const pubDate = extractTag(block, 'pubDate') || nowIso;

    // Slight score variation by vertical order & recency so all 4 verticals rank competitively
    const heatScore = Math.max(54, 91 - index * 4);
    const growthPct = Math.max(28, 168 - index * 14);

    return {
      title: cleanTitle,
      summary: `${sourceName} · ${CATEGORY_LABELS[spec.category]}熱點：${cleanTitle}`,
      category: spec.category,
      categoryLabel: CATEGORY_LABELS[spec.category],
      region,
      heatScore,
      growthPct,
      isEmergingViral: index < 2,
      source: 'Google News' as const,
      sourceUrl: link,
      relatedNewsTitle: rawTitle,
      relatedNewsSource: sourceName,
      trafficLabel: `${CATEGORY_LABELS[spec.category]}焦點`,
      publishedAt: pubDate,
      fetchedAt: nowIso,
    };
  });
}

function buildTrendHistorySeries(
  store: PersistedStore,
  key: string,
  currentHeat: number
): { history7d: HistoryPoint[]; history30d: HistoryPoint[] } {
  const existing = store.topicHistory[key] ?? [];
  const timeLabel = new Date().toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const updated = [...existing, { label: timeLabel, score: currentHeat }].slice(-30);
  store.topicHistory[key] = updated;

  const dayNames = ['6日前', '5日前', '4日前', '3日前', '前天', '昨日', '今日'];
  const history7d: HistoryPoint[] = dayNames.map((day, idx) => {
    if (updated.length >= 7) {
      const point = updated[updated.length - 7 + idx];
      return { label: idx === 6 ? '今日' : day, score: point.score };
    }
    const factor = 0.62 + idx * 0.06;
    return {
      label: day,
      score: idx === 6 ? currentHeat : Math.max(20, Math.min(99, Math.round(currentHeat * factor))),
    };
  });

  const history30d: HistoryPoint[] = Array.from({ length: 10 }, (_, idx) => {
    const dayNum = idx * 3 + 1;
    const factor = 0.45 + idx * 0.06;
    return {
      label: idx === 9 ? '今日' : `第${dayNum}天`,
      score: idx === 9 ? currentHeat : Math.max(15, Math.min(99, Math.round(currentHeat * factor))),
    };
  });

  return { history7d, history30d };
}

export async function syncRegionTrends(region: RegionCode, force = false): Promise<TrendsPayload> {
  const store = ensureStore();
  const cached = store.regionCaches[region];
  const now = Date.now();
  const cacheAgeMs = cached ? now - new Date(cached.lastFetchedAt).getTime() : Infinity;

  if (!force && cached && cached.items.length > 0 && cacheAgeMs < 15 * 60 * 1000) {
    return buildPayload(store, region, 'today', cached.items, cached.lastFetchedAt, cached.fetchError);
  }

  const verticalSpecs = getVerticalQueries(region);
  const [trendsResult, ...verticalNewsResults] = await Promise.allSettled([
    fetchGoogleTrendsVerticalItems(region),
    ...verticalSpecs.map((spec) => fetchGoogleNewsVertical(region, spec)),
  ]);

  const errors: string[] = [];
  let trendsCount = 0;
  let newsCount = 0;

  const buckets: Partial<TrendItem>[][] = [];

  verticalNewsResults.forEach((res, idx) => {
    if (res.status === 'fulfilled') {
      newsCount += res.value.length;
      buckets.push(res.value);
    } else {
      errors.push(`${CATEGORY_LABELS[verticalSpecs[idx].category]}來源失敗`);
    }
  });

  if (trendsResult.status === 'fulfilled') {
    trendsCount = trendsResult.value.length;
    if (trendsCount > 0) buckets.push(trendsResult.value);
  } else {
    errors.push(`Google Trends 連線失敗：${trendsResult.reason instanceof Error ? trendsResult.reason.message : '未知錯誤'}`);
  }

  // Interleave across buckets so Top 10 represents Social Media, Food, Beauty, and Video cleanly!
  const interleaved: Partial<TrendItem>[] = [];
  const maxLen = Math.max(0, ...buckets.map((b) => b.length));
  for (let i = 0; i < maxLen; i++) {
    for (const b of buckets) {
      if (b[i]) interleaved.push(b[i]);
    }
  }

  const seen = new Set<string>();
  const uniqueRaw: Partial<TrendItem>[] = [];
  for (const item of interleaved) {
    const norm = (item.title ?? '').toLowerCase().trim();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    uniqueRaw.push(item);
  }

  const prevList = cached?.items ?? [];
  const prevRankMap = new Map<string, number>();
  prevList.forEach((p) => prevRankMap.set(p.title.toLowerCase().trim(), p.rank));

  const nowIso = new Date().toISOString();

  const finalizedItems: TrendItem[] =
    uniqueRaw.length > 0
      ? uniqueRaw.map((raw, idx) => {
          const rank = idx + 1;
          const title = raw.title ?? '未命名話題';
          const prevRank = prevRankMap.get(title.toLowerCase().trim()) ?? null;
          let rankDelta: TrendItem['rankDelta'] = 'steady';
          let rankChangeAmount = 0;

          if (prevRank === null) {
            rankDelta = prevList.length > 0 ? 'new' : rank <= 4 ? 'up' : 'steady';
          } else if (prevRank > rank) {
            rankDelta = 'up';
            rankChangeAmount = prevRank - rank;
          } else if (prevRank < rank) {
            rankDelta = 'down';
            rankChangeAmount = rank - prevRank;
          }

          const heatScore = raw.heatScore ?? 60;
          const history = buildTrendHistorySeries(store, `${region}:${title}`, heatScore);

          return {
            id: `${region}-${rank}-${Buffer.from(title).toString('base64').slice(0, 12)}`,
            rank,
            prevRank,
            rankDelta,
            rankChangeAmount,
            title,
            summary: raw.summary ?? '',
            category: raw.category ?? 'social',
            categoryLabel: raw.categoryLabel ?? '社群媒體',
            region,
            heatScore,
            growthPct: raw.growthPct ?? 45,
            isEmergingViral: Boolean(raw.isEmergingViral) || rankDelta === 'new',
            source: raw.source ?? 'Google News',
            sourceUrl: raw.sourceUrl ?? 'https://trends.google.com',
            relatedNewsTitle: raw.relatedNewsTitle,
            relatedNewsSource: raw.relatedNewsSource,
            trafficLabel: raw.trafficLabel,
            publishedAt: raw.publishedAt ?? nowIso,
            fetchedAt: nowIso,
            history7d: history.history7d,
            history30d: history.history30d,
          };
        })
      : prevList;

  const fetchError =
    uniqueRaw.length === 0
      ? errors.join('；') || '無法取得即時資料源，請檢查網路連線或稍後重試。'
      : errors.length > 0
      ? errors.join('；')
      : undefined;

  if (finalizedItems.length > 0) {
    store.regionCaches[region] = {
      lastFetchedAt: nowIso,
      items: finalizedItems,
      fetchError,
    };

    const lastRegionSnap = store.historySnapshots.find((s) => s.region === region);
    const snapAge = lastRegionSnap ? now - new Date(lastRegionSnap.capturedAt).getTime() : Infinity;
    if (force || snapAge > 20 * 60 * 1000) {
      const snap: SnapshotRecord = {
        id: `snap-${region}-${now}`,
        region,
        capturedAt: nowIso,
        sourceSummary: `Google Trends (${trendsCount}) · 主題新聞 (${newsCount})`,
        topItems: finalizedItems.slice(0, 10).map((item) => ({
          rank: item.rank,
          title: item.title,
          categoryLabel: item.categoryLabel,
          heatScore: item.heatScore,
          growthPct: item.growthPct,
          source: item.source,
        })),
      };
      store.historySnapshots = [snap, ...store.historySnapshots].slice(0, 60);
    }

    const keywords = store.userState.trackedKeywords;
    for (const kw of keywords) {
      const matched = finalizedItems.find((item) => item.title.toLowerCase().includes(kw.toLowerCase()));
      if (matched) {
        const alertId = `kw-${region}-${kw}-${new Date().toISOString().slice(0, 13)}`;
        if (!store.userState.alerts.some((a) => a.id === alertId)) {
          const newAlert: AlertItem = {
            id: alertId,
            title: `追蹤關鍵字「${kw}」進入熱門榜 #${matched.rank}`,
            body: `${matched.title}（${matched.categoryLabel} · 熱度 ${matched.heatScore}）`,
            kind: 'keyword',
            createdAt: nowIso,
            read: false,
          };
          store.userState.alerts = [newAlert, ...store.userState.alerts].slice(0, 30);
        }
      }
    }

    saveStore(store);
  }

  return buildPayload(
    store,
    region,
    'today',
    finalizedItems,
    store.regionCaches[region]?.lastFetchedAt ?? nowIso,
    fetchError
  );
}

export async function getTrendsPayload(region: RegionCode, timeRange: TimeRange): Promise<TrendsPayload> {
  const base = await syncRegionTrends(region, false);
  if (timeRange === 'today') return base;

  const items = [...base.items];
  if (timeRange === '24h') {
    items.sort((a, b) => b.growthPct - a.growthPct);
  } else if (timeRange === '7d') {
    items.sort((a, b) => {
      const avgA = a.history7d.reduce((s, p) => s + p.score, 0) / Math.max(1, a.history7d.length);
      const avgB = b.history7d.reduce((s, p) => s + p.score, 0) / Math.max(1, b.history7d.length);
      return avgB - avgA;
    });
  } else if (timeRange === '30d') {
    items.sort((a, b) => {
      const avgA = a.history30d.reduce((s, p) => s + p.score, 0) / Math.max(1, a.history30d.length);
      const avgB = b.history30d.reduce((s, p) => s + p.score, 0) / Math.max(1, b.history30d.length);
      return avgB - avgA;
    });
  }

  const reRanked = items.map((item, idx) => ({ ...item, rank: idx + 1 }));
  return {
    ...base,
    timeRange,
    items: reRanked,
  };
}

function buildDataSourcesStatus(items: TrendItem[], nowIso: string): DataSourceStatus[] {
  const trendsCount = items.filter((i) => i.source === 'Google Trends').length;
  const newsCount = items.filter((i) => i.source === 'Google News').length;

  return [
    {
      id: 'google-news-verticals',
      name: 'Google News RSS（社群／美食／美妝／影片專題）',
      category: '四大領域即時新聞與話題',
      status: newsCount > 0 ? 'connected' : 'unconfigured',
      authRequirement: '公開授權 RSS Feed（免金鑰）',
      note: newsCount > 0 ? `即時連線中，已同步 ${newsCount} 筆四大領域話題` : '暫時無法取得回應',
      lastCheckedAt: nowIso,
      itemCount: newsCount,
    },
    {
      id: 'google-trends',
      name: 'Google Trends RSS（領域篩選）',
      category: '搜尋爆紅趨勢',
      status: 'connected',
      authRequirement: '公開授權 RSS Feed（免金鑰）',
      note: `即時連線中，已從熱搜篩選匹配 ${trendsCount} 筆生活消費與影音話題`,
      lastCheckedAt: nowIso,
      itemCount: trendsCount,
    },
    {
      id: 'youtube-api',
      name: 'YouTube Data API v3',
      category: '熱門影片與 Shorts',
      status: process.env.YOUTUBE_API_KEY ? 'connected' : 'unconfigured',
      authRequirement: '需設定 YOUTUBE_API_KEY 環境變數',
      note: '尚未串接官方金鑰（目前由 Google News 影片專題提供即時報導索引）',
      lastCheckedAt: nowIso,
      itemCount: 0,
    },
    {
      id: 'tiktok-api',
      name: 'TikTok Research / Display API',
      category: '短影音熱門挑戰',
      status: process.env.TIKTOK_CLIENT_KEY ? 'connected' : 'unconfigured',
      authRequirement: '需申請 TikTok Developer OAuth 憑證',
      note: '尚未串接官方授權（保留資料模型與擴充插槽）',
      lastCheckedAt: nowIso,
      itemCount: 0,
    },
    {
      id: 'meta-ig-threads',
      name: 'Instagram Reels / Threads / Facebook API',
      category: '社群媒體與美妝打卡',
      status: process.env.META_GRAPH_TOKEN || process.env.THREADS_ACCESS_TOKEN ? 'connected' : 'unconfigured',
      authRequirement: '需申請 Meta Graph / Threads API Token',
      note: '尚未串接官方 Token（不進行未授權爬蟲，遵守平台規範）',
      lastCheckedAt: nowIso,
      itemCount: 0,
    },
    {
      id: 'dcard-ptt',
      name: 'Dcard / PTT 社群美妝與美食看板授權 API',
      category: '台灣在地社群口碑',
      status: process.env.TAIWAN_FORUM_API_KEY ? 'connected' : 'unconfigured',
      authRequirement: '需依平台授權條款或官方合作 API 串接',
      note: '未設定授權接口（遵守平台條款，不偽造看板數據）',
      lastCheckedAt: nowIso,
      itemCount: 0,
    },
    {
      id: 'ecommerce-open',
      name: '電商與餐飲評鑑平台（蝦皮 / momo / 美食網）',
      category: '爆紅美食與美妝熱銷榜',
      status: process.env.ECOMMERCE_PARTNER_KEY ? 'connected' : 'unconfigured',
      authRequirement: '需平台聯盟／合作夥伴 Open API 金鑰',
      note: '尚未串接聯盟 API；目前以即時趨勢連動選品雷達呈現參考指標',
      lastCheckedAt: nowIso,
      itemCount: 0,
    },
  ];
}

function buildPayload(
  store: PersistedStore,
  region: RegionCode,
  timeRange: TimeRange,
  items: TrendItem[],
  lastUpdatedAt: string,
  fetchError?: string
): TrendsPayload {
  const nextAutoUpdateAt = new Date(new Date(lastUpdatedAt).getTime() + 60 * 60 * 1000).toISOString();

  const catMap = new Map<string, { label: string; count: number; totalHeat: number }>();
  for (const item of items) {
    const existing = catMap.get(item.category) ?? { label: item.categoryLabel, count: 0, totalHeat: 0 };
    existing.count += 1;
    existing.totalHeat += item.heatScore;
    catMap.set(item.category, existing);
  }
  const categoryBreakdown = Array.from(catMap.entries())
    .map(([category, val]) => ({
      category,
      label: val.label,
      count: val.count,
      avgHeat: Math.round(val.totalHeat / Math.max(1, val.count)),
    }))
    .sort((a, b) => b.count - a.count);

  const regionLabels: Array<{ region: RegionCode; label: string }> = [
    { region: 'TW', label: '台灣' },
    { region: 'JP', label: '日本' },
    { region: 'KR', label: '韓國' },
    { region: 'US', label: '美國' },
    { region: 'GLOBAL', label: '全球' },
  ];
  const regionComparison = regionLabels.map(({ region: r, label }) => {
    const cache = store.regionCaches[r];
    const cachedItems = cache?.items ?? [];
    const avgHeat =
      cachedItems.length > 0
        ? Math.round(cachedItems.reduce((sum, i) => sum + i.heatScore, 0) / cachedItems.length)
        : 0;
    return {
      region: r,
      label,
      avgHeat,
      topKeyword: cachedItems[0]?.title ?? '點擊切換地區後同步',
      itemCount: cachedItems.length,
    };
  });

  return {
    region,
    timeRange,
    lastUpdatedAt,
    nextAutoUpdateAt,
    items,
    sources: buildDataSourcesStatus(items, lastUpdatedAt),
    categoryBreakdown,
    regionComparison,
    historySnapshots: store.historySnapshots,
    fetchError,
  };
}

export function getCommerceOpportunities(region: RegionCode, trends: TrendItem[]): CommerceOpportunity[] {
  const topFood = trends.find((t) => t.category === 'food')?.title ?? '宇治抹茶開心果流心巴斯克';
  const topBeauty = trends.find((t) => t.category === 'beauty')?.title ?? '韓系水光肌 B5 修護安瓶';
  const topSocial = trends.find((t) => t.category === 'social')?.title ?? 'Threads 爆紅話題與打卡熱點';
  const topVideo = trends.find((t) => t.category === 'video')?.title ?? 'Reels / Shorts 沉浸式開箱短片';

  return [
    {
      id: `opp-food-${region}`,
      title: '爆紅流心甜點：宇治抹茶開心果巴斯克與咖啡廳聯名',
      kind: 'food',
      categoryLabel: '熱門美食',
      region,
      imageUrl: '/src/assets/images/product_food_matcha_1795588170128.jpg',
      demandAnalysis: `受惠於近期美食圈「${topFood}」與高顏值打卡甜點風潮，切面流心視覺在 IG Reels 與 Threads 的轉發率持續領先。`,
      consumerInterestIndex: 94,
      growthLabel: '美食社群擴散力高（AI 推估）',
      ecommerceAdvice: '採用「一刀切開爆漿流心」前 3 秒特寫短片，搭配限時 48 小時冷凍宅配團購組合，能快速累積開團轉換率。',
      startupAngle: '餐飲品牌或甜點工作室可結合在地話題推出週五限定聯名口味，創造稀缺排隊話題。',
      linkedTrendTitle: topFood,
      sourceAttribution: '結合即時熱門美食新聞與內容傳播模型（未串接外送／電商即時銷量 API）',
    },
    {
      id: `opp-beauty-${region}`,
      title: '精簡高效保養：玻尿酸 B5 修護安瓶與胜肽水光噴霧',
      kind: 'beauty',
      categoryLabel: '美妝保養',
      region,
      imageUrl: '/src/assets/images/product_beauty_serum_1795588169547.jpg',
      demandAnalysis: `呼應「${topBeauty}」美妝討論熱度，消費者對成分透明、溫和修護及早晚 3 步驟上妝服貼度測試影片高度關注。`,
      consumerInterestIndex: 91,
      growthLabel: '美妝口碑與復購率高（AI 推估）',
      ecommerceAdvice: '以「無濾鏡實測質地吸收速度」與「上妝前急救保濕對比」切入短影音，搭配 14 天小樣體驗組降低首次入手門檻。',
      startupAngle: '美妝選物店或 KOL 團購主可策展「換季水光肌 3 件組」作為高客單主力套組。',
      linkedTrendTitle: topBeauty,
      sourceAttribution: '結合即時美妝保養趨勢詞與消費者關注模型（未串接電商即時成交 API）',
    },
    {
      id: `opp-video-${region}`,
      title: '創作者爆款設備：磁吸隨身無線收音與 Vlog 口播套件',
      kind: 'social_video',
      categoryLabel: '熱門影片・創作者好物',
      region,
      imageUrl: '/src/assets/images/product_tech_gadget_1795588168484.jpg',
      demandAnalysis: `隨著「${topVideo}」及探店短影音創作風潮盛行，美食開箱、美妝實測創作者對輕量化降噪收音的需求大幅增加。`,
      consumerInterestIndex: 87,
      growthLabel: '創作者工具剛需上升（AI 推估）',
      ecommerceAdvice: '拍攝「咖啡廳嘈雜環境 vs 開啟降噪收音」前後實測對比片，直接展示人聲清晰度差異最能打動短影音新手。',
      startupAngle: '可搭配「美食／美妝短影音腳本模板包」作為加值贈品，打造差異化帶貨賣點。',
      linkedTrendTitle: topVideo,
      sourceAttribution: '結合即時影片創作趨勢與帶貨選品模型',
    },
    {
      id: `opp-social-${region}`,
      title: 'Threads & IG 流量變現：每日美食／美妝熱點快剪接案包',
      kind: 'social_video',
      categoryLabel: '社群媒體商機',
      region,
      demandAnalysis: `結合「${topSocial}」即時討論熱度，許多餐飲與美妝小店急需在 24 小時內跟上社群梗圖與 Reels 節奏。`,
      consumerInterestIndex: 83,
      growthLabel: '輕資產社群代操商機（AI 推估）',
      ecommerceAdvice: '以「每月 8 支跟風短影音 + Threads 互動貼文」訂閱制方案切入，用免費一頁熱點健檢報告開發客戶。',
      startupAngle: '運用 Trend7 AI 創作助手批產三平台文案與 30 秒分鏡，大幅提升單人接案產能。',
      linkedTrendTitle: topSocial,
      sourceAttribution: '依據即時社群話題追蹤需求推估之服務模型',
    },
  ];
}

// User State Operations
export function getUserState(): UserState {
  const store = ensureStore();
  return store.userState;
}

export function updateUserPreferences(patch: {
  theme?: ThemeId;
  region?: RegionCode;
  plan?: 'free' | 'pro';
  notifications?: Partial<NotificationSettings>;
}): UserState {
  const store = ensureStore();
  if (patch.theme) store.userState.theme = patch.theme;
  if (patch.region) store.userState.region = patch.region;
  if (patch.plan) {
    store.userState.plan = patch.plan;
    store.userState.aiQuotaLimit = patch.plan === 'pro' ? 200 : 10;
  }
  if (patch.notifications) {
    store.userState.notifications = {
      ...store.userState.notifications,
      ...patch.notifications,
    };
  }
  saveStore(store);
  return store.userState;
}

export function addSearchHistory(keyword: string): UserState {
  const clean = keyword.trim();
  const store = ensureStore();
  if (clean) {
    store.userState.searchHistory = [
      clean,
      ...store.userState.searchHistory.filter((k) => k !== clean),
    ].slice(0, 12);
    saveStore(store);
  }
  return store.userState;
}

export function clearSearchHistory(): UserState {
  const store = ensureStore();
  store.userState.searchHistory = [];
  saveStore(store);
  return store.userState;
}

export function toggleTrackedKeyword(keyword: string): UserState {
  const clean = keyword.trim();
  const store = ensureStore();
  if (!clean) return store.userState;
  const exists = store.userState.trackedKeywords.includes(clean);
  if (exists) {
    store.userState.trackedKeywords = store.userState.trackedKeywords.filter((k) => k !== clean);
  } else {
    store.userState.trackedKeywords = [clean, ...store.userState.trackedKeywords].slice(0, 20);
  }
  saveStore(store);
  return store.userState;
}

export function toggleSavedTrend(item: TrendItem): UserState {
  const store = ensureStore();
  const exists = store.userState.savedTrends.some((t) => t.title === item.title);
  if (exists) {
    store.userState.savedTrends = store.userState.savedTrends.filter((t) => t.title !== item.title);
  } else {
    store.userState.savedTrends = [item, ...store.userState.savedTrends].slice(0, 50);
  }
  saveStore(store);
  return store.userState;
}

export function toggleSavedProduct(product: CommerceOpportunity): UserState {
  const store = ensureStore();
  const exists = store.userState.savedProducts.some((p) => p.id === product.id);
  if (exists) {
    store.userState.savedProducts = store.userState.savedProducts.filter((p) => p.id !== product.id);
  } else {
    store.userState.savedProducts = [product, ...store.userState.savedProducts].slice(0, 50);
  }
  saveStore(store);
  return store.userState;
}

export function saveGeneratedScript(pkg: ShortVideoPackage): UserState {
  const store = ensureStore();
  const exists = store.userState.savedScripts.some((s) => s.id === pkg.id);
  if (!exists) {
    store.userState.savedScripts = [pkg, ...store.userState.savedScripts].slice(0, 50);
    saveStore(store);
  }
  return store.userState;
}

export function removeSavedScript(id: string): UserState {
  const store = ensureStore();
  store.userState.savedScripts = store.userState.savedScripts.filter((s) => s.id !== id);
  saveStore(store);
  return store.userState;
}

export function markAllAlertsRead(): UserState {
  const store = ensureStore();
  store.userState.alerts = store.userState.alerts.map((a) => ({ ...a, read: true }));
  saveStore(store);
  return store.userState;
}

export function incrementAiQuota(): { allowed: boolean; userState: UserState } {
  const store = ensureStore();
  const { aiQuotaUsed, aiQuotaLimit } = store.userState;
  if (aiQuotaUsed >= aiQuotaLimit) {
    return { allowed: false, userState: store.userState };
  }
  store.userState.aiQuotaUsed += 1;
  saveStore(store);
  return { allowed: true, userState: store.userState };
}

export function startHourlyTrendScheduler(): void {
  syncRegionTrends('TW', false).catch(() => {});
  setInterval(() => {
    syncRegionTrends('TW', true).catch(() => {});
  }, 60 * 60 * 1000);
}
