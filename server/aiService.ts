import { GoogleGenAI, Type } from '@google/genai';
import type { AIAnalysisResult, ShortVideoPackage } from '../src/types/trend.js';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('尚未設定 GEMINI_API_KEY，請於 AI Studio 的 Settings > Secrets 面板確認金鑰設定。');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function analyzeTrendWithGemini(params: {
  topicTitle: string;
  contextSummary: string;
  regionLabel: string;
  categoryLabel: string;
}): Promise<AIAnalysisResult> {
  const ai = getAiClient();
  const prompt = `
請針對以下「社群媒體／熱門美食／美妝保養／熱門影片」趨勢話題進行深度社群傳播與商機洞察分析，並以繁體中文（台灣習慣用語）輸出：
- 話題名稱：${params.topicTitle}
- 地區：${params.regionLabel}
- 領域分類：${params.categoryLabel}
- 已知公開摘要：${params.contextSummary}

重要規範：
1. 請聚焦於社群媒體擴散機制（Threads/IG/Dcard/TikTok）、餐飲美食探店或團購、美妝保養口碑與成分、以及影片內容流量密碼。
2. 所有未來趨勢預測與商機研判必須以「AI 推估」角度客觀描述，不可偽稱為已發生的確定事實。
`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        '你是「這週紅什麼 Trend7」的資深社群趨勢、美食美妝口碑與短影音策略顧問。請嚴格輸出合法 JSON。',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          viralReason: { type: Type.STRING, description: '爆紅原因分析（2-3句具體社群與口碑洞察）' },
          summary: { type: Type.STRING, description: '熱門事件摘要（清楚扼要）' },
          sevenDayTrajectory: { type: Type.STRING, description: '七天人氣變化研判' },
          futurePrediction: { type: Type.STRING, description: '未來 7-14 天趨勢預測（須清楚標示為 AI 推估）' },
          targetAudience: { type: Type.STRING, description: '目標客群輪廓與痛點分析' },
          marketingAdvice: { type: Type.STRING, description: '美食／美妝／社群內容行銷與帶貨切角建議' },
          businessOpportunities: { type: Type.STRING, description: '潛在商業機會與變現模式' },
          similarTopics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3-4 個相似或可延伸的社群／美食／美妝／影片熱門關鍵字',
          },
        },
      },
    },
  });

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('AI 分析未回傳內容，請稍後重試。');
  }
  const parsed = JSON.parse(rawText) as Omit<AIAnalysisResult, 'topicTitle' | 'disclaimer' | 'generatedAt'>;

  return {
    topicTitle: params.topicTitle,
    disclaimer: '以下分析與預測結果由 AI 根據目前公開趨勢資訊推估產生，僅供創作與商業決策參考，非確定事實。',
    viralReason: parsed.viralReason ?? '',
    summary: parsed.summary ?? '',
    sevenDayTrajectory: parsed.sevenDayTrajectory ?? '',
    futurePrediction: parsed.futurePrediction ?? '',
    targetAudience: parsed.targetAudience ?? '',
    marketingAdvice: parsed.marketingAdvice ?? '',
    businessOpportunities: parsed.businessOpportunities ?? '',
    similarTopics: Array.isArray(parsed.similarTopics) ? parsed.similarTopics.slice(0, 5) : [],
    generatedAt: new Date().toISOString(),
  };
}

export async function generateShortVideoWithGemini(params: {
  topicTitle: string;
  productFocus?: string;
  tone?: string;
  regionLabel: string;
}): Promise<ShortVideoPackage> {
  const ai = getAiClient();
  const prompt = `
請針對熱門話題「${params.topicTitle}」（地區：${params.regionLabel}，領域涵蓋社群媒體／美食／美妝／熱門影片）生成一套完整的短影音創作與導購企劃包，使用繁體中文（台灣用語）。
${params.productFocus ? `搭配推廣商品／美食／美妝品項：${params.productFocus}` : ''}
${params.tone ? `內容風格語氣：${params.tone}` : '內容風格語氣：節奏明快、視覺吸睛、自然口語'}

請產出：
1. 3 個切角不同的短影音創作主題
2. 15 秒、30 秒、60 秒三種長度的完整分鏡與口播腳本（含【畫面】與【旁白/字幕】）
3. 3 個高點擊率影片標題
4. 3 句前 3 秒開場吸睛 Hook 文案
5. Threads、Instagram Reels、TikTok 三平台適配貼文文案
6. 6-8 個精準熱門 Hashtag（含 # 符號）
7. AI 圖片生成提示詞（英文高畫質攝影/視覺 prompt，方便直接貼到 Midjourney / Imagen）
8. AI 影片生成提示詞（英文動態運鏡 prompt，方便直接貼到 Veo / Sora）
9. 商品介紹與廣告轉換文案
`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        '你是千萬流量短影音導演與爆款帶貨文案專家，擅長 Reels、TikTok、YouTube Shorts 與 Threads 社群操作。請嚴格輸出合法 JSON。',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          videoTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
          scripts: {
            type: Type.OBJECT,
            properties: {
              sec15: { type: Type.STRING },
              sec30: { type: Type.STRING },
              sec60: { type: Type.STRING },
            },
          },
          catchyTitles: { type: Type.ARRAY, items: { type: Type.STRING } },
          hooks: { type: Type.ARRAY, items: { type: Type.STRING } },
          socialCaptions: {
            type: Type.OBJECT,
            properties: {
              threads: { type: Type.STRING },
              instagram: { type: Type.STRING },
              tiktok: { type: Type.STRING },
            },
          },
          hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
          aiImagePrompt: { type: Type.STRING },
          aiVideoPrompt: { type: Type.STRING },
          productAdCopy: { type: Type.STRING },
        },
      },
    },
  });

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('AI 創作助手未回傳內容，請稍後重試。');
  }

  const parsed = JSON.parse(rawText) as Omit<ShortVideoPackage, 'id' | 'topicTitle' | 'generatedAt'>;
  return {
    id: `script-${Date.now()}`,
    topicTitle: params.topicTitle,
    videoTopics: Array.isArray(parsed.videoTopics) ? parsed.videoTopics : [],
    scripts: {
      sec15: parsed.scripts?.sec15 ?? '',
      sec30: parsed.scripts?.sec30 ?? '',
      sec60: parsed.scripts?.sec60 ?? '',
    },
    catchyTitles: Array.isArray(parsed.catchyTitles) ? parsed.catchyTitles : [],
    hooks: Array.isArray(parsed.hooks) ? parsed.hooks : [],
    socialCaptions: {
      threads: parsed.socialCaptions?.threads ?? '',
      instagram: parsed.socialCaptions?.instagram ?? '',
      tiktok: parsed.socialCaptions?.tiktok ?? '',
    },
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
    aiImagePrompt: parsed.aiImagePrompt ?? '',
    aiVideoPrompt: parsed.aiVideoPrompt ?? '',
    productAdCopy: parsed.productAdCopy ?? '',
    generatedAt: new Date().toISOString(),
  };
}
