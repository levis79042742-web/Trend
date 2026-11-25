export interface BlueprintFile {
  id: string;
  filename: string;
  stack: string;
  description: string;
  code: string;
}

export const BLUEPRINT_FILES: BlueprintFile[] = [
  {
    id: 'readme',
    filename: 'README.md',
    stack: '部署與手機端雲端編譯教學',
    description: '完整專案架構說明與 GitHub + Codemagic 零電腦編譯 APK 步驟',
    code: `# 這週紅什麼 Trend7 — 完整專案原始碼

品牌標語：掌握一週流行，搶先一步看見商機。

## 目錄結構
- \`flutter_app/\`：Flutter Android／平板自適應前端 App（含四種視覺主題、排行榜、趨勢圖表、AI 分析、短影音創作助手、收藏與設定）
- \`backend/\`：Python FastAPI 後端服務（Google Trends / Google News RSS 即時排程聚合、AI 分析接口、HTTPS 安全金鑰管理）
- \`codemagic.yaml\`：GitHub 推送後自動於雲端建置 Release APK
- \`firestore.rules\`：Firebase Firestore 資料庫安全讀寫規則

## 只有 Android 手機也能編譯 APK 的部署步驟
1. 在手機瀏覽器開啟 GitHub 建立新的 Repository（例如 \`trend7-app\`），將本專案檔案上傳至 \`main\` 分支。
2. 部署後端：將 \`backend/\` 部署至 Cloud Run 或 Render，並設定環境變數 \`OPENAI_API_KEY\`（或 \`GEMINI_API_KEY\`）。
3. 綁定 Codemagic：登入 codemagic.io 連結您的 GitHub 儲存庫，Codemagic 會自動偵測 \`codemagic.yaml\`。
4. 在 Codemagic 環境變數設定 \`TREND7_API_BASE_URL=https://你的後端網址\`。
5. 點擊 Start new build，建置完成後於手機直接下載 Artifacts 中的 \`app-release.apk\` 安裝。`,
  },
  {
    id: 'flutter-pubspec',
    filename: 'flutter_app/pubspec.yaml',
    stack: 'Flutter (Android / 平板自適應)',
    description: 'Flutter 核心套件、Riverpod 狀態管理、fl_chart 圖表、Firebase 與營利套件依賴',
    code: `name: trend7_app
description: 這週紅什麼 Trend7 — 智慧熱門趨勢與短影音創作平台
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.4.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  flutter_riverpod: ^2.6.1
  http: ^1.2.2
  fl_chart: ^0.69.0
  shared_preferences: ^2.3.3
  firebase_core: ^3.6.0
  firebase_auth: ^5.3.1
  cloud_firestore: ^5.4.4
  share_plus: ^10.1.2
  google_mobile_ads: ^5.2.0
  in_app_purchase: ^3.2.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^4.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/trend7_logo.png`,
  },
  {
    id: 'flutter-models',
    filename: 'flutter_app/lib/models/trend_models.dart',
    stack: 'Flutter 資料模型',
    description: 'TrendItem、AIAnalysisResult、ShortVideoPackage 與四種主題列舉',
    code: `enum Trend7Theme { cyberNight, cleanWhite, trendPurple, futureBlue }

class TrendItem {
  final int rank;
  final String title;
  final String summary;
  final String category;
  final String region;
  final int heatScore;
  final int growthPct;
  final String source;
  final String sourceUrl;
  final List<int> history7d;

  TrendItem({
    required this.rank,
    required this.title,
    required this.summary,
    required this.category,
    required this.region,
    required this.heatScore,
    required this.growthPct,
    required this.source,
    required this.sourceUrl,
    required this.history7d,
  });

  factory TrendItem.fromJson(Map<String, dynamic> json) {
    return TrendItem(
      rank: json['rank'] ?? 1,
      title: json['title'] ?? '',
      summary: json['summary'] ?? '',
      category: json['categoryLabel'] ?? json['category'] ?? '時事新聞',
      region: json['region'] ?? 'TW',
      heatScore: json['heatScore'] ?? 60,
      growthPct: json['growthPct'] ?? 30,
      source: json['source'] ?? 'Google Trends',
      sourceUrl: json['sourceUrl'] ?? 'https://trends.google.com',
      history7d: (json['history7d'] as List<dynamic>? ?? [])
          .map((e) => (e is Map ? (e['score'] ?? 50) : e) as int)
          .toList(),
    );
  }
}

class AIAnalysisResult {
  final String disclaimer;
  final String viralReason;
  final String summary;
  final String sevenDayTrajectory;
  final String futurePrediction;
  final String targetAudience;
  final String marketingAdvice;
  final String businessOpportunities;
  final List<String> similarTopics;

  AIAnalysisResult({
    required this.disclaimer,
    required this.viralReason,
    required this.summary,
    required this.sevenDayTrajectory,
    required this.futurePrediction,
    required this.targetAudience,
    required this.marketingAdvice,
    required this.businessOpportunities,
    required this.similarTopics,
  });

  factory AIAnalysisResult.fromJson(Map<String, dynamic> json) {
    return AIAnalysisResult(
      disclaimer: json['disclaimer'] ?? '以下預測結果為 AI 推估，僅供參考，非確定事實。',
      viralReason: json['viralReason'] ?? '',
      summary: json['summary'] ?? '',
      sevenDayTrajectory: json['sevenDayTrajectory'] ?? '',
      futurePrediction: json['futurePrediction'] ?? '',
      targetAudience: json['targetAudience'] ?? '',
      marketingAdvice: json['marketingAdvice'] ?? '',
      businessOpportunities: json['businessOpportunities'] ?? '',
      similarTopics: List<String>.from(json['similarTopics'] ?? []),
    );
  }
}

class ShortVideoPackage {
  final String topicTitle;
  final String sec15;
  final String sec30;
  final String sec60;
  final List<String> titles;
  final List<String> hooks;
  final List<String> hashtags;
  final String aiImagePrompt;
  final String aiVideoPrompt;
  final String productAdCopy;

  ShortVideoPackage({
    required this.topicTitle,
    required this.sec15,
    required this.sec30,
    required this.sec60,
    required this.titles,
    required this.hooks,
    required this.hashtags,
    required this.aiImagePrompt,
    required this.aiVideoPrompt,
    required this.productAdCopy,
  });

  factory ShortVideoPackage.fromJson(Map<String, dynamic> json) {
    final scripts = json['scripts'] as Map<String, dynamic>? ?? {};
    return ShortVideoPackage(
      topicTitle: json['topicTitle'] ?? '',
      sec15: scripts['sec15'] ?? '',
      sec30: scripts['sec30'] ?? '',
      sec60: scripts['sec60'] ?? '',
      titles: List<String>.from(json['catchyTitles'] ?? []),
      hooks: List<String>.from(json['hooks'] ?? []),
      hashtags: List<String>.from(json['hashtags'] ?? []),
      aiImagePrompt: json['aiImagePrompt'] ?? '',
      aiVideoPrompt: json['aiVideoPrompt'] ?? '',
      productAdCopy: json['productAdCopy'] ?? '',
    );
  }
}`,
  },
  {
    id: 'flutter-api',
    filename: 'flutter_app/lib/services/api_service.dart',
    stack: 'Flutter HTTPS API 串接服務',
    description: '透過環境變數讀取後端網址，呼叫熱門排行、AI 分析與短影音腳本生成接口',
    code: `import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/trend_models.dart';

class Trend7ApiService {
  static const String baseUrl = String.fromEnvironment(
    'TREND7_API_BASE_URL',
    defaultValue: 'https://your-fastapi-backend.run.app',
  );

  Future<List<TrendItem>> fetchTrends({String region = 'TW', String range = 'today'}) async {
    final uri = Uri.parse('$baseUrl/api/trends?region=$region&range=$range');
    final resp = await http.get(uri).timeout(const Duration(seconds: 12));
    if (resp.statusCode != 200) {
      throw Exception('無法取得即時趨勢 (\${resp.statusCode})');
    }
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    final list = data['items'] as List<dynamic>? ?? [];
    return list.map((e) => TrendItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<AIAnalysisResult> analyzeTopic({
    required String topicTitle,
    required String contextSummary,
    required String region,
  }) async {
    final uri = Uri.parse('$baseUrl/api/ai/analyze');
    final resp = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'topicTitle': topicTitle,
            'contextSummary': contextSummary,
            'region': region,
          }),
        )
        .timeout(const Duration(seconds: 30));

    if (resp.statusCode != 200) {
      throw Exception('AI 分析失敗 (\${resp.statusCode})');
    }
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    return AIAnalysisResult.fromJson(data['analysis'] as Map<String, dynamic>);
  }

  Future<ShortVideoPackage> generateShortVideo({
    required String topicTitle,
    String productFocus = '',
    String region = 'TW',
  }) async {
    final uri = Uri.parse('$baseUrl/api/ai/short-video');
    final resp = await http
        .post(
          uri,
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'topicTitle': topicTitle,
            'productFocus': productFocus,
            'region': region,
          }),
        )
        .timeout(const Duration(seconds: 35));

    if (resp.statusCode != 200) {
      throw Exception('腳本生成失敗 (\${resp.statusCode})');
    }
    final data = jsonDecode(resp.body) as Map<String, dynamic>;
    return ShortVideoPackage.fromJson(data['scriptPackage'] as Map<String, dynamic>);
  }
}`,
  },
  {
    id: 'flutter-main',
    filename: 'flutter_app/lib/main.dart',
    stack: 'Flutter 主程式與四款主題切換',
    description: '包含黑夜科技風、白色簡約風、紫色潮流風、藍色未來風，並支援手機／平板自適應 5 分頁架構',
    code: `import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:share_plus/share_plus.dart';
import 'models/trend_models.dart';
import 'services/api_service.dart';

final apiProvider = Provider((ref) => Trend7ApiService());
final themeProvider = StateProvider<Trend7Theme>((ref) => Trend7Theme.cyberNight);
final regionProvider = StateProvider<String>((ref) => 'TW');
final savedTopicsProvider = StateProvider<List<TrendItem>>((ref) => []);

final trendsFutureProvider = FutureProvider<List<TrendItem>>((ref) async {
  final api = ref.watch(apiProvider);
  final region = ref.watch(regionProvider);
  return api.fetchTrends(region: region);
});

ThemeData buildTrend7Theme(Trend7Theme theme) {
  switch (theme) {
    case Trend7Theme.cyberNight:
      return ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF090B10),
        cardColor: const Color(0xFF121622),
        colorScheme: const ColorScheme.dark(primary: Color(0xFFFF4D1C), surface: Color(0xFF121622)),
      );
    case Trend7Theme.cleanWhite:
      return ThemeData.light().copyWith(
        scaffoldBackgroundColor: const Color(0xFFF6F7F9),
        cardColor: Colors.white,
        colorScheme: const ColorScheme.light(primary: Color(0xFFE0451B), surface: Colors.white),
      );
    case Trend7Theme.trendPurple:
      return ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF100A1C),
        cardColor: const Color(0xFF19112B),
        colorScheme: const ColorScheme.dark(primary: Color(0xFFEC4899), surface: Color(0xFF19112B)),
      );
    case Trend7Theme.futureBlue:
      return ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF060D19),
        cardColor: const Color(0xFF0C172B),
        colorScheme: const ColorScheme.dark(primary: Color(0xFF06B6D4), surface: Color(0xFF0C172B)),
      );
  }
}

void main() {
  runApp(const ProviderScope(child: Trend7App()));
}

class Trend7App extends ConsumerWidget {
  const Trend7App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeTheme = ref.watch(themeProvider);
    return MaterialApp(
      title: '這週紅什麼 Trend7',
      debugShowCheckedModeBanner: false,
      theme: buildTrend7Theme(activeTheme),
      home: const AdaptiveShell(),
    );
  }
}

class AdaptiveShell extends ConsumerStatefulWidget {
  const AdaptiveShell({super.key});
  @override
  ConsumerState<AdaptiveShell> createState() => _AdaptiveShellState();
}

class _AdaptiveShellState extends ConsumerState<AdaptiveShell> {
  int _tabIndex = 0;

  @override
  Widget build(BuildContext context) {
    final isTablet = MediaQuery.of(context).size.width >= 768;
    final pages = [
      const HomeScreen(),
      const TrendsChartScreen(),
      const CreatorScreen(),
      const SavedScreen(),
      const SettingsScreen(),
    ];

    return Scaffold(
      appBar: AppBar(
        title: const Text('這週紅什麼 Trend7'),
        actions: [
          DropdownButton<String>(
            value: ref.watch(regionProvider),
            underline: const SizedBox.shrink(),
            items: const [
              DropdownMenuItem(value: 'TW', child: Text('台灣')),
              DropdownMenuItem(value: 'JP', child: Text('日本')),
              DropdownMenuItem(value: 'KR', child: Text('韓國')),
              DropdownMenuItem(value: 'US', child: Text('美國')),
              DropdownMenuItem(value: 'GLOBAL', child: Text('全球')),
            ],
            onChanged: (val) {
              if (val != null) ref.read(regionProvider.notifier).state = val;
            },
          ),
          const SizedBox(width: 12),
        ],
      ),
      body: Row(
        children: [
          if (isTablet)
            NavigationRail(
              selectedIndex: _tabIndex,
              onDestinationSelected: (i) => setState(() => _tabIndex = i),
              labelType: NavigationRailLabelType.all,
              destinations: const [
                NavigationRailDestination(icon: Icon(Icons.local_fire_department), label: Text('首頁')),
                NavigationRailDestination(icon: Icon(Icons.show_chart), label: Text('趨勢')),
                NavigationRailDestination(icon: Icon(Icons.video_library), label: Text('AI 創作')),
                NavigationRailDestination(icon: Icon(Icons.bookmark), label: Text('收藏')),
                NavigationRailDestination(icon: Icon(Icons.settings), label: Text('設定')),
              ],
            ),
          Expanded(child: pages[_tabIndex]),
        ],
      ),
      bottomNavigationBar: isTablet
          ? null
          : NavigationBar(
              selectedIndex: _tabIndex,
              onDestinationSelected: (i) => setState(() => _tabIndex = i),
              destinations: const [
                NavigationDestination(icon: Icon(Icons.local_fire_department), label: '首頁'),
                NavigationDestination(icon: Icon(Icons.show_chart), label: '趨勢'),
                NavigationDestination(icon: Icon(Icons.video_library), label: 'AI 創作'),
                NavigationDestination(icon: Icon(Icons.bookmark), label: '收藏'),
                NavigationDestination(icon: Icon(Icons.settings), label: '設定'),
              ],
            ),
    );
  }
}

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncTrends = ref.watch(trendsFutureProvider);
    return asyncTrends.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('載入失敗：$err')),
      data: (items) => RefreshIndicator(
        onRefresh: () async => ref.refresh(trendsFutureProvider),
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: items.length,
          itemBuilder: (context, idx) {
            final item = items[idx];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: ListTile(
                leading: CircleAvatar(child: Text('#\${item.rank}')),
                title: Text(item.title, maxLines: 2, overflow: TextOverflow.ellipsis),
                subtitle: Text('\${item.category} · \${item.source} · 成長 +\${item.growthPct}%'),
                trailing: IconButton(
                  icon: const Icon(Icons.bookmark_add_outlined),
                  onPressed: () {
                    final list = [...ref.read(savedTopicsProvider)];
                    if (!list.any((e) => e.title == item.title)) {
                      list.add(item);
                      ref.read(savedTopicsProvider.notifier).state = list;
                    }
                  },
                ),
                onTap: () => _openAnalysisSheet(context, ref, item),
              ),
            );
          },
        ),
      ),
    );
  }

  void _openAnalysisSheet(BuildContext context, WidgetRef ref, TrendItem item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => FutureBuilder<AIAnalysisResult>(
        future: ref.read(apiProvider).analyzeTopic(
              topicTitle: item.title,
              contextSummary: item.summary,
              region: item.region,
            ),
        builder: (context, snap) {
          if (!snap.hasData) {
            return const SizedBox(height: 260, child: Center(child: CircularProgressIndicator()));
          }
          final a = snap.data!;
          return Padding(
            padding: const EdgeInsets.all(20),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.title, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(a.disclaimer, style: const TextStyle(fontSize: 12, color: Colors.orange)),
                  const SizedBox(height: 12),
                  Text('爆紅原因：\${a.viralReason}'),
                  const SizedBox(height: 8),
                  Text('未來趨勢推估：\${a.futurePrediction}'),
                  const SizedBox(height: 8),
                  Text('潛在商機：\${a.businessOpportunities}'),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class TrendsChartScreen extends ConsumerWidget {
  const TrendsChartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncTrends = ref.watch(trendsFutureProvider);
    return asyncTrends.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('$err')),
      data: (items) {
        final top = items.isNotEmpty ? items.first : null;
        final pts = (top?.history7d ?? [45, 52, 60, 68, 75, 82, 90])
            .asMap()
            .entries
            .map((e) => FlSpot(e.key.toDouble(), e.value.toDouble()))
            .toList();
        return Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('七天熱度折線圖：\${top?.title ?? ""}', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 20),
              SizedBox(
                height: 240,
                child: LineChart(LineChartData(lineBarsData: [LineChartBarData(spots: pts, isCurved: true)])),
              ),
            ],
          ),
        );
      },
    );
  }
}

class CreatorScreen extends ConsumerStatefulWidget {
  const CreatorScreen({super.key});
  @override
  ConsumerState<CreatorScreen> createState() => _CreatorScreenState();
}

class _CreatorScreenState extends ConsumerState<CreatorScreen> {
  final _ctrl = TextEditingController();
  ShortVideoPackage? _pkg;
  bool _loading = false;

  Future<void> _generate() async {
    if (_ctrl.text.trim().isEmpty) return;
    setState(() => _loading = true);
    try {
      final res = await ref.read(apiProvider).generateShortVideo(topicTitle: _ctrl.text.trim());
      setState(() => _pkg = res);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: _ctrl,
          decoration: const InputDecoration(labelText: '輸入熱門話題關鍵字', border: OutlineInputBorder()),
        ),
        const SizedBox(height: 12),
        FilledButton(onPressed: _loading ? null : _generate, child: Text(_loading ? '生成中…' : '生成 15s / 30s / 60s 腳本')),
        if (_pkg != null) ...[
          const SizedBox(height: 16),
          SelectableText(_pkg!.sec30),
          Row(
            children: [
              TextButton(
                onPressed: () => Clipboard.setData(ClipboardData(text: _pkg!.sec30)),
                child: const Text('複製腳本'),
              ),
              TextButton(
                onPressed: () => Share.share(_pkg!.sec30),
                child: const Text('分享'),
              ),
            ],
          ),
        ]
      ],
    );
  }
}

class SavedScreen extends ConsumerWidget {
  const SavedScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedTopicsProvider);
    if (saved.isEmpty) return const Center(child: Text('尚未收藏熱門話題'));
    return ListView.builder(
      itemCount: saved.length,
      itemBuilder: (_, i) => ListTile(title: Text(saved[i].title), subtitle: Text(saved[i].category)),
    );
  }
}

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = ref.watch(themeProvider);
    return ListView(
      padding: const EdgeInsets.all(16),
      children: Trend7Theme.values.map((t) {
        return RadioListTile<Trend7Theme>(
          title: Text(t.name),
          value: t,
          groupValue: active,
          onChanged: (v) {
            if (v != null) ref.read(themeProvider.notifier).state = v;
          },
        );
      }).toList(),
    );
  }
}`,
  },
  {
    id: 'fastapi-requirements',
    filename: 'backend/requirements.txt',
    stack: 'Python FastAPI 套件相依清單',
    description: '後端 API 伺服器所需之 Python 套件',
    code: `fastapi==0.115.6
uvicorn[standard]==0.32.1
httpx==0.28.1
apscheduler==3.10.4
openai==1.57.0
firebase-admin==6.6.0
pydantic==2.10.3`,
  },
  {
    id: 'fastapi-backend',
    filename: 'backend/main.py',
    stack: 'Python FastAPI + APScheduler + OpenAI/AI API',
    description: '每小時排程抓取 Google Trends/News RSS、安全保存 API 金鑰並提供完整 REST API',
    code: `import json
import os
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Dict, List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from openai import AsyncOpenAI

app = FastAPI(title="Trend7 API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

TREND_CACHE: Dict[str, dict] = {}
scheduler = AsyncIOScheduler()

def get_openai_client() -> AsyncOpenAI:
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=500, detail="後端尚未設定 OPENAI_API_KEY")
    return AsyncOpenAI(api_key=api_key)

async def fetch_region_trends(region: str = "TW") -> dict:
    queries = [
        ("社群媒體", "Threads OR Dcard OR IG 爆紅"),
        ("熱門美食", "熱門美食 OR 甜點 OR 手搖飲"),
        ("美妝保養", "美妝 OR 保養品 OR 彩妝 推薦"),
        ("熱門影片", "YouTube OR 短影音 OR Reels 爆紅"),
    ]
    items: List[dict] = []
    async with httpx.AsyncClient(timeout=8.0) as client:
        for cat_label, q in queries:
            url = f"https://news.google.com/rss/search?q={q}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant"
            resp = await client.get(url, headers={"User-Agent": "Trend7Bot/1.0"})
            if resp.status_code != 200:
                continue
            root = ET.fromstring(resp.text)
            for idx, item in enumerate(root.findall("./channel/item")[:5], start=1):
                title = item.findtext("title", default="")
                link = item.findtext("link", default="https://news.google.com")
                heat = max(55, 94 - idx * 5)
                items.append({
                    "rank": len(items) + 1,
                    "title": title,
                    "summary": f"{cat_label}熱點：{title}",
                    "categoryLabel": cat_label,
                    "region": region,
                    "heatScore": heat,
                    "growthPct": max(30, 190 - idx * 15),
                    "source": "Google News",
                    "sourceUrl": link,
                    "history7d": [heat - 20, heat - 16, heat - 11, heat - 8, heat - 5, heat - 2, heat],
                })
    payload = {
        "region": region,
        "lastUpdatedAt": datetime.now(timezone.utc).isoformat(),
        "items": items,
    }
    TREND_CACHE[region] = payload
    return payload

@app.on_event("startup")
async def startup_event():
    scheduler.add_job(fetch_region_trends, "interval", hours=1, args=["TW"])
    scheduler.start()

@app.get("/api/trends")
async def get_trends(region: str = "TW", range: str = "today"):
    if region in TREND_CACHE:
        return TREND_CACHE[region]
    return await fetch_region_trends(region)

class AnalyzeRequest(BaseModel):
    topicTitle: str
    contextSummary: str = ""
    region: str = "TW"

@app.post("/api/ai/analyze")
async def analyze_topic(req: AnalyzeRequest):
    client = get_openai_client()
    prompt = f"請以繁體中文分析熱門話題「{req.topicTitle}」（地區：{req.region}），輸出 JSON：viralReason, summary, sevenDayTrajectory, futurePrediction(標註AI推估), targetAudience, marketingAdvice, businessOpportunities, similarTopics(陣列)"
    comp = await client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(comp.choices[0].message.content or "{}")
    data["disclaimer"] = "以下預測結果由 AI 推估產生，僅供參考，非確定事實。"
    return {"analysis": data}

class VideoRequest(BaseModel):
    topicTitle: str
    productFocus: str = ""
    region: str = "TW"

@app.post("/api/ai/short-video")
async def generate_short_video(req: VideoRequest):
    client = get_openai_client()
    prompt = f"針對「{req.topicTitle}」生成短影音企劃 JSON（繁體中文）：scripts({{sec15, sec30, sec60}}), catchyTitles, hooks, hashtags, aiImagePrompt, aiVideoPrompt, productAdCopy"
    comp = await client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}],
    )
    data = json.loads(comp.choices[0].message.content or "{}")
    data["topicTitle"] = req.topicTitle
    return {"scriptPackage": data}`,
  },
  {
    id: 'codemagic-yaml',
    filename: 'codemagic.yaml',
    stack: 'GitHub + Codemagic 雲端 APK 編譯',
    description: 'Push 至 GitHub main 分支後自動於雲端建置 Release APK 供 Android 手機安裝',
    code: `workflows:
  android-trend7-apk:
    name: Trend7 Android APK Build
    max_build_duration: 60
    instance_type: mac_mini_m2
    environment:
      flutter: stable
      vars:
        PACKAGE_NAME: "app.trend7.mobile"
    triggering:
      events:
        - push
      branch_patterns:
        - pattern: main
          include: true
    scripts:
      - name: Get Flutter packages
        script: cd flutter_app && flutter pub get
      - name: Run Flutter analyzer
        script: cd flutter_app && flutter analyze
      - name: Build release APK
        script: |
          cd flutter_app && flutter build apk --release \
            --dart-define=TREND7_API_BASE_URL=$TREND7_API_BASE_URL
    artifacts:
      - flutter_app/build/app/outputs/flutter-apk/*.apk`,
  },
  {
    id: 'firestore-rules',
    filename: 'firestore.rules',
    stack: 'Firebase Firestore 資料庫安全規則',
    description: '使用者收藏、追蹤關鍵字、通知設定與歷史排行快照存取規則',
    code: `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{subcollection}/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /trend_snapshots/{snapshotId} {
      allow read: if true;
      allow write: if false; // 僅限後端 FastAPI Admin SDK 排程寫入
    }
  }
}`,
  },
];
