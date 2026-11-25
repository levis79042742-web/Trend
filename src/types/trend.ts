export type RegionCode = 'TW' | 'JP' | 'KR' | 'US' | 'GLOBAL';

export type TimeRange = 'today' | '24h' | '7d' | '30d';

export type ThemeId = 'cyber-night' | 'clean-white' | 'trend-purple' | 'future-blue';

export type MainTab = 'home' | 'trends' | 'creator' | 'saved' | 'settings';

export type CategoryId =
  | 'all'
  | 'social'
  | 'food'
  | 'beauty'
  | 'video';

export interface HistoryPoint {
  label: string;
  score: number;
}

export interface TrendItem {
  id: string;
  rank: number;
  prevRank: number | null;
  rankDelta: 'up' | 'down' | 'new' | 'steady';
  rankChangeAmount: number;
  title: string;
  summary: string;
  category: Exclude<CategoryId, 'all'>;
  categoryLabel: string;
  region: RegionCode;
  heatScore: number;
  growthPct: number;
  isEmergingViral: boolean;
  source: 'Google Trends' | 'Google News';
  sourceUrl: string;
  relatedNewsTitle?: string;
  relatedNewsSource?: string;
  trafficLabel?: string;
  publishedAt: string;
  fetchedAt: string;
  history7d: HistoryPoint[];
  history30d: HistoryPoint[];
}

export interface DataSourceStatus {
  id: string;
  name: string;
  category: string;
  status: 'connected' | 'unconfigured';
  authRequirement: string;
  note: string;
  lastCheckedAt: string;
  itemCount: number;
}

export interface SnapshotRecord {
  id: string;
  region: RegionCode;
  capturedAt: string;
  sourceSummary: string;
  topItems: Array<{
    rank: number;
    title: string;
    categoryLabel: string;
    heatScore: number;
    growthPct: number;
    source: string;
  }>;
}

export interface TrendsPayload {
  region: RegionCode;
  timeRange: TimeRange;
  lastUpdatedAt: string;
  nextAutoUpdateAt: string;
  items: TrendItem[];
  sources: DataSourceStatus[];
  categoryBreakdown: Array<{ category: string; label: string; count: number; avgHeat: number }>;
  regionComparison: Array<{ region: RegionCode; label: string; avgHeat: number; topKeyword: string; itemCount: number }>;
  historySnapshots: SnapshotRecord[];
  fetchError?: string;
}

export interface AIAnalysisResult {
  topicTitle: string;
  disclaimer: string;
  viralReason: string;
  summary: string;
  sevenDayTrajectory: string;
  futurePrediction: string;
  targetAudience: string;
  marketingAdvice: string;
  businessOpportunities: string;
  similarTopics: string[];
  generatedAt: string;
}

export interface ShortVideoPackage {
  id: string;
  topicTitle: string;
  videoTopics: string[];
  scripts: {
    sec15: string;
    sec30: string;
    sec60: string;
  };
  catchyTitles: string[];
  hooks: string[];
  socialCaptions: {
    threads: string;
    instagram: string;
    tiktok: string;
  };
  hashtags: string[];
  aiImagePrompt: string;
  aiVideoPrompt: string;
  productAdCopy: string;
  generatedAt: string;
}

export interface CommerceOpportunity {
  id: string;
  title: string;
  kind: 'food' | 'beauty' | 'social_video';
  categoryLabel: string;
  region: RegionCode;
  imageUrl?: string;
  demandAnalysis: string;
  consumerInterestIndex: number;
  growthLabel: string;
  ecommerceAdvice: string;
  startupAngle: string;
  linkedTrendTitle: string;
  sourceAttribution: string;
}

export interface NotificationSettings {
  enabled: boolean;
  viralAlerts: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  rapidRiseAlert: boolean;
  notifyTime: string;
}

export interface AlertItem {
  id: string;
  title: string;
  body: string;
  kind: 'viral' | 'keyword' | 'digest' | 'rise';
  createdAt: string;
  read: boolean;
}

export interface UserState {
  userEmail: string;
  displayName: string;
  plan: 'free' | 'pro';
  aiQuotaUsed: number;
  aiQuotaLimit: number;
  theme: ThemeId;
  region: RegionCode;
  searchHistory: string[];
  trackedKeywords: string[];
  savedTrends: TrendItem[];
  savedProducts: CommerceOpportunity[];
  savedScripts: ShortVideoPackage[];
  notifications: NotificationSettings;
  alerts: AlertItem[];
}

export const REGIONS: Array<{ code: RegionCode; label: string; shortLabel: string }> = [
  { code: 'TW', label: '台灣', shortLabel: '台灣' },
  { code: 'JP', label: '日本', shortLabel: '日本' },
  { code: 'KR', label: '韓國', shortLabel: '韓國' },
  { code: 'US', label: '美國', shortLabel: '美國' },
  { code: 'GLOBAL', label: '全球', shortLabel: '全球' },
];

export const CATEGORIES: Array<{ id: CategoryId; label: string }> = [
  { id: 'all', label: '全部焦點' },
  { id: 'social', label: '社群媒體' },
  { id: 'food', label: '熱門美食' },
  { id: 'beauty', label: '美妝保養' },
  { id: 'video', label: '熱門影片' },
];

export const THEMES: Array<{
  id: ThemeId;
  name: string;
  desc: string;
  swatch: [string, string, string];
}> = [
  {
    id: 'cyber-night',
    name: '黑夜科技風',
    desc: '深邃黑夜底色搭配橘紅火焰與科技對比',
    swatch: ['#090B10', '#121622', '#FF4D1C'],
  },
  {
    id: 'clean-white',
    name: '白色簡約風',
    desc: '高對比清爽白卡與清晰編輯感排版',
    swatch: ['#F6F7F9', '#FFFFFF', '#E0451B'],
  },
  {
    id: 'trend-purple',
    name: '紫色潮流風',
    desc: '深紫暮色漸層搭配粉色霓虹焦點',
    swatch: ['#100A1C', '#19112B', '#EC4899'],
  },
  {
    id: 'future-blue',
    name: '藍色未來風',
    desc: '深海藍夜背景搭配青色冷光數據線條',
    swatch: ['#060D19', '#0C172B', '#06B6D4'],
  },
];
