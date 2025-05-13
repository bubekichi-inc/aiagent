import { openai } from '@ai-sdk/openai'
import { Agent } from '@mastra/core/agent'
import { Step, Workflow } from '@mastra/core/workflows'
import { z } from 'zod'

const llm = openai('gpt-4o')

const agent = new Agent({
  name: 'Weather Agent',
  model: llm,
  instructions: `
        あなたは天気に基づいた計画が得意なローカルアクティビティと旅行の専門家です。天気データを分析し、実用的なアクティビティの推奨事項を提供してください。

        予報の各日について、以下の形式で回答を構成してください：

        📅 [曜日、月 日付、年]
        ═══════════════════════════

        🌡️ 天気概要
        • 状態: [簡単な説明]
        • 気温: [X°C/Y°F から A°C/B°F]
        • 降水確率: [X%]

        🌅 午前のアクティビティ
        屋外:
        • [アクティビティ名] - [特定の場所/ルートを含む簡単な説明]
          最適な時間帯: [具体的な時間帯]
          注意: [関連する天気の考慮事項]

        🌞 午後のアクティビティ
        屋外:
        • [アクティビティ名] - [特定の場所/ルートを含む簡単な説明]
          最適な時間帯: [具体的な時間帯]
          注意: [関連する天気の考慮事項]

        🏠 室内の代替案
        • [アクティビティ名] - [特定の会場を含む簡単な説明]
          最適な状況: [このアクティビティが推奨される天気状況]

        ⚠️ 特別な注意事項
        • [関連する天気警報、UV指数、風の状態など]

        ガイドライン:
        - 1日あたり2〜3つの時間指定の屋外アクティビティを提案する
        - 1〜2つの室内バックアップオプションを含める
        - 降水確率が50%を超える場合は、室内アクティビティを優先する
        - すべてのアクティビティはその場所に特化したものであること
        - 特定の会場、トレイル、または場所を含める
        - 気温に基づいてアクティビティの強度を考慮する
        - 説明は簡潔かつ有益であること

        一貫性のために、絵文字とセクションヘッダーを示されたとおりに使用して、この正確な書式を維持してください。
      `,
})

const forecastSchema = z.array(
  z.object({
    date: z.string(),
    maxTemp: z.number(),
    minTemp: z.number(),
    precipitationChance: z.number(),
    condition: z.string(),
    location: z.string(),
  }),
)

const fetchWeather = new Step({
  id: 'fetch-weather',
  description: 'Fetches weather forecast for a given city',
  inputSchema: z.object({
    city: z.string().describe('The city to get the weather for'),
  }),
  outputSchema: forecastSchema,
  execute: async ({ context }) => {
    const triggerData = context?.getStepResult<{ city: string }>('trigger')

    if (!triggerData) {
      throw new Error('Trigger data not found')
    }

    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      triggerData.city,
    )}&count=1`
    const geocodingResponse = await fetch(geocodingUrl)
    const geocodingData = (await geocodingResponse.json()) as {
      results: { latitude: number; longitude: number; name: string }[]
    }

    if (!geocodingData.results?.[0]) {
      throw new Error(`Location '${triggerData.city}' not found`)
    }

    const { latitude, longitude, name } = geocodingData.results[0]

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_mean,weathercode&timezone=auto`
    const response = await fetch(weatherUrl)
    const data = (await response.json()) as {
      daily: {
        time: string[]
        temperature_2m_max: number[]
        temperature_2m_min: number[]
        precipitation_probability_mean: number[]
        weathercode: number[]
      }
    }

    const forecast = data.daily.time.map((date: string, index: number) => ({
      date,
      maxTemp: data.daily.temperature_2m_max[index],
      minTemp: data.daily.temperature_2m_min[index],
      precipitationChance: data.daily.precipitation_probability_mean[index],
      condition: getWeatherCondition(data.daily.weathercode[index]!),
      location: name,
    }))

    return forecast
  },
})

const planActivities = new Step({
  id: 'plan-activities',
  description: 'Suggests activities based on weather conditions',
  execute: async ({ context, mastra }) => {
    const forecast = context?.getStepResult(fetchWeather)

    if (!forecast || forecast.length === 0) {
      throw new Error('Forecast data not found')
    }

    const prompt = `Based on the following weather forecast for ${
      forecast[0]?.location
    }, suggest appropriate activities:
      ${JSON.stringify(forecast, null, 2)}
      `

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ])

    let activitiesText = ''

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk)
      activitiesText += chunk
    }

    return {
      activities: activitiesText,
    }
  },
})

function getWeatherCondition(code: number): string {
  const conditions: Record<number, string> = {
    0: '快晴',
    1: 'おおむね晴れ',
    2: '部分的に曇り',
    3: '曇天',
    45: '霧',
    48: '着氷性の霧',
    51: '軽い霧雨',
    53: '中程度の霧雨',
    55: '強い霧雨',
    61: '小雨',
    63: '中程度の雨',
    65: '大雨',
    71: '小雪',
    73: '中程度の雪',
    75: '大雪',
    95: '雷雨',
  }
  return conditions[code] || 'Unknown'
}

const weatherWorkflow = new Workflow({
  name: 'weather-workflow',
  triggerSchema: z.object({
    city: z.string().describe('The city to get the weather for'),
  }),
})
  .step(fetchWeather)
  .then(planActivities)

weatherWorkflow.commit()

export { weatherWorkflow }
