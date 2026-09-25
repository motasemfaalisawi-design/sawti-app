import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = express();

  // CORS middleware for PWA tools like PWABuilder and external tools
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, *');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Allow larger audio payload sizes (base64 audio)
  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // Explicit PWA Endpoints for PWABuilder and installability
  app.get(['/manifest.json', '/manifest.webmanifest'], (_req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
  });

  app.get(['/.well-known/assetlinks.json'], (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path.resolve(__dirname, 'public', '.well-known', 'assetlinks.json'));
  });

  app.get('/sw.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
  });

  app.get('/icon-192.png', (_req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.resolve(__dirname, 'public', 'icon-192.png'));
  });

  app.get('/icon-512.png', (_req, res) => {
    res.setHeader('Content-Type', 'image/png');
    res.sendFile(path.resolve(__dirname, 'public', 'icon-512.png'));
  });

  // Direct download for Android native project ZIP
  app.get(['/sawti-android-source.zip', '/download-android-project'], (_req, res) => {
    res.download(path.resolve(__dirname, 'public', 'sawti-android-source.zip'), 'sawti-android-project.zip');
  });

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Bidirectional Speech Transcription & Translation Endpoint (Arabic <-> English)
  app.post('/api/transcribe-and-translate', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server.',
        });
      }

      const { audioBase64, mimeType, textInput } = req.body;

      if (!audioBase64 && !textInput) {
        return res.status(400).json({
          error: 'Please provide either audioBase64 or textInput.',
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `You are a master bilingual audio transcriptionist and professional translator specializing in Arabic (العربية) and English.
Your mission:
1. Accurately transcribe the exact spoken words into text in the original spoken language.
2. Automatically detect the primary language:
   - If spoken in ARABIC (any dialect: Egyptian, Levantine, Gulf, North African, or MSA):
     * "originalTranscription": The full faithful Arabic transcription with correct punctuation.
     * "translatedText": An accurate, natural, fluent ENGLISH translation.
     * "detectedLanguage": "ar"
     * "detectedLanguageLabel": "العربية (Arabic)"
     * "targetLanguage": "en"
     * "targetLanguageLabel": "الإنجليزية (English)"
   - If spoken in ENGLISH:
     * "originalTranscription": The full faithful English transcription with proper punctuation and casing.
     * "translatedText": An accurate, natural, fluent ARABIC (عربي فصيح وسلس) translation.
     * "detectedLanguage": "en"
     * "detectedLanguageLabel": "English (الإنجليزية)"
     * "targetLanguage": "ar"
     * "targetLanguageLabel": "العربية (Arabic)"
3. Provide a brief 1-sentence summary of the main message in both languages.
4. Break down into natural dialogue segments with "originalText" and "translatedText".

Strictly return a valid JSON object matching this schema:
{
  "detectedLanguage": "ar" | "en",
  "detectedLanguageLabel": "العربية" | "English",
  "targetLanguage": "en" | "ar",
  "targetLanguageLabel": "English" | "العربية",
  "originalTranscription": "string",
  "translatedText": "string",
  "summary": "string",
  "segments": [
    {
      "originalText": "string",
      "translatedText": "string"
    }
  ]
}`;

      const contentsParts: any[] = [];

      if (audioBase64) {
        contentsParts.push({
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: audioBase64,
          },
        });
        contentsParts.push({
          text: 'Listen to this audio carefully. Transcribe all speech in its original language, detect if it is Arabic or English, and translate it to the opposite language (Arabic -> English, or English -> Arabic). Return strictly valid JSON.',
        });
      } else if (textInput) {
        contentsParts.push({
          text: `Text to analyze: "${textInput}".
Detect whether it is Arabic or English.
If Arabic, translate it to English.
If English, translate it to Arabic.
Return strictly valid JSON.`,
        });
      }

      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      let response = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contentsParts },
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });
          if (response && response.text) {
            break;
          }
        } catch (mErr: any) {
          console.warn(`Model ${modelName} failed or unavailable:`, mErr?.message || mErr);
          lastError = mErr;
        }
      }

      if (!response || !response.text) {
        throw lastError || new Error('All model attempts failed');
      }

      const responseText = response.text || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      return res.json(parsedData);
    } catch (err: any) {
      console.error('API /transcribe-and-translate error:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to process transcription and translation.',
      });
    }
  });

  // Fast Low-Latency Live Word & Phrase Translation Endpoint (for real-time streaming subtitles)
  const translationCache = new Map<string, { translated: string; detectedLang: string; targetLang: string }>();

  app.post('/api/live-translate', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      }

      const { phrase, direction, sourceLang, targetLang } = req.body;
      const cleanPhrase = (phrase || '').trim();

      if (!cleanPhrase) {
        return res.json({
          original: '',
          translated: '',
          detectedLang: sourceLang || 'ar',
          targetLang: targetLang || 'en',
        });
      }

      // Determine explicit source & target
      const resolvedSource = sourceLang ? (sourceLang.startsWith('ar') ? 'ar' : sourceLang.startsWith('en') ? 'en' : sourceLang) : (direction === 'en-ar' ? 'en' : direction === 'ar-en' ? 'ar' : 'auto');
      const resolvedTarget = targetLang ? (targetLang.startsWith('ar') ? 'ar' : targetLang.startsWith('en') ? 'en' : targetLang) : (resolvedSource === 'en' ? 'ar' : 'en');

      const cacheKey = `${cleanPhrase.toLowerCase()}_${resolvedSource}_${resolvedTarget}`;
      if (translationCache.has(cacheKey)) {
        const cached = translationCache.get(cacheKey)!;
        return res.json({
          original: cleanPhrase,
          translated: cached.translated,
          detectedLang: cached.detectedLang,
          targetLang: cached.targetLang,
          cached: true,
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const langMap: Record<string, string> = {
        ar: 'Arabic (العربية)',
        en: 'English',
        fr: 'French (Français)',
        es: 'Spanish (Español)',
        de: 'German (Deutsch)',
        tr: 'Turkish (Türkçe)',
      };

      const srcName = langMap[resolvedSource] || (resolvedSource === 'auto' ? 'the detected source language' : resolvedSource);
      const tgtName = langMap[resolvedTarget] || 'Arabic or English';

      const prompt = `You are a real-time instant live subtitle translator translating from ${srcName} to ${tgtName}.
Text to translate immediately: "${cleanPhrase}".
Rules:
- Translate accurately and immediately into natural ${tgtName}.
- If the text is in ${tgtName} already, keep it or provide the most natural equivalent.
- Maintain concise, clean spoken meaning suitable for instant streaming subtitles.
Return STRICTLY valid JSON:
{
  "original": "${cleanPhrase.replace(/"/g, '\\"')}",
  "translated": "concise translation here",
  "detectedLang": "${resolvedSource === 'auto' ? 'ar' : resolvedSource}",
  "targetLang": "${resolvedTarget}"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text || '{}';
      let data: any = {};
      try {
        data = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        data = JSON.parse(cleaned);
      }

      if (data.translated) {
        // Cache up to 300 recent phrases
        if (translationCache.size > 300) {
          const firstKey = translationCache.keys().next().value;
          if (firstKey) translationCache.delete(firstKey);
        }
        translationCache.set(cacheKey, {
          translated: data.translated,
          detectedLang: data.detectedLang || 'ar',
          targetLang: data.targetLang || 'en',
        });
      }

      return res.json(data);
    } catch (err: any) {
      console.error('Live translate error:', err);
      return res.status(500).json({ error: err?.message || 'Failed to translate' });
    }
  });

  // Setup Vite dev middleware or static serve in production
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`> Sawti Studio server ready at http://0.0.0.0:${port}`);
  });
}

startServer();
