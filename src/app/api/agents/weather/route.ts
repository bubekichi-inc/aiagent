import { NextRequest, NextResponse } from 'next/server'
import { mastra } from '@/mastra'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    const agent = mastra.getAgent('weatherAgent')

    const stream = await agent.stream(messages[messages.length - 1].content)

    return stream.toDataStreamResponse()
  } catch (error) {
    return NextResponse.json(
      {
        message: 'エラーが発生しました',
        error: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      },
    )
  }
}
