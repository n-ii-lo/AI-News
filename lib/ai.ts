import OpenAI from 'openai';
import { z } from 'zod';
import { VerdictPayload } from './schemas';
import { retryWithBackoff } from './utils';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Convert Zod schema to JSON Schema for OpenAI
function zodToJsonSchema(): Record<string, unknown> {
  // Simplified conversion for our specific schema
  return {
    type: 'object',
    properties: {
      newsUrl: { type: 'string' },
      newsTitle: { type: 'string' },
      coins: {
        type: 'object',
        properties: {
          BTC: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['up', 'down', 'neutral'] },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              rationale: { type: 'string' },
              horizon: { type: 'string', const: 'tomorrow' }
            },
            required: ['direction', 'confidence', 'rationale', 'horizon'],
            additionalProperties: false
          },
          SOL: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['up', 'down', 'neutral'] },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              rationale: { type: 'string' },
              horizon: { type: 'string', const: 'tomorrow' }
            },
            required: ['direction', 'confidence', 'rationale', 'horizon'],
            additionalProperties: false
          },
          BNB: {
            type: 'object',
            properties: {
              direction: { type: 'string', enum: ['up', 'down', 'neutral'] },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
              rationale: { type: 'string' },
              horizon: { type: 'string', const: 'tomorrow' }
            },
            required: ['direction', 'confidence', 'rationale', 'horizon'],
            additionalProperties: false
          }
        },
        required: ['BTC', 'SOL', 'BNB'],
        additionalProperties: false
      },
      overall: {
        type: 'object',
        properties: {
          bias: { type: 'string', enum: ['bullish', 'bearish', 'mixed', 'neutral'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          rationale: { type: 'string' }
        },
        required: ['bias', 'confidence', 'rationale'],
        additionalProperties: false
      },
      why: {
        type: 'object',
        properties: {
          quotes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                reason: { type: 'string' },
                affects: {
                  type: 'array',
                  items: { type: 'string', enum: ['BTC', 'SOL', 'BNB', 'market'] }
                }
              },
              required: ['text', 'reason', 'affects'],
              additionalProperties: false
            },
            minItems: 1,
            maxItems: 3
          },
          keywords: {
            type: 'array',
            items: { type: 'string' },
            maxItems: 10
          }
        },
        required: ['quotes', 'keywords'],
        additionalProperties: false
      }
    },
    required: ['newsUrl', 'newsTitle', 'coins', 'overall', 'why'],
    additionalProperties: false
  };
}

const systemPrompt = `You are a seasoned crypto market analyst with 10+ years of experience analyzing cryptocurrency markets and news impact. 

Given a news item (title, summary, url, published_at, source), you must return STRICT JSON matching the provided schema. 

Your task:
1. Estimate tomorrow's impact for BTC, SOL, BNB: direction (up/down/neutral), confidence (0-1), and concise rationale
2. Provide overall market bias (bullish/bearish/mixed/neutral) with confidence and rationale
3. Be conservative in your estimates - when uncertain, choose neutral with lower confidence
4. Ground all analysis in the provided news text
5. Add 1-3 short quotes with reasoning and affected assets
6. Extract relevant keywords (max 10)

Guidelines:
- Focus on direct market impact, regulatory changes, adoption news, security incidents
- Consider sentiment, not just facts
- Weight confidence based on news clarity and market relevance
- For ambiguous news, lean neutral with lower confidence
- Always provide actionable rationale

Output JSON only - no additional text.`;

export async function analyzeNewsWithGPT(news: {
  title: string;
  summary?: string | null;
  url: string;
  published_at: string;
  source: string;
}): Promise<z.infer<typeof VerdictPayload>> {
  const jsonSchema = zodToJsonSchema();

  const prompt = `News Title: ${news.title}
${news.summary ? `Summary: ${news.summary}` : ''}
Source: ${news.source}
URL: ${news.url}
Published: ${news.published_at}

Analyze this news for tomorrow's impact on BTC, SOL, and BNB.`;

  return retryWithBackoff(async () => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'verdict_payload',
          schema: jsonSchema,
          strict: true
        }
      },
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    try {
      const parsed = JSON.parse(content);
      const validated = VerdictPayload.safeParse(parsed);
      
      if (!validated.success) {
        console.error('Validation failed:', validated.error);
        throw new Error(`Schema validation failed: ${validated.error.message}`);
      }

      return validated.data;
    } catch (error) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error(`Failed to parse response: ${error}`);
    }
  }, 3, 1000);
}

export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });
    
    return !!response.choices[0]?.message?.content;
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    return false;
  }
}
